const logger = require('../utils/logger');

/**
 * Middleware do walidacji zasad treningowych dla początkujących
 */
class BeginnerRulesMiddleware {
  
  /**
   * Waliduje 48-godzinną przerwę między treningami dla początkujących
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static validate48HourGap(req, res, next) {
    try {
      const { poziomZaawansowania, dniTreningowe } = req.body;
      
      // Sprawdź tylko dla początkujących
      if (poziomZaawansowania !== 'poczatkujacy') {
        return next();
      }
      
      if (!dniTreningowe || !Array.isArray(dniTreningowe)) {
        return next();
      }
      
      // Mapa dni tygodnia na numery (0 = niedziela, 1 = poniedzialek, itd.)
      const dayMap = {
        'niedziela': 0,
        'poniedzialek': 1,
        'wtorek': 2,
        'sroda': 3,
        'czwartek': 4,
        'piatek': 5,
        'sobota': 6
      };
      
      // Konwertuj dni na numery i posortuj
      const dayNumbers = dniTreningowe
        .map(day => dayMap[day])
        .filter(num => num !== undefined)
        .sort((a, b) => a - b);
      
      // Sprawdź odstępy między dniami
      for (let i = 0; i < dayNumbers.length - 1; i++) {
        const currentDay = dayNumbers[i];
        const nextDay = dayNumbers[i + 1];
        
        // Oblicz różnicę w dniach
        const diff = nextDay - currentDay;
        
        // Minimum 2 dni przerwy (48 godzin)
        if (diff < 2) {
          return res.status(400).json({
            status: 'error',
            message: 'Dla początkujących między treningami musi być minimum 48 godzin (2 dni) przerwy.',
            details: `Dni ${Object.keys(dayMap)[currentDay]} i ${Object.keys(dayMap)[nextDay]} są za blisko siebie.`,
            recommendations: [
              'Przykładowe poprawne kombinacje:',
              '- Poniedziałek i Czwartek',
              '- Wtorek i Piątek', 
              '- Środa i Sobota'
            ]
          });
        }
      }
      
      // Sprawdź również przerwę między ostatnim dniem tygodnia a pierwszym następnego
      if (dayNumbers.length >= 2) {
        const lastDay = dayNumbers[dayNumbers.length - 1];
        const firstDay = dayNumbers[0];
        
        // Oblicz przerwę przez weekend (sobota -> poniedzialek = 2 dni)
        const weekendGap = (7 - lastDay) + firstDay;
        
        if (weekendGap < 2) {
          return res.status(400).json({
            status: 'error',
            message: 'Dla początkujących między treningami musi być minimum 48 godzin (2 dni) przerwy.',
            details: `Przerwa między ${Object.keys(dayMap)[lastDay]} a ${Object.keys(dayMap)[firstDay]} następnego tygodnia jest za krótka.`,
            recommendations: [
              'Przykładowe poprawne kombinacje:',
              '- Poniedziałek i Czwartek',
              '- Wtorek i Piątek',
              '- Środa i Sobota'
            ]
          });
        }
      }
      
      logger.info(`48-hour gap validation passed for beginner with days: ${dniTreningowe.join(', ')}`);
      next();
      
    } catch (error) {
      logger.error('Error in 48-hour gap validation:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Błąd podczas walidacji przerw między treningami'
      });
    }
  }
  
  /**
   * Waliduje czy użytkownik może zwiększyć częstotliwość treningów po 8 tygodniach
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static validateProgressionEligibility(req, res, next) {
    try {
      const { poziomZaawansowania, dniTreningowe, planStartDate } = req.body;
      
      // Sprawdź tylko dla początkujących
      if (poziomZaawansowania !== 'poczatkujacy') {
        return next();
      }
      
      // Jeśli nie ma daty rozpoczęcia planu, pozwól na kontynuację (nowy plan)
      if (!planStartDate) {
        return next();
      }
      
      // Oblicz ile tygodni minęło od rozpoczęcia planu
      const startDate = new Date(planStartDate);
      const currentDate = new Date();
      const timeDiff = currentDate - startDate;
      const weeksFromStart = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000));
      
      // Jeśli minęło mniej niż 8 tygodni i użytkownik chce więcej niż 2 dni
      if (weeksFromStart < 8 && dniTreningowe && dniTreningowe.length > 2) {
        return res.status(400).json({
          status: 'error',
          message: 'Początkujący może zwiększyć częstotliwość treningów do 3x w tygodniu dopiero po 8 tygodniach.',
          details: {
            weeksCompleted: weeksFromStart,
            weeksRequired: 8,
            currentFrequency: dniTreningowe.length,
            maxAllowedFrequency: 2
          },
          recommendations: [
            `Pozostało ${8 - weeksFromStart} tygodni do możliwości zwiększenia częstotliwości`,
            'Aktualnie możesz trenować maksymalnie 2 razy w tygodniu',
            'Po 8 tygodniach będziesz mógł zwiększyć do 3 razy w tygodniu'
          ]
        });
      }
      
      // Jeśli minęło 8+ tygodni, pozwól na zwiększenie do 3 dni
      if (weeksFromStart >= 8 && dniTreningowe && dniTreningowe.length > 3) {
        return res.status(400).json({
          status: 'error',
          message: 'Początkujący może trenować maksymalnie 3 razy w tygodniu nawet po 8 tygodniach.',
          details: {
            weeksCompleted: weeksFromStart,
            currentFrequency: dniTreningowe.length,
            maxAllowedFrequency: 3
          }
        });
      }
      
      logger.info(`Progression eligibility validation passed for beginner (${weeksFromStart} weeks completed)`);
      next();
      
    } catch (error) {
      logger.error('Error in progression eligibility validation:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Błąd podczas walidacji możliwości progresji'
      });
    }
  }
  
  /**
   * Sprawdza i loguje informacje o progresji użytkownika
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static checkProgressionStatus(req, res, next) {
    try {
      const { poziomZaawansowania, planStartDate } = req.body;
      
      if (poziomZaawansowania !== 'poczatkujacy' || !planStartDate) {
        return next();
      }
      
      const startDate = new Date(planStartDate);
      const currentDate = new Date();
      const timeDiff = currentDate - startDate;
      const weeksFromStart = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000));
      
      // Dodaj informacje o progresji do requesta
      req.beginnerProgression = {
        weeksCompleted: weeksFromStart,
        canIncreaseFrequency: weeksFromStart >= 8,
        canIncreaseIntensity: weeksFromStart >= 12,
        maxAllowedDays: weeksFromStart >= 8 ? 3 : 2,
        phase: weeksFromStart < 8 ? 'initial' : weeksFromStart < 12 ? 'frequency_increase' : 'intensity_increase'
      };
      
      logger.info(`Beginner progression status: ${JSON.stringify(req.beginnerProgression)}`);
      next();
      
    } catch (error) {
      logger.error('Error in progression status check:', error);
      next(); // Nie blokuj requesta w przypadku błędu
    }
  }
}

module.exports = BeginnerRulesMiddleware;