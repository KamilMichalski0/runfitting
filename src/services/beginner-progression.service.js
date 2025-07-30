const logger = require('../utils/logger');
const { 
  BEGINNER_PROGRESSION_PATTERN, 
  generateDetailedWorkout, 
  HEART_RATE_ZONES 
} = require('../templates/professional-training-structure');

/**
 * Serwis do zarządzania progresją treningową dla początkujących
 * Implementuje zasady:
 * - Pierwsze 8 tygodni: maksymalnie 2x w tygodniu
 * - Po 8 tygodniach: możliwość zwiększenia do 3x w tygodniu
 * - Po 12 tygodniach: wyższa intensywność + rozciąganie
 */
class BeginnerProgressionService {
  
  /**
   * Oblicza fazę progresji na podstawie daty rozpoczęcia planu
   * @param {Date} planStartDate - Data rozpoczęcia planu
   * @returns {Object} Informacje o fazie progresji
   */
  static calculateProgressionPhase(planStartDate) {
    if (!planStartDate) {
      return {
        phase: 'initial',
        weeksCompleted: 0,
        canIncreaseFrequency: false,
        canIncreaseIntensity: false,
        maxAllowedDays: 2,
        recommendations: ['Rozpocznij od 2 dni treningowych w tygodniu']
      };
    }
    
    const startDate = new Date(planStartDate);
    const currentDate = new Date();
    const timeDiff = currentDate - startDate;
    const weeksCompleted = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000));
    
    let phase, canIncreaseFrequency, canIncreaseIntensity, maxAllowedDays, recommendations;
    
    if (weeksCompleted < 8) {
      // FAZA 1: Pierwsze 8 tygodni
      phase = 'initial';
      canIncreaseFrequency = false;
      canIncreaseIntensity = false;
      maxAllowedDays = 2;
      recommendations = [
        'Trenuj maksymalnie 2 razy w tygodniu',
        'Zachowaj minimum 48 godzin przerwy między treningami',
        'Maksymalny czas treningu: 45 minut',
        `Pozostało ${8 - weeksCompleted} tygodni do możliwości zwiększenia częstotliwości`
      ];
    } else if (weeksCompleted < 12) {
      // FAZA 2: Tygodnie 9-12
      phase = 'frequency_increase';
      canIncreaseFrequency = true;
      canIncreaseIntensity = false;
      maxAllowedDays = 3;
      recommendations = [
        'Możesz zwiększyć częstotliwość do 3 razy w tygodniu',
        'Nadal zachowaj odpowiednie przerwy między treningami',
        'Maksymalny czas treningu: 45 minut',
        `Pozostało ${12 - weeksCompleted} tygodni do możliwości zwiększenia intensywności`
      ];
    } else {
      // FAZA 3: Po 12 tygodniach
      phase = 'intensity_increase';
      canIncreaseFrequency = true;
      canIncreaseIntensity = true;
      maxAllowedDays = 3;
      recommendations = [
        'Możesz zwiększyć intensywność treningów',
        'Dodaj ćwiczenia rozciągające przed głównym treningiem',
        'Wprowadź jednostki o wyższej intensywności',
        'Maksymalny czas treningu może zostać zwiększony do 60 minut'
      ];
    }
    
    return {
      phase,
      weeksCompleted,
      canIncreaseFrequency,
      canIncreaseIntensity,
      maxAllowedDays,
      recommendations,
      nextMilestone: weeksCompleted < 8 ? 8 : weeksCompleted < 12 ? 12 : null
    };
  }
  
  /**
   * Waliduje czy propozycja treningu jest odpowiednia dla danej fazy
   * @param {Object} trainingProposal - Propozycja treningu
   * @param {Date} planStartDate - Data rozpoczęcia planu
   * @returns {Object} Wynik walidacji
   */
  static validateTrainingProposal(trainingProposal, planStartDate) {
    const progression = this.calculateProgressionPhase(planStartDate);
    const errors = [];
    const warnings = [];
    
    // Sprawdź liczbę dni treningowych
    if (trainingProposal.daysPerWeek > progression.maxAllowedDays) {
      errors.push(`W fazie "${progression.phase}" maksymalnie ${progression.maxAllowedDays} dni treningowych w tygodniu`);
    }
    
    // Sprawdź czas treningu
    const maxDuration = progression.canIncreaseIntensity ? 60 : 45;
    if (trainingProposal.duration > maxDuration) {
      errors.push(`W fazie "${progression.phase}" maksymalny czas treningu to ${maxDuration} minut`);
    }
    
    // Sprawdź intensywność
    if (trainingProposal.highIntensity && !progression.canIncreaseIntensity) {
      errors.push(`Wysoką intensywność można wprowadzić dopiero po 12 tygodniach`);
    }
    
    // Dodaj ostrzeżenia
    if (progression.phase === 'initial' && trainingProposal.daysPerWeek === 1) {
      warnings.push('Rozważ zwiększenie do 2 dni w tygodniu dla lepszych efektów');
    }
    
    if (progression.canIncreaseFrequency && trainingProposal.daysPerWeek === 2) {
      warnings.push('Możesz już zwiększyć częstotliwość do 3 razy w tygodniu');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      progression,
      suggestions: this.generateSuggestions(trainingProposal, progression)
    };
  }
  
  /**
   * Generuje sugestie na podstawie fazy progresji
   * @param {Object} trainingProposal - Propozycja treningu
   * @param {Object} progression - Informacje o progresji
   * @returns {Array} Lista sugestii
   */
  static generateSuggestions(trainingProposal, progression) {
    const suggestions = [];
    
    // Dodaj sugestie z profesjonalnej struktury treningowej
    const weekKey = `weeks_${Math.ceil(progression.weeksCompleted / 2) * 2 - 1}_${Math.ceil(progression.weeksCompleted / 2) * 2}`;
    const professionalProgression = BEGINNER_PROGRESSION_PATTERN[weekKey];
    
    switch (progression.phase) {
      case 'initial':
        suggestions.push('Skup się na budowaniu nawyku regularnego treningu');
        suggestions.push('Priorytetem jest unikanie kontuzji');
        suggestions.push('Alternuj trening z dniem odpoczynku');
        
        if (professionalProgression) {
          suggestions.push(`Profesjonalny wzorzec: ${professionalProgression.pattern}`);
          suggestions.push(`Użyj stref tętna: ${professionalProgression.heartRateZones.join(', ')}`);
          suggestions.push(`Maksymalny czas treningu: ${professionalProgression.maxDuration} minut`);
        }
        break;
        
      case 'frequency_increase':
        suggestions.push('Możesz dodać trzeci dzień treningowy');
        suggestions.push('Zachowaj umiar - nie zwiększaj intensywności i częstotliwości jednocześnie');
        suggestions.push('Obserwuj reakcje organizmu na zwiększoną częstotliwość');
        
        if (professionalProgression) {
          suggestions.push(`Wprowadź: ${professionalProgression.pattern}`);
          suggestions.push(`Dostępne strefy HR: ${professionalProgression.heartRateZones.join(', ')}`);
        }
        break;
        
      case 'intensity_increase':
        suggestions.push('Wprowadź rozciąganie przed treningiem');
        suggestions.push('Dodaj interwały o wyższej intensywności');
        suggestions.push('Rozważ wydłużenie niektórych treningów');
        
        if (professionalProgression) {
          suggestions.push(`Zaawansowane wzorce: ${professionalProgression.pattern}`);
          suggestions.push(`Użyj wszystkich dostępnych stref: ${professionalProgression.heartRateZones.join(', ')}`);
        }
        
        // Dodaj wskazówki dotyczące RPE
        suggestions.push('Używaj skali RPE 1-10/10 do monitorowania intensywności');
        suggestions.push('Trucht: RPE 4-6/10, Żywy bieg: RPE 7/10');
        break;
    }
    
    return suggestions;
  }
  
  /**
   * Generuje szczegółowy profesjonalny trening dla danego tygodnia
   * @param {number} week - Numer tygodnia
   * @param {number} workoutNumber - Numer treningu w tygodniu
   * @returns {Object} Szczegółowy trening
   */
  static generateProfessionalWorkout(week, workoutNumber = 1) {
    return generateDetailedWorkout(week, workoutNumber, 'beginner');
  }
  
  /**
   * Pobiera profesjonalne strefy tętna z opisami
   * @returns {Object} Strefy tętna z opisami
   */
  static getProfessionalHeartRateZones() {
    return HEART_RATE_ZONES;
  }
  
  /**
   * Generuje raport progresji dla użytkownika
   * @param {Object} userData - Dane użytkownika
   * @returns {Object} Raport progresji
   */
  static generateProgressionReport(userData) {
    const { planStartDate, currentTrainingDays, experienceLevel } = userData;
    
    if (experienceLevel !== 'poczatkujacy') {
      return {
        applicable: false,
        message: 'Zasady progresji dla początkujących nie dotyczą tego użytkownika'
      };
    }
    
    const progression = this.calculateProgressionPhase(planStartDate);
    const validation = this.validateTrainingProposal({
      daysPerWeek: currentTrainingDays || 2,
      duration: 30,
      highIntensity: false
    }, planStartDate);
    
    return {
      applicable: true,
      progression,
      validation,
      milestones: {
        week8: {
          passed: progression.weeksCompleted >= 8,
          description: 'Możliwość zwiększenia do 3 dni w tygodniu',
          remainingWeeks: Math.max(0, 8 - progression.weeksCompleted)
        },
        week12: {
          passed: progression.weeksCompleted >= 12,
          description: 'Możliwość zwiększenia intensywności',
          remainingWeeks: Math.max(0, 12 - progression.weeksCompleted)
        }
      },
      nextSteps: progression.recommendations
    };
  }
}

module.exports = BeginnerProgressionService;