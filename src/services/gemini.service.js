const axios = require('axios');
const config = require('../config/gemini.config');
const AppError = require('../utils/app-error');

class GeminiService {
  constructor() {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl;
    this.model = config.model;
    this.axiosClient = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
  }

  /**
   * Generuje plan treningowy przy użyciu Gemini API
   * @param {Object} userData - Dane użytkownika
   * @returns {Promise<Object>} Wygenerowany plan treningowy
   */
  async generateTrainingPlan(userData) {
    try {
      const prompt = this._createPrompt(userData);
      
      const response = await this.axiosClient.post('/v1/models/gemini-pro:generateContent', {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: config.temperature,
          topK: config.topK,
          topP: config.topP,
          maxOutputTokens: config.maxTokens
        }
      });

      return this._parseResponse(response.data);
    } catch (error) {
      console.error('Błąd podczas generowania planu przez Gemini:', error);
      throw new AppError('Nie udało się wygenerować planu treningowego', 500);
    }
  }

  /**
   * Tworzy prompt dla Gemini API
   * @param {Object} userData - Dane użytkownika
   * @returns {String} Sformatowany prompt
   */
  _createPrompt(userData) {
    return `Wygeneruj plan treningowy dla biegacza powracającego po kontuzji. 
    Dane użytkownika:
    - Wiek: ${userData.age}
    - Poziom zaawansowania: ${userData.level}
    - Historia kontuzji: ${userData.injuryHistory}
    - Obecne dolegliwości: ${userData.currentSymptoms}
    - Częstotliwość treningów przed kontuzją: ${userData.previousTrainingFrequency}
    - Dystans przed kontuzją: ${userData.previousDistance}
    
    Plan powinien być w formacie JSON zgodnym z następującą strukturą:
    {
      "id": "running_return_[kontuzja]_[dni]_[tygodnie]",
      "metadata": {
        "discipline": "running",
        "target_group": "Biegacze powracający po [kontuzja]",
        "target_goal": "return_after_injury",
        "level_hint": "[poziom]",
        "days_per_week": "Stopniowo do [liczba]",
        "duration_weeks": [liczba],
        "description": "[szczegółowy opis planu]",
        "author": "Generator Fizjo AI"
      },
      "plan_weeks": [
        {
          "week_num": [numer],
          "focus": "[cel tygodnia]",
          "days": [
            {
              "day_name": "[dzień]",
              "workout": "[trening]"
            }
          ]
        }
      ],
      "corrective_exercises": {
        "frequency": "[częstotliwość]",
        "list": [
          {
            "name": "[nazwa]",
            "description": "[opis]",
            "sets_reps": "[serie i powtórzenia]"
          }
        ]
      },
      "pain_monitoring": {
        "scale": "Używaj skali bólu 0-10 (0 = brak bólu, 10 = ból nie do zniesienia)",
        "rules": [
          "[zasady monitorowania bólu]"
        ]
      },
      "notes": [
        "[uwagi]"
      ]
    }
    
    Plan powinien być:
    1. Bardzo ostrożny w powrocie do aktywności
    2. Zawierać szczegółowe instrukcje monitorowania bólu
    3. Uwzględniać ćwiczenia korekcyjne
    4. Zawierać jasne wskazówki dotyczące postępowania w przypadku bólu
    5. Być dostosowany do poziomu zaawansowania użytkownika
    6. Zawierać szczegółowe instrukcje rozgrzewki i schłodzenia
    7. Uwzględniać cross-training jako alternatywę
    8. Zawierać szczegółowe uwagi dotyczące techniki i nawierzchni`;
  }

  /**
   * Parsuje odpowiedź z Gemini API
   * @param {Object} response - Odpowiedź z API
   * @returns {Object} Sformatowany plan treningowy
   */
  _parseResponse(response) {
    try {
      const content = response.candidates[0].content.parts[0].text;
      const plan = JSON.parse(content);
      
      // Walidacja podstawowej struktury
      if (!plan.id || !plan.metadata || !plan.plan_weeks) {
        throw new Error('Nieprawidłowa struktura planu');
      }

      return plan;
    } catch (error) {
      console.error('Błąd podczas parsowania odpowiedzi:', error);
      throw new AppError('Nieprawidłowa odpowiedź z API', 500);
    }
  }
}

module.exports = new GeminiService(); 