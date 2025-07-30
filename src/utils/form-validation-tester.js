const logger = require('./logger');

/**
 * Utility do testowania wszystkich ścieżek walidacji formularza
 * Generuje test cases dla różnych kombinacji celów i parametrów
 */
class FormValidationTester {
  
  /**
   * Generuje test cases dla wszystkich kombinacji celów
   * @returns {Array} Array of test cases
   */
  static generateTestCases() {
    const testCases = [];
    
    // CELE GŁÓWNE
    const goals = [
      'zaczac_biegac',
      'przebiegniecie_dystansu', 
      'redukcja_masy_ciala',
      'poprawa_kondycji',
      'aktywny_tryb_zycia',
      'powrot_po_kontuzji',
      'zmiana_nawykow',
      'inny_cel'
    ];
    
    // POZIOMY ZAAWANSOWANIA
    const levels = ['poczatkujacy', 'sredniozaawansowany', 'zaawansowany'];
    
    // DYSTANSE
    const distances = ['5km', '10km', 'polmaraton', 'maraton'];
    
    // Wygeneruj test cases dla każdego celu
    goals.forEach(goal => {
      switch (goal) {
        case 'zaczac_biegac':
          testCases.push(...this.generateBeginnerRunningTests());
          break;
        case 'przebiegniecie_dystansu':
          testCases.push(...this.generateDistanceGoalTests());
          break;
        case 'redukcja_masy_ciala':
          testCases.push(...this.generateWeightLossTests());
          break;
        case 'poprawa_kondycji':
          testCases.push(...this.generateFitnessTests());
          break;
        case 'aktywny_tryb_zycia':
          testCases.push(...this.generateActiveLifestyleTests());
          break;
        case 'powrot_po_kontuzji':
          testCases.push(...this.generateInjuryRecoveryTests());
          break;
        case 'zmiana_nawykow':
          testCases.push(...this.generateHabitChangeTests());
          break;
        case 'inny_cel':
          testCases.push(...this.generateCustomGoalTests());
          break;
      }
    });
    
    return testCases;
  }
  
  /**
   * Test cases dla "zacznij biegać"
   */
  static generateBeginnerRunningTests() {
    return [
      {
        name: 'Beginner Running - Valid',
        input: {
          glownyCel: 'zaczac_biegac',
          poziomZaawansowania: 'poczatkujacy',
          dniTreningowe: ['poniedziałek', 'czwartek'],
          czasTreningu: 30,
          imieNazwisko: 'Jan Kowalski',
          wiek: 25,
          plec: 'Mężczyzna',
          wzrost: 180,
          masaCiala: 75
        },
        expected: { valid: true, errors: [] }
      },
      {
        name: 'Beginner Running - Too Many Days',
        input: {
          glownyCel: 'zaczac_biegac',
          poziomZaawansowania: 'poczatkujacy',
          dniTreningowe: ['poniedziałek', 'środa', 'piątek'],
          czasTreningu: 30
        },
        expected: { 
          valid: false, 
          errors: ['Dla początkujących maksymalnie 2 dni treningowe w tygodniu przez pierwsze 8 tygodni']
        }
      },
      {
        name: 'Beginner Running - Too Long Duration',
        input: {
          glownyCel: 'zaczac_biegac',
          poziomZaawansowania: 'poczatkujacy',
          dniTreningowe: ['poniedziałek', 'czwartek'],
          czasTreningu: 60
        },
        expected: { 
          valid: false, 
          errors: ['Dla początkujących maksymalny czas treningu to 45 minut']
        }
      },
      {
        name: 'Beginner Running - Wrong Experience Level',
        input: {
          glownyCel: 'zaczac_biegac',
          poziomZaawansowania: 'zaawansowany',
          dniTreningowe: ['poniedziałek', 'czwartek'],
          czasTreningu: 30
        },
        expected: { 
          valid: false, 
          errors: ['Dla celu "zacznij biegać" dostępny jest tylko poziom początkujący']
        }
      }
    ];
  }
  
  /**
   * Test cases dla "przebiegnięcie dystansu"
   */
  static generateDistanceGoalTests() {
    return [
      {
        name: 'Distance Goal - Valid 5km Beginner',
        input: {
          glownyCel: 'przebiegniecie_dystansu',
          dystansDocelowy: '5km',
          poziomZaawansowania: 'poczatkujacy',
          dniTreningowe: ['poniedziałek', 'czwartek'],
          aktualnyKilometrTygodniowy: 5
        },
        expected: { valid: true, errors: [] }
      },
      {
        name: 'Distance Goal - Valid 10km Intermediate',
        input: {
          glownyCel: 'przebiegniecie_dystansu',
          dystansDocelowy: '10km',
          poziomZaawansowania: 'sredniozaawansowany',
          rekord10km: '50_60min',
          aktualnyKilometrTygodniowy: 20
        },
        expected: { valid: true, errors: [] }
      },
      {
        name: 'Distance Goal - Missing Distance',
        input: {
          glownyCel: 'przebiegniecie_dystansu',
          poziomZaawansowania: 'sredniozaawansowany'
        },
        expected: { 
          valid: false, 
          errors: ['Dystans docelowy jest wymagany dla celu przebiegnięcia dystansu']
        }
      },
      {
        name: 'Distance Goal - Missing Experience Level',
        input: {
          glownyCel: 'przebiegniecie_dystansu',
          dystansDocelowy: '10km'
        },
        expected: { 
          valid: false, 
          errors: ['Poziom zaawansowania jest wymagany dla celu przebiegnięcia dystansu']
        }
      },
      {
        name: 'Distance Goal - Marathon Without Record',
        input: {
          glownyCel: 'przebiegniecie_dystansu',
          dystansDocelowy: 'maraton',
          poziomZaawansowania: 'sredniozaawansowany'
        },
        expected: { 
          valid: false, 
          errors: ['Dla maratonu wymagany jest aktualny rekord maratonu lub półmaratonu']
        }
      }
    ];
  }
  
  /**
   * Test cases dla "redukcja masy ciała"
   */
  static generateWeightLossTests() {
    return [
      {
        name: 'Weight Loss - Valid',
        input: {
          glownyCel: 'redukcja_masy_ciala',
          aktualnaAktywnoscFizyczna: 'minimalna',
          masaCiala: 80,
          docelowaWaga: 75,
          dniTreningowe: ['poniedziałek', 'środa', 'piątek']
        },
        expected: { valid: true, errors: [] }
      },
      {
        name: 'Weight Loss - Missing Activity',
        input: {
          glownyCel: 'redukcja_masy_ciala',
          masaCiala: 80,
          docelowaWaga: 75
        },
        expected: { 
          valid: false, 
          errors: ['Aktualna aktywność fizyczna jest wymagana dla celu redukcji masy ciała']
        }
      },
      {
        name: 'Weight Loss - Unrealistic Target',
        input: {
          glownyCel: 'redukcja_masy_ciala',
          aktualnaAktywnoscFizyczna: 'minimalna',
          masaCiala: 80,
          docelowaWaga: 85
        },
        expected: { 
          valid: false, 
          errors: ['Docelowa waga musi być niższa od aktualnej masy ciała']
        }
      },
      {
        name: 'Weight Loss - Too Radical',
        input: {
          glownyCel: 'redukcja_masy_ciala',
          aktualnaAktywnoscFizyczna: 'minimalna',
          masaCiala: 100,
          docelowaWaga: 65
        },
        expected: { 
          valid: false, 
          errors: ['Docelowa redukcja masy ciała nie powinna przekraczać 30% aktualnej wagi']
        }
      }
    ];
  }
  
  /**
   * Test cases dla "poprawa kondycji"
   */
  static generateFitnessTests() {
    return [
      {
        name: 'Fitness Improvement - Valid',
        input: {
          glownyCel: 'poprawa_kondycji',
          aktualnyKilometrTygodniowy: 15,
          dniTreningowe: ['poniedziałek', 'środa', 'piątek'],
          czasTreningu: 45
        },
        expected: { valid: true, errors: [] }
      }
    ];
  }
  
  /**
   * Test cases dla "aktywny tryb życia"
   */
  static generateActiveLifestyleTests() {
    return [
      {
        name: 'Active Lifestyle - Valid',
        input: {
          glownyCel: 'aktywny_tryb_zycia',
          dniTreningowe: ['poniedziałek', 'środa', 'piątek'],
          czasTreningu: 30,
          preferowanyCzasTreningu: 'rano'
        },
        expected: { valid: true, errors: [] }
      }
    ];
  }
  
  /**
   * Test cases dla "powrót po kontuzji"
   */
  static generateInjuryRecoveryTests() {
    return [
      {
        name: 'Injury Recovery - Valid',
        input: {
          glownyCel: 'powrot_po_kontuzji',
          kontuzje: ['kolano'],
          dataKontuzji: '2024-01-01',
          dniTreningowe: ['środa', 'sobota'],
          czasTreningu: 30
        },
        expected: { valid: true, errors: [] }
      },
      {
        name: 'Injury Recovery - Missing Injury Info',
        input: {
          glownyCel: 'powrot_po_kontuzji',
          dniTreningowe: ['środa', 'sobota']
        },
        expected: { 
          valid: false, 
          errors: ['Informacje o kontuzji są wymagane dla celu powrotu po kontuzji']
        }
      }
    ];
  }
  
  /**
   * Test cases dla "zmiana nawyków"
   */
  static generateHabitChangeTests() {
    return [
      {
        name: 'Habit Change - Valid',
        input: {
          glownyCel: 'zmiana_nawykow',
          glownaBariera: 'brak_czasu',
          coMotywuje: 'zdrowie',
          gotowoscDoWyzwan: 'wysoka',
          dniTreningowe: ['poniedziałek', 'czwartek']
        },
        expected: { valid: true, errors: [] }
      }
    ];
  }
  
  /**
   * Test cases dla "inny cel"
   */
  static generateCustomGoalTests() {
    return [
      {
        name: 'Custom Goal - Valid',
        input: {
          glownyCel: 'inny_cel',
          innyCelOpis: 'Chcę przygotować się do triatlonu i poprawić moją wydolność w trzech dyscyplinach',
          dniTreningowe: ['poniedziałek', 'środa', 'piątek'],
          czasTreningu: 60
        },
        expected: { valid: true, errors: [] }
      },
      {
        name: 'Custom Goal - Missing Description',
        input: {
          glownyCel: 'inny_cel',
          dniTreningowe: ['poniedziałek', 'środa']
        },
        expected: { 
          valid: false, 
          errors: ['Szczegółowy opis celu jest wymagany i musi mieć co najmniej 10 znaków']
        }
      },
      {
        name: 'Custom Goal - Too Short Description',
        input: {
          glownyCel: 'inny_cel',
          innyCelOpis: 'Trening',
          dniTreningowe: ['poniedziałek', 'środa']
        },
        expected: { 
          valid: false, 
          errors: ['Szczegółowy opis celu jest wymagany i musi mieć co najmniej 10 znaków']
        }
      }
    ];
  }
  
  /**
   * Wykonuje wszystkie testy walidacji
   * @returns {Object} Wyniki testów
   */
  static async runAllTests() {
    const testCases = this.generateTestCases();
    const results = {
      total: testCases.length,
      passed: 0,
      failed: 0,
      errors: []
    };
    
    logger.info(`Starting validation tests: ${testCases.length} test cases`);
    
    for (const testCase of testCases) {
      try {
        const result = await this.runSingleTest(testCase);
        if (result.passed) {
          results.passed++;
        } else {
          results.failed++;
          results.errors.push({
            testName: testCase.name,
            expected: testCase.expected,
            actual: result.actual,
            error: result.error
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          testName: testCase.name,
          error: error.message
        });
      }
    }
    
    logger.info(`Validation tests completed: ${results.passed}/${results.total} passed`);
    
    return results;
  }
  
  /**
   * Wykonuje pojedynczy test
   * @param {Object} testCase - Test case do wykonania
   * @returns {Object} Wynik testu
   */
  static async runSingleTest(testCase) {
    // Tutaj będzie symulacja walidacji
    // W rzeczywistej implementacji można by wywołać middleware bezpośrednio
    
    const mockReq = {
      body: testCase.input
    };
    
    const mockRes = {
      status: (code) => ({
        json: (data) => ({ statusCode: code, data })
      })
    };
    
    let validationResult = { valid: true, errors: [] };
    
    try {
      // Symuluj walidację (w prawdziwej implementacji wywołałbyś middleware)
      validationResult = await this.simulateValidation(testCase.input);
    } catch (error) {
      validationResult = { valid: false, errors: [error.message] };
    }
    
    const passed = JSON.stringify(validationResult) === JSON.stringify(testCase.expected);
    
    return {
      passed,
      actual: validationResult,
      expected: testCase.expected
    };
  }
  
  /**
   * Symuluje walidację dla celów testowych
   * @param {Object} input - Dane wejściowe
   * @returns {Object} Wynik walidacji
   */
  static async simulateValidation(input) {
    const errors = [];
    
    // Podstawowa walidacja danych wymaganych
    if (!input.imieNazwisko) errors.push('Imię i nazwisko jest wymagane');
    if (!input.wiek) errors.push('Wiek jest wymagany');
    if (!input.plec) errors.push('Płeć jest wymagana');
    if (!input.wzrost) errors.push('Wzrost jest wymagany');
    if (!input.masaCiala) errors.push('Masa ciała jest wymagana');
    
    // Walidacja specyficzna dla celów
    switch (input.glownyCel) {
      case 'zaczac_biegac':
        if (!input.poziomZaawansowania) {
          errors.push('Poziom zaawansowania jest wymagany dla celu rozpoczęcia biegania');
        }
        if (input.poziomZaawansowania && input.poziomZaawansowania !== 'poczatkujacy') {
          errors.push('Dla celu "zacznij biegać" dostępny jest tylko poziom początkujący');
        }
        if (input.dniTreningowe && input.dniTreningowe.length > 2) {
          errors.push('Dla początkujących maksymalnie 2 dni treningowe w tygodniu przez pierwsze 8 tygodni');
        }
        if (input.czasTreningu && input.czasTreningu > 45) {
          errors.push('Dla początkujących maksymalny czas treningu to 45 minut');
        }
        break;
        
      case 'przebiegniecie_dystansu':
        if (!input.dystansDocelowy) {
          errors.push('Dystans docelowy jest wymagany dla celu przebiegnięcia dystansu');
        }
        if (!input.poziomZaawansowania) {
          errors.push('Poziom zaawansowania jest wymagany dla celu przebiegnięcia dystansu');
        }
        if (input.dystansDocelowy === 'maraton' && !input.rekordMaraton) {
          errors.push('Dla maratonu wymagany jest aktualny rekord maratonu lub półmaratonu');
        }
        break;
        
      case 'redukcja_masy_ciala':
        if (!input.aktualnaAktywnoscFizyczna) {
          errors.push('Aktualna aktywność fizyczna jest wymagana dla celu redukcji masy ciała');
        }
        if (input.docelowaWaga && input.masaCiala && input.docelowaWaga >= input.masaCiala) {
          errors.push('Docelowa waga musi być niższa od aktualnej masy ciała');
        }
        if (input.docelowaWaga && input.masaCiala && (input.masaCiala - input.docelowaWaga) > input.masaCiala * 0.3) {
          errors.push('Docelowa redukcja masy ciała nie powinna przekraczać 30% aktualnej wagi');
        }
        break;
        
      case 'powrot_po_kontuzji':
        if (!input.kontuzje || input.kontuzje.length === 0) {
          errors.push('Informacje o kontuzji są wymagane dla celu powrotu po kontuzji');
        }
        break;
        
      case 'inny_cel':
        if (!input.innyCelOpis || input.innyCelOpis.trim().length < 10) {
          errors.push('Szczegółowy opis celu jest wymagany i musi mieć co najmniej 10 znaków');
        }
        break;
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = FormValidationTester;