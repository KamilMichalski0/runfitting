const { logInfo, logError } = require('../utils/logger');
const AppError = require('../utils/app-error');
const axios = require('axios');

/**
 * Serwis odpowiedzialny za generowanie planów treningowych
 * wykorzystujący zewnętrzne API (np. Gemini)
 */
class PlanGeneratorService {
  constructor() {
    this.apiUrl = process.env.GEMINI_API_URL || 'https://api.gemini.google.com/v1/models/gemini-pro:generateContent';
    this.apiKey = process.env.GEMINI_API_KEY;
  }

  /**
   * Generuje plan treningowy na podstawie danych użytkownika
   * @param {Object} userData - Dane użytkownika z formularza
   * @returns {Object} Wygenerowany plan treningowy
   */
  async generatePlan(userData) {
    try {
      if (!this.apiKey) {
        throw new AppError('Brak klucza API dla serwisu Gemini', 500);
      }

      // Przygotowanie danych do zapytania w formacie rozumianym przez Gemini API
      const prompt = this.preparePrompt(userData);
      
      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096
          }
        }
      );

      // Przetworzenie odpowiedzi z Gemini na format planu treningowego
      const generatedText = response.data.candidates[0].content.parts[0].text;
      const plan = this.parseGeneratedPlan(generatedText, userData);
      
      logInfo(`Wygenerowano plan treningowy dla użytkownika: ${userData.firstName || userData.name || 'Nieznany'}`);
      
      return plan;
    } catch (error) {
      logError('Błąd podczas generowania planu treningowego', error);
      throw new AppError('Nie udało się wygenerować planu treningowego', 500);
    }
  }

  /**
   * Przygotowuje prompt dla modelu AI
   * @param {Object} userData - Dane użytkownika 
   * @returns {string} Prompt dla modelu AI
   */
  preparePrompt(userData) {
    // Pobieranie danych w obu formatach
    const firstName = userData.firstName || userData.name || 'Biegacz';
    const age = userData.age || 30;
    const experienceLevel = userData.experienceLevel || userData.level || 'początkujący';
    const mainGoal = userData.mainGoal || userData.goal || 'poprawa kondycji';
    const weeklyKilometers = userData.weeklyKilometers || userData.weeklyDistance || 20;
    const trainingDaysPerWeek = userData.trainingDaysPerWeek || userData.daysPerWeek || 3;
    const hasInjuries = userData.hasInjuries || false;
    const description = userData.description || '';

    return `Wygeneruj 6-tygodniowy plan treningowy dla biegacza o następujących parametrach:
Imię: ${firstName}
Wiek: ${age}
Poziom doświadczenia: ${experienceLevel}
Główny cel: ${mainGoal}
Aktualny tygodniowy przebieg: ${weeklyKilometers} km
Preferowana liczba dni treningowych w tygodniu: ${trainingDaysPerWeek}
Kontuzje: ${hasInjuries ? 'Tak' : 'Nie'}
Dodatkowe informacje: ${description}

Plan powinien zawierać:
1. Krótki opis planu i jego celów
2. Szczegółowy rozkład treningów na każdy tydzień, gdzie każdy trening zawiera:
   - Typ treningu (np. interwały, tempo, długi bieg)
   - Dystans lub czas
   - Intensywność (np. strefa tętna, tempo)
   - Cel treningu
3. Wskazówki dotyczące odpoczynku i regeneracji
4. Sugestie dotyczące treningu uzupełniającego

Format odpowiedzi powinien być ustrukturyzowany w sposób przyjazny dla JSON, z podziałem na tygodnie i dni treningowe.`;
  }

  /**
   * Parsuje wygenerowany tekst na format planu treningowego
   * @param {string} generatedText - Tekst wygenerowany przez model AI
   * @param {Object} userData - Dane użytkownika
   * @returns {Object} Przetworzony plan treningowy
   */
  parseGeneratedPlan(generatedText, userData) {
    try {
      // Próba bezpośredniego parsowania jako JSON
      // W niektórych przypadkach model może zwrócić poprawny JSON
      try {
        const jsonPlan = JSON.parse(generatedText);
        if (jsonPlan && typeof jsonPlan === 'object') {
          return this.formatPlan(jsonPlan, userData);
        }
      } catch (e) {
        // Kontynuuj do parsowania tekstowego, jeśli JSON parsing nie zadziałał
      }

      // Podstawowe parsowanie tekstu na strukturę planu
      const weeks = [];
      
      // Szukanie opisu planu (wszystko przed tygodniem 1)
      const descriptionMatch = generatedText.match(/(.+?)(?=Tydzień 1:|Week 1:)/s);
      const planDescription = descriptionMatch ? descriptionMatch[1].trim() : '';
      
      // Parsowanie tygodni
      const weekMatches = generatedText.matchAll(/Tydzień (\d+):|Week (\d+):(.*?)(?=Tydzień \d+:|Week \d+:|$)/gs);
      
      for (const match of weekMatches) {
        const weekNumber = match[1] || match[2];
        const weekContent = match[3].trim();
        
        // Parsowanie dni treningowych w tygodniu
        const days = [];
        const dayMatches = weekContent.matchAll(/Dzień (\d+)|Day (\d+):(.*?)(?=Dzień \d+|Day \d+:|$)/gs);
        
        for (const dayMatch of dayMatches) {
          const dayNumber = dayMatch[1] || dayMatch[2];
          const trainingContent = dayMatch[3].trim();
          
          // Ekstrakcja danych treningu
          const typeMatch = trainingContent.match(/Typ:|Type:(.+?)(?=Dystans:|Distance:|Czas:|Time:|$)/s);
          const distanceMatch = trainingContent.match(/Dystans:|Distance:(.+?)(?=Intensywność:|Intensity:|$)/s);
          const timeMatch = trainingContent.match(/Czas:|Time:(.+?)(?=Intensywność:|Intensity:|$)/s);
          const intensityMatch = trainingContent.match(/Intensywność:|Intensity:(.+?)(?=Cel:|Goal:|$)/s);
          const goalMatch = trainingContent.match(/Cel:|Goal:(.+?)(?=$)/s);
          
          days.push({
            day: parseInt(dayNumber),
            type: typeMatch ? typeMatch[1].trim() : 'Bieg',
            distance: distanceMatch ? distanceMatch[1].trim() : '',
            time: timeMatch ? timeMatch[1].trim() : '',
            intensity: intensityMatch ? intensityMatch[1].trim() : 'Umiarkowana',
            goal: goalMatch ? goalMatch[1].trim() : 'Trening ogólnorozwojowy'
          });
        }
        
        // Jeśli nie udało się sparsować dni, spróbuj prostszego podejścia
        if (days.length === 0) {
          const simpleDayMatches = weekContent.split(/\n+/).filter(line => line.trim() !== '');
          
          for (let i = 0; i < simpleDayMatches.length; i++) {
            const dayContent = simpleDayMatches[i];
            days.push({
              day: i + 1,
              description: dayContent.trim()
            });
          }
        }
        
        weeks.push({
          week: parseInt(weekNumber),
          days
        });
      }
      
      return this.formatPlan({ description: planDescription, weeks }, userData);
    } catch (error) {
      logError('Błąd podczas parsowania wygenerowanego planu', error);
      
      // Zwróć surowy tekst jako awaryjne rozwiązanie
      return {
        userName: userData.firstName || userData.name || 'Biegacz',
        description: 'Plan treningowy (format surowy)',
        rawContent: generatedText,
        generatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Formatuje sparsowany plan do standardowego formatu
   * @param {Object} parsedPlan - Sparsowany plan
   * @param {Object} userData - Dane użytkownika
   * @returns {Object} Sformatowany plan treningowy
   */
  formatPlan(parsedPlan, userData) {
    // Pobieranie danych użytkownika w obu formatach
    const firstName = userData.firstName || userData.name || 'Biegacz';
    const experienceLevel = userData.experienceLevel || userData.level || 'początkujący';
    const mainGoal = userData.mainGoal || userData.goal || 'poprawa kondycji';
    
    return {
      userName: firstName,
      userLevel: experienceLevel,
      mainGoal: mainGoal,
      description: parsedPlan.description || 'Indywidualny plan treningowy',
      weeks: parsedPlan.weeks || [],
      tips: parsedPlan.tips || 'Pamiętaj o odpowiedniej regeneracji między treningami.',
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = PlanGeneratorService; 