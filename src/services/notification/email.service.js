const nodemailer = require('nodemailer');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { fromNodeProviderChain } = require('@aws-sdk/credential-provider-node');
const path = require('path');
const fs = require('fs').promises;
const { notificationConfig } = require('../../config/notification.config');
const logger = require('../../utils/logger');
const AppError = require('../../utils/app-error');

/**
 * Serwis powiadomień email
 * Obsługuje wysyłanie wiadomości email przez AWS SES
 */
class EmailService {
  constructor() {
    this.sesClient = null;
    this.isConfigured = false;
    this.sentToday = 0;
    this.sentThisHour = 0;
    this.usersSentToday = new Map();
    this.templateCache = new Map();
    
    this.initialize();
    this.setupHourlyReset();
    this.setupDailyReset();
  }

  /**
   * Inicjalizacja klienta AWS SES
   */
  async initialize() {
    try {
      const emailConfig = notificationConfig.email;
      
      // Konfiguracja AWS SES
      if (!emailConfig.ses.credentials.accessKeyId || !emailConfig.ses.credentials.secretAccessKey) {
        logger.warn('Email service: AWS SES credentials not configured');
        return;
      }

      // Inicjalizacja klienta SES z AWS SDK v3
      this.sesClient = new SESClient({
        region: emailConfig.ses.region,
        credentials: fromNodeProviderChain(),
        maxAttempts: 3
      });

      this.isConfigured = true;
      logger.info('Email service initialized successfully using AWS SES');
    } catch (error) {
      logger.error('Email service initialization failed:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Wysyłanie wiadomości email
   * @param {Object} params - Parametry wiadomości
   * @param {string} params.to - Adres odbiorcy
   * @param {string} params.type - Typ powiadomienia
   * @param {Object} params.data - Dane do podstawienia w szablonie
   * @param {Object} params.options - Dodatkowe opcje
   * @returns {Promise<Object>} Wynik wysyłania
   */
  async sendEmail({
    to,
    type,
    data = {},
    options = {}
  }) {
    try {
      // Sprawdź czy serwis jest skonfigurowany
      if (!this.isConfigured) {
        throw new AppError('Email service is not configured', 500);
      }

      // Sprawdź limity wysyłania
      await this.checkLimits(to);

      // Przygotuj zawartość wiadomości
      const emailContent = await this.prepareEmailContent(type, data, options);

      // Przygotuj parametry dla AWS SES
      const params = {
        Source: options.from || notificationConfig.email.defaults.from,
        Destination: {
          ToAddresses: [to]
        },
        Message: {
          Subject: {
            Data: emailContent.subject,
            Charset: 'UTF-8'
          },
          Body: {
            Text: {
              Data: emailContent.text,
              Charset: 'UTF-8'
            },
            Html: {
              Data: emailContent.html,
              Charset: 'UTF-8'
            }
          }
        },
        ConfigurationSetName: process.env.AWS_SES_CONFIGURATION_SET,
        Tags: [
          {
            Name: 'NotificationType',
            Value: type
          },
          {
            Name: 'UserId',
            Value: options.userId || 'unknown'
          }
        ]
      };

      // Wysyłanie wiadomości z timeoutem
      const result = await Promise.race([
        this.sesClient.send(new SendEmailCommand(params)),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email sending timeout')), 
                    notificationConfig.global.timeouts.email)
        )
      ]);

      // Aktualizuj liczniki
      this.updateCounters(to);

      logger.info(`Email sent successfully to ${to}, type: ${type}`, {
        messageId: result.MessageId,
        type,
        to,
        provider: 'aws-ses'
      });

      return {
        success: true,
        messageId: result.MessageId,
        provider: 'aws-ses',
        channel: 'email',
        timestamp: new Date()
      };

    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      
      throw new AppError(
        `Email sending failed: ${error.message}`,
        error.name === 'MessageRejected' ? 502 : 500,
        {
          to,
          type,
          provider: 'aws-ses',
          originalError: error.message
        }
      );
    }
  }

  /**
   * Przygotowanie zawartości wiadomości email
   * @param {string} type - Typ powiadomienia
   * @param {Object} data - Dane do podstawienia
   * @param {Object} options - Opcje
   * @returns {Promise<Object>} Zawartość email
   */
  async prepareEmailContent(type, data, options) {
    const emailConfig = notificationConfig.email;
    
    // Pobierz lub wygeneruj subject
    const subject = options.subject || 
                   emailConfig.templates.subjects[type] || 
                   'RunFitting - Powiadomienie';

    // Pobierz szablon HTML
    const htmlTemplate = await this.getEmailTemplate(type);
    
    // Wygeneruj zawartość HTML
    const html = this.renderTemplate(htmlTemplate, {
      ...data,
      userName: data.userName || 'Użytkowniku',
      appName: 'RunFitting',
      supportEmail: 'support@runfitting.com',
      unsubscribeUrl: this.generateUnsubscribeUrl(data.userId, type),
      baseUrl: process.env.FRONTEND_URL || 'https://runfitting.com'
    });

    // Wygeneruj wersję tekstową z HTML
    const text = this.htmlToText(html);

    return {
      subject: this.renderTemplate(subject, data),
      html,
      text
    };
  }

  /**
   * Pobranie szablonu email
   * @param {string} type - Typ powiadomienia
   * @returns {Promise<string>} Szablon HTML
   */
  async getEmailTemplate(type) {
    // Sprawdź cache
    if (this.templateCache.has(type)) {
      return this.templateCache.get(type);
    }

    try {
      const templatePath = path.join(
        __dirname, 
        '../../templates/email', 
        `${type}.html`
      );
      
      // Spróbuj wyczytać specyficzny szablon
      let template;
      try {
        template = await fs.readFile(templatePath, 'utf8');
      } catch (error) {
        // Jeśli nie ma specyficznego szablonu, użyj domyślnego
        logger.warn(`Template not found for ${type}, using default template`);
        template = await this.getDefaultEmailTemplate();
      }

      // Zapisz w cache
      this.templateCache.set(type, template);
      return template;

    } catch (error) {
      logger.error(`Failed to load email template for ${type}:`, error);
      return this.getDefaultEmailTemplate();
    }
  }

  /**
   * Domyślny szablon email
   * @returns {string} Szablon HTML
   */
  getDefaultEmailTemplate() {
    return `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{subject}}</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px; 
            }
            .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 20px; 
                text-align: center; 
                border-radius: 8px 8px 0 0; 
            }
            .content { 
                background: #f9f9f9; 
                padding: 30px; 
                border-radius: 0 0 8px 8px; 
            }
            .footer { 
                text-align: center; 
                margin-top: 30px; 
                padding-top: 20px; 
                border-top: 1px solid #ddd; 
                font-size: 12px; 
                color: #666; 
            }
            .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background: #667eea; 
                color: white; 
                text-decoration: none; 
                border-radius: 4px; 
                margin: 15px 0; 
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>{{appName}}</h1>
        </div>
        <div class="content">
            <h2>Cześć {{userName}}!</h2>
            <p>{{content}}</p>
            {{#actionUrl}}
            <a href="{{actionUrl}}" class="button">Zobacz szczegóły</a>
            {{/actionUrl}}
        </div>
        <div class="footer">
            <p>Wiadomość została wysłana z systemu {{appName}}</p>
            <p>Jeśli nie chcesz otrzymywać takich wiadomości, 
               <a href="{{unsubscribeUrl}}">wypisz się tutaj</a></p>
            <p>W razie pytań skontaktuj się z nami: {{supportEmail}}</p>
        </div>
    </body>
    </html>`;
  }

  /**
   * Renderowanie szablonu z danymi
   * @param {string} template - Szablon
   * @param {Object} data - Dane
   * @returns {string} Wyrenderowany szablon
   */
  renderTemplate(template, data) {
    let rendered = template;
    
    // Podstawienie zmiennych {{variable}}
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, value || '');
    }
    
    // Obsługa warunków {{#variable}} ... {{/variable}}
    rendered = rendered.replace(/{{#(\w+)}}([\s\S]*?){{\/\1}}/g, (match, key, content) => {
      return data[key] ? content : '';
    });
    
    // Usuń pozostałe nieużyte zmienne
    rendered = rendered.replace(/{{[^}]+}}/g, '');
    
    return rendered;
  }

  /**
   * Konwersja HTML na tekst
   * @param {string} html - HTML
   * @returns {string} Tekst
   */
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '') // Usuń tagi HTML
      .replace(/&nbsp;/g, ' ') // Zamień &nbsp; na spacje
      .replace(/&lt;/g, '<')   // Dekoduj encje HTML
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')    // Normalizuj białe znaki
      .trim();
  }

  /**
   * Sprawdzenie limitów wysyłania
   * @param {string} to - Adres odbiorcy
   */
  async checkLimits(to) {
    const limits = notificationConfig.email.limits;
    
    // Sprawdź limit dzienny
    if (this.sentToday >= limits.dailyLimit) {
      throw new AppError('Daily email limit exceeded', 429);
    }
    
    // Sprawdź limit godzinny
    if (this.sentThisHour >= limits.hourlyLimit) {
      throw new AppError('Hourly email limit exceeded', 429);
    }
    
    // Sprawdź limit dzienny per użytkownik
    const userCount = this.usersSentToday.get(to) || 0;
    if (userCount >= limits.perUserDailyLimit) {
      throw new AppError('Daily email limit per user exceeded', 429);
    }
  }

  /**
   * Aktualizacja liczników
   * @param {string} to - Adres odbiorcy
   */
  updateCounters(to) {
    this.sentToday++;
    this.sentThisHour++;
    
    const userCount = this.usersSentToday.get(to) || 0;
    this.usersSentToday.set(to, userCount + 1);
  }

  /**
   * Mapowanie priorytetu na priorytet email
   * @param {string} priority - Priorytet
   * @returns {string} Priorytet email
   */
  mapPriorityToEmailPriority(priority) {
    const mapping = {
      'urgent': 'high',
      'high': 'high',
      'normal': 'normal',
      'low': 'low'
    };
    return mapping[priority] || 'normal';
  }

  /**
   * Generowanie URL do wypisania się
   * @param {string} userId - ID użytkownika
   * @param {string} type - Typ powiadomienia
   * @returns {string} URL
   */
  generateUnsubscribeUrl(userId, type) {
    const baseUrl = process.env.FRONTEND_URL || 'https://runfitting.com';
    return `${baseUrl}/unsubscribe?user=${userId}&type=${type}`;
  }

  /**
   * Reset licznika godzinnego
   */
  setupHourlyReset() {
    setInterval(() => {
      this.sentThisHour = 0;
      logger.debug('Email service: Hourly counter reset');
    }, 60 * 60 * 1000); // Co godzinę
  }

  /**
   * Reset licznika dziennego
   */
  setupDailyReset() {
    setInterval(() => {
      this.sentToday = 0;
      this.usersSentToday.clear();
      logger.debug('Email service: Daily counters reset');
    }, 24 * 60 * 60 * 1000); // Co 24 godziny
  }

  /**
   * Sprawdzenie statusu usługi
   * @returns {Object} Status
   */
  async getStatus() {
    return {
      configured: this.isConfigured,
      sentToday: this.sentToday,
      sentThisHour: this.sentThisHour,
      limits: notificationConfig.email.limits,
      cacheSize: this.templateCache.size
    };
  }

  /**
   * Wysyłka testowa
   * @param {string} to - Adres odbiorcy
   * @returns {Promise<Object>} Wynik
   */
  async sendTest(to) {
    return this.sendEmail({
      to,
      type: 'system_notification',
      data: {
        content: 'To jest wiadomość testowa z serwisu powiadomień RunFitting.',
        userName: 'Tester'
      },
      options: {
        subject: 'Test powiadomień RunFitting'
      }
    });
  }

  /**
   * Czyszczenie cache szablonów
   */
  clearTemplateCache() {
    this.templateCache.clear();
    logger.info('Email template cache cleared');
  }
}

module.exports = EmailService; 