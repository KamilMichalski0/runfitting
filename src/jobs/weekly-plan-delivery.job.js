const cron = require('node-cron');
const WeeklyPlanDeliveryService = require('../services/weekly-plan-delivery.service');
const { logInfo, logError } = require('../utils/logger');

/**
 * Job odpowiedzialny za automatyczne dostarczanie planów tygodniowych
 * Uruchamiany codziennie o 18:30 aby sprawdzić czy są harmonogramy wymagające dostarczania
 */
class WeeklyPlanDeliveryJob {
  constructor() {
    this.weeklyPlanDeliveryService = new WeeklyPlanDeliveryService();
    this.isRunning = false;
  }

  /**
   * Uruchamia cron job
   */
  start() {
    // Uruchamianie codziennie o 18:30
    cron.schedule('30 18 * * *', async () => {
      const startTime = Date.now();
      logInfo('Rozpoczęcie głównego job dostarczania planów');
      
      try {
        await this.processDeliveries();
        const duration = Date.now() - startTime;
        logInfo(`Zakończono główny job w ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;
        logError(`Błąd w głównym job po ${duration}ms:`, error);
      }
    }, {
      timezone: "Europe/Warsaw"
    });

    // Dodatkowe uruchomienie co godzinę dla harmonogramów które mogły zostać pominięte
    cron.schedule('0 * * * *', async () => {
      const startTime = Date.now();
      logInfo('Rozpoczęcie sprawdzania opóźnionych dostaw');
      
      try {
        await this.processOverdueDeliveries();
        const duration = Date.now() - startTime;
        logInfo(`Zakończono sprawdzanie opóźnionych dostaw w ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;
        logError(`Błąd sprawdzania opóźnionych dostaw po ${duration}ms:`, error);
      }
    }, {
      timezone: "Europe/Warsaw"
    });

    logInfo('Uruchomiono cron job dla dostarczania planów tygodniowych');
  }

  /**
   * Przetwarza wszystkie zaplanowane dostawy
   */
  async processDeliveries() {
    if (this.isRunning) {
      logInfo('Job już jest uruchomiony, pomijam');
      return;
    }

    this.isRunning = true;
    
    try {
      logInfo('Rozpoczęcie przetwarzania zaplanowanych dostaw planów');
      
      const results = await this.weeklyPlanDeliveryService.processScheduledDeliveries();
      
      logInfo(`Zakończono przetwarzanie dostaw: ${results.successful}/${results.processed} pomyślnych`);
      
      // Logowanie błędów jeśli wystąpiły
      if (results.errors.length > 0) {
        logError('Błędy podczas przetwarzania dostaw:', results.errors);
      }
      
    } catch (error) {
      logError('Błąd podczas wykonywania job dostarczania planów', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Przetwarza dostawy które mogły zostać pominięte (harmonogramy zaległe)
   */
  async processOverdueDeliveries() {
    if (this.isRunning) {
      logInfo('Główny job jest uruchomiony, pomijam sprawdzanie opóźnionych dostaw');
      return;
    }

    try {
      // Dodaj timeout do całej operacji (max 5 minut)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: operacja przekroczyła 5 minut')), 5 * 60 * 1000);
      });

      const processingPromise = this.processOverdueDeliveriesInternal();
      
      await Promise.race([processingPromise, timeoutPromise]);
      
    } catch (error) {
      logError('Błąd podczas przetwarzania opóźnionych dostaw', error);
    }
  }

  /**
   * Wewnętrzna metoda przetwarzania opóźnionych dostaw
   */
  async processOverdueDeliveriesInternal() {
    // Sprawdź tylko harmonogramy które są opóźnione o więcej niż 1 godzinę
    const WeeklyPlanSchedule = require('../models/weekly-plan-schedule.model');
    
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    // Sprawdź czy istnieją aktywne harmonogramy w ogóle
    const totalActiveSchedules = await WeeklyPlanSchedule.countDocuments({ isActive: true });
    
    if (totalActiveSchedules === 0) {
      logInfo('Brak aktywnych harmonogramów - pomijam sprawdzanie opóźnionych dostaw');
      return;
    }
    
    const overdueSchedules = await WeeklyPlanSchedule.find({
      isActive: true,
      nextDeliveryDate: { 
        $lte: oneHourAgo,
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // nie starsze niż 24h
      },
      $or: [
        { pausedUntil: { $exists: false } },
        { pausedUntil: { $lte: new Date() } }
      ]
    }).limit(5); // Ograniczenie do maksymalnie 5 harmonogramów na raz

    logInfo(`Sprawdzanie opóźnionych dostaw: ${overdueSchedules.length}/${totalActiveSchedules} harmonogramów wymaga uwagi`);

    if (overdueSchedules.length > 0) {
      logInfo(`Znaleziono ${overdueSchedules.length} opóźnionych harmonogramów`);
      
      // Przetwarzaj po jednym z delay'em
      for (const schedule of overdueSchedules) {
        try {
          await this.weeklyPlanDeliveryService.generateWeeklyPlan(schedule);
          logInfo(`Dostarczone opóźniony plan dla użytkownika ${schedule.userId}`);
          
          // Dodaj małe opóźnienie między przetwarzaniem harmonogramów
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          logError(`Błąd dostarczania opóźnionego planu dla użytkownika ${schedule.userId}`, error);
        }
      }
    } else {
      logInfo('Brak opóźnionych harmonogramów do przetworzenia');
    }
  }

  /**
   * Zatrzymuje cron job
   */
  stop() {
    // W node-cron nie ma bezpośredniej metody stop dla pojedynczego job
    // Można by przechowywać referencje i je niszczyć
    logInfo('Zatrzymano cron job dla dostarczania planów tygodniowych');
  }

  /**
   * Uruchamia ręcznie przetwarzanie dostaw (do testowania)
   */
  async runManually() {
    logInfo('Ręczne uruchomienie przetwarzania dostaw');
    await this.processDeliveries();
  }
}

// Eksport instancji singleton
const weeklyPlanDeliveryJob = new WeeklyPlanDeliveryJob();

module.exports = weeklyPlanDeliveryJob; 