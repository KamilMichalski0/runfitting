const axios = require('axios');
const geminiConfig = require('../config/gemini.config');
const openaiConfig = require('../config/openai.config');
const { OpenAI } = require('openai');
const AppError = require('../utils/app-error');
// const { getExamplePlanTemplate } = require('../templates/plan-template-selector'); // Może być potrzebne do kontekstu

class PlanModificationService {
  constructor(knowledgeBase) {
    // Konfiguracja Gemini
    this.geminiApiKey = geminiConfig.apiKey;
    this.geminiModel = geminiConfig.model; // Możemy chcieć użyć innego modelu do modyfikacji
    this.geminiApiUrl = geminiConfig.apiUrl;
    this.geminiGenerationConfig = {
      temperature: geminiConfig.temperature, // Dostosuj parametry do modyfikacji
      topK: geminiConfig.topK,
      topP: geminiConfig.topP,
      maxOutputTokens: geminiConfig.maxTokens, // Modyfikacje mogą wymagać mniej tokenów
      responseMimeType: 'application/json',
    };

    // Konfiguracja OpenAI
    this.openaiApiKey = openaiConfig.apiKey;
    if (this.openaiApiKey) {
      this.openai = new OpenAI({ apiKey: this.openaiApiKey });
      this.openaiModel = openaiConfig.model; // Dostosowany model OpenAI do modyfikacji
      this.openaiTemperature = openaiConfig.temperature;
      this.openaiMaxTokens = openaiConfig.maxTokens; // Mniejsza liczba tokenów dla modyfikacji
      this.openaiTopP = openaiConfig.topP;
    } else {
      this.openai = null;
    }

    this.axiosClient = axios.create();
    this.knowledgeBase = knowledgeBase; // Baza wiedzy może być przydatna do kontekstu modyfikacji

    if (!this.knowledgeBase) {
      console.warn('Baza wiedzy nie została dostarczona do PlanModificationService. Modyfikacje mogą być mniej precyzyjne.');
    }

    // TODO: Dodać bindowanie metod
  }

  log(message, data) {
    console.log(`[PlanModificationService] ${message}`, data !== undefined ? data : '');
  }

  error(message, errorData) {
    console.error(`[PlanModificationService] ${message}`, errorData !== undefined ? errorData : '');
  }

  _createModificationPromptForDay(originalPlan, weekIndex, dayIndex, userData, modificationReason) {
    // TODO: Zaimplementować tworzenie promptu dla modyfikacji dnia
    // Prompt powinien zawierać:
    // - Część oryginalnego planu (szczególnie modyfikowany tydzień i dzień)
    // - Pełne dane użytkownika (userData)
    // - Informacje o strefach tętna, tempach (jeśli dostępne w userData lub planie)
    // - Jasną instrukcję, co należy zmodyfikować (np. "użytkownik prosi o lżejszy trening tego dnia z powodu zmęczenia")
    // - Wymagany format odpowiedzi (JSON dla zmodyfikowanego dnia)
    this.log('Tworzenie promptu do modyfikacji dnia', { weekIndex, dayIndex, modificationReason });
    const dayToModify = originalPlan.plan_weeks[weekIndex].days[dayIndex];
    
    // Uproszczony przykład - wymaga rozbudowy
    return `
      Jesteś ekspertem AI pomagającym modyfikować plany treningowe.
      Użytkownik: ${JSON.stringify(userData, null, 2)}
      Oryginalny plan (fragment): 
      Tydzień ${weekIndex + 1}, Dzień: ${dayToModify.day_name}
      Trening: ${JSON.stringify(dayToModify.workout, null, 2)}

      Powód modyfikacji: "${modificationReason}"

      Zadanie: Zmodyfikuj powyższy trening (tylko ten jeden dzień). 
      Zachowaj strukturę JSON dnia treningowego.
      Odpowiedz TYLKO zmodyfikowanym obiektem JSON dla tego dnia (zawierającym "day_name" i "workout").
      Nie dodawaj żadnego tekstu przed ani po JSON.
      Przykład odpowiedzi:
      {
        "day_name": "${dayToModify.day_name}",
        "workout": { ...zmodyfikowane dane treningu... }
      }
    `;
  }

  _createModificationPromptForWeek(originalPlan, weekIndex, userData, modificationReason) {
    // TODO: Zaimplementować tworzenie promptu dla modyfikacji tygodnia
    this.log('Tworzenie promptu do modyfikacji tygodnia', { weekIndex, modificationReason });
    const weekToModify = originalPlan.plan_weeks[weekIndex];
    
    // Uproszczony przykład
    return `
      Jesteś ekspertem AI pomagającym modyfikować plany treningowe.
      Użytkownik: ${JSON.stringify(userData, null, 2)}
      Oryginalny tydzień do modyfikacji (tydzień ${weekIndex + 1}): 
      ${JSON.stringify(weekToModify, null, 2)}

      Powód modyfikacji: "${modificationReason}"

      Zadanie: Zmodyfikuj cały powyższy tydzień treningowy.
      Zachowaj strukturę JSON tygodnia treningowego (zawierającego "week_num", "focus", "days").
      Odpowiedz TYLKO zmodyfikowanym obiektem JSON dla tego tygodnia.
      Nie dodawaj żadnego tekstu przed ani po JSON.
      Przykład odpowiedzi:
      {
        "week_num": ${weekToModify.week_num},
        "focus": "...nowy lub zmodyfikowany focus...",
        "days": [ ...zmodyfikowane dni... ]
      }
    `;
  }

  async _callAIForModification(prompt, isDayModification) {
    // Logika wywołania Gemini API (podobna do tej w GeminiService)
    if (this.geminiApiKey) {
      try {
        this.log('Próba modyfikacji przez Gemini...');
        const requestUrl = `${this.geminiApiUrl}/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`;
        const requestBody = {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: this.geminiGenerationConfig,
          // Można dostosować safetySettings jeśli to konieczne
        };
        const response = await this.axiosClient.post(requestUrl, requestBody, {
          headers: { 'Content-Type': 'application/json' },
        });
        this.log('Otrzymano odpowiedź z Gemini.');
        return this._parseModificationResponse(response.data, isDayModification);
      } catch (geminiError) {
        this.error('Błąd podczas modyfikacji przez Gemini:', geminiError.message);
        if (geminiError.response) {
            this.error('Gemini Error Response Status:', geminiError.response.status);
            this.error('Gemini Error Response Data:', geminiError.response.data);
        }
        // Fallback do OpenAI jeśli Gemini zawiedzie
      }
    }

    // Logika wywołania OpenAI API (podobna do tej w GeminiService)
    if (this.openai) {
      try {
        this.log('Próba modyfikacji przez OpenAI (fallback)...');
        const messages = [
          { role: 'system', content: 'Jesteś ekspertem AI modyfikującym plany treningowe. Zwróć tylko JSON.' },
          { role: 'user', content: prompt }
        ];
        const requestBody = {
          model: this.openaiModel,
          messages: messages,
          temperature: this.openaiTemperature,
          max_tokens: this.openaiMaxTokens,
          top_p: this.openaiTopP,
          response_format: { type: "json_object" },
        };
        const response = await this.openai.chat.completions.create(requestBody);
        this.log('Otrzymano odpowiedź z OpenAI.');
        return this._parseOpenAIModificationResponse(response, isDayModification);
      } catch (openaiError) {
        this.error('Błąd podczas modyfikacji przez OpenAI:', openaiError.message);
        if (openaiError.response) {
            this.error('OpenAI Error Response Status:', openaiError.response.status);
            this.error('OpenAI Error Response Data:', openaiError.response.data);
        }
      }
    }
    
    throw new AppError('Nie udało się zmodyfikować planu za pomocą dostępnych modeli AI.', 500);
  }

  _parseModificationResponse(apiResponse, isDayModification) {
    // TODO: Zaimplementować parsowanie odpowiedzi z Gemini (podobne do GeminiService._parseResponse)
    // Należy upewnić się, że zwracany jest poprawny fragment JSON (dzień lub tydzień)
    this.log('Parsowanie odpowiedzi Gemini (modyfikacja)');
    try {
        if (!apiResponse || !apiResponse.candidates || !apiResponse.candidates[0] || !apiResponse.candidates[0].content || !apiResponse.candidates[0].content.parts || !apiResponse.candidates[0].content.parts[0].text) {
            throw new Error('Nieprawidłowa struktura odpowiedzi Gemini.');
        }
        const jsonString = apiResponse.candidates[0].content.parts[0].text;
        const modifiedPart = JSON.parse(jsonString);
        
        // TODO: Dodać walidację struktury zmodyfikowanego dnia/tygodnia
        this.log('Pomyślnie sparsowano odpowiedź Gemini (modyfikacja).');
        return modifiedPart;
    } catch (e) {
        this.error('Błąd parsowania odpowiedzi Gemini (modyfikacja):', e.message);
        throw new AppError('Nie udało się sparsować odpowiedzi AI (Gemini) dla modyfikacji.', 500);
    }
  }

  _parseOpenAIModificationResponse(apiResponse, isDayModification) {
    // TODO: Zaimplementować parsowanie odpowiedzi z OpenAI (podobne do GeminiService._parseOpenAIResponse)
    this.log('Parsowanie odpowiedzi OpenAI (modyfikacja)');
    try {
        if (!apiResponse || !apiResponse.choices || !apiResponse.choices[0] || !apiResponse.choices[0].message || !apiResponse.choices[0].message.content) {
            throw new Error('Nieprawidłowa struktura odpowiedzi OpenAI.');
        }
        const jsonString = apiResponse.choices[0].message.content;
        const modifiedPart = JSON.parse(jsonString);

        // TODO: Dodać walidację struktury zmodyfikowanego dnia/tygodnia
        this.log('Pomyślnie sparsowano odpowiedź OpenAI (modyfikacja).');
        return modifiedPart;
    } catch (e) {
        this.error('Błąd parsowania odpowiedzi OpenAI (modyfikacja):', e.message);
        throw new AppError('Nie udało się sparsować odpowiedzi AI (OpenAI) dla modyfikacji.', 500);
    }
  }

  /**
   * Modyfikuje pojedynczy dzień w planie treningowym.
   * @param {Object} originalPlan - Oryginalny obiekt planu treningowego.
   * @param {number} weekIndex - Indeks tygodnia (0-based).
   * @param {number} dayIndex - Indeks dnia w tygodniu (0-based).
   * @param {Object} userData - Dane użytkownika.
   * @param {string} modificationReason - Powód modyfikacji.
   * @returns {Promise<Object>} Zmodyfikowany obiekt dnia.
   */
  async modifyDayInPlan(originalPlan, weekIndex, dayIndex, userData, modificationReason) {
    this.log('Rozpoczęcie modyfikacji dnia w planie', { planId: originalPlan._id, weekIndex, dayIndex });
    if (!originalPlan || !originalPlan.plan_weeks || !originalPlan.plan_weeks[weekIndex] || !originalPlan.plan_weeks[weekIndex].days[dayIndex]) {
      throw new AppError('Nieprawidłowy plan lub indeksy do modyfikacji dnia.', 400);
    }

    const prompt = this._createModificationPromptForDay(originalPlan, weekIndex, dayIndex, userData, modificationReason);
    const modifiedDayObject = await this._callAIForModification(prompt, true);
    
    // Walidacja czy odpowiedź jest prawidłowym obiektem dnia
    if (!modifiedDayObject || typeof modifiedDayObject.day_name !== 'string' || typeof modifiedDayObject.workout !== 'object') {
        throw new AppError('AI zwróciło nieprawidłowy format dla zmodyfikowanego dnia.', 500);
    }
    
    this.log('Dzień pomyślnie zmodyfikowany przez AI.');
    return modifiedDayObject; // Zwracamy tylko zmodyfikowany obiekt dnia
  }

  /**
   * Modyfikuje cały tydzień w planie treningowym.
   * @param {Object} originalPlan - Oryginalny obiekt planu treningowego.
   * @param {number} weekIndex - Indeks tygodnia (0-based).
   * @param {Object} userData - Dane użytkownika.
   * @param {string} modificationReason - Powód modyfikacji.
   * @returns {Promise<Object>} Zmodyfikowany obiekt tygodnia.
   */
  async modifyWeekInPlan(originalPlan, weekIndex, userData, modificationReason) {
    this.log('Rozpoczęcie modyfikacji tygodnia w planie', { planId: originalPlan._id, weekIndex });
    if (!originalPlan || !originalPlan.plan_weeks || !originalPlan.plan_weeks[weekIndex]) {
      throw new AppError('Nieprawidłowy plan lub indeks tygodnia do modyfikacji.', 400);
    }

    const prompt = this._createModificationPromptForWeek(originalPlan, weekIndex, userData, modificationReason);
    const modifiedWeekObject = await this._callAIForModification(prompt, false);

    // Walidacja czy odpowiedź jest prawidłowym obiektem tygodnia
    if (!modifiedWeekObject || typeof modifiedWeekObject.week_num !== 'number' || !Array.isArray(modifiedWeekObject.days)) {
        throw new AppError('AI zwróciło nieprawidłowy format dla zmodyfikowanego tygodnia.', 500);
    }

    this.log('Tydzień pomyślnie zmodyfikowany przez AI.');
    return modifiedWeekObject; // Zwracamy tylko zmodyfikowany obiekt tygodnia
  }
}

module.exports = PlanModificationService; 