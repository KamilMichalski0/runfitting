const logger = require('../utils/logger');

/**
 * Middleware do obsługi logiki progresywnej formularza
 * Różne wymagania dla różnych celów treningowych
 */
class ProgressiveFormMiddleware {
  
  /**
   * Główna funkcja walidacji progresywnej
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static validateProgressiveForm(req, res, next) {
    try {
      const { glownyCel } = req.body;
      
      // Wybierz odpowiednią funkcję walidacji na podstawie celu
      switch (glownyCel) {
        case 'zaczac_biegac':
          return ProgressiveFormMiddleware.validateBeginnerRunning(req, res, next);
        case 'przebiegniecie_dystansu':
          return ProgressiveFormMiddleware.validateDistanceGoal(req, res, next);
        case 'redukcja_masy_ciala':
          return ProgressiveFormMiddleware.validateWeightLoss(req, res, next);
        case 'poprawa_kondycji':
          return ProgressiveFormMiddleware.validateFitnessImprovement(req, res, next);
        case 'aktywny_tryb_zycia':
          return ProgressiveFormMiddleware.validateActiveLifestyle(req, res, next);
        case 'powrot_po_kontuzji':
          return ProgressiveFormMiddleware.validateInjuryRecovery(req, res, next);
        case 'zmiana_nawykow':
          return ProgressiveFormMiddleware.validateHabitChange(req, res, next);
        case 'inny_cel':
          return ProgressiveFormMiddleware.validateCustomGoal(req, res, next);
        default:
          return next();
      }
    } catch (error) {
      logger.error('Error in progressive form validation:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Błąd podczas walidacji formularza'
      });
    }
  }
  
  /**
   * Walidacja dla celu "zacznij biegać"
   */
  static validateBeginnerRunning(req, res, next) {
    const { poziomZaawansowania, dniTreningowe, czasTreningu } = req.body;
    const errors = [];
    
    // Dla początkujących biegaczy wymagane są podstawowe informacje
    if (!poziomZaawansowania) {
      errors.push('Poziom zaawansowania jest wymagany dla celu rozpoczęcia biegania');
    }
    
    // Sprawdź czy poziom zaawansowania jest zgodny z celem
    if (poziomZaawansowania && !['poczatkujacy'].includes(poziomZaawansowania)) {
      errors.push('Dla celu "zacznij biegać" dostępny jest tylko poziom początkujący');
    }
    
    // Walidacja dni treningowych dla początkujących
    if (dniTreningowe && dniTreningowe.length > 2) {
      errors.push('Dla początkujących biegaczy zalecane są maksymalnie 2 dni treningowe w tygodniu');
    }
    
    // Walidacja czasu treningu
    if (czasTreningu && czasTreningu > 45) {
      errors.push('Dla początkujących biegaczy maksymalny czas treningu to 45 minut');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Błędy walidacji dla celu rozpoczęcia biegania',
        errors,
        recommendations: [
          'Wybierz poziom początkujący',
          'Zaplanuj maksymalnie 2 dni treningowe w tygodniu',
          'Ustaw czas treningu na maksymalnie 45 minut',
          'Zachowaj minimum 48 godzin przerwy między treningami'
        ]
      });
    }
    
    // Dodaj specyficzne informacje dla początkujących
    req.formContext = {
      goal: 'beginner_running',
      maxTrainingDays: 2,
      maxDuration: 45,
      requiredFields: ['poziomZaawansowania', 'dniTreningowe', 'czasTreningu'],
      recommendations: [
        'Rozpocznij od 2 dni treningowych w tygodniu',
        'Skup się na budowaniu nawyku regularnego treningu',
        'Priorytetem jest unikanie kontuzji'
      ]
    };
    
    next();
  }
  
  /**
   * Walidacja dla celu "przebiegnięcie dystansu"
   */
  static validateDistanceGoal(req, res, next) {
    const { dystansDocelowy, poziomZaawansowania, rekord5km, rekord10km, rekordPolmaraton, rekordMaraton } = req.body;
    const errors = [];
    
    // Dystans docelowy jest wymagany
    if (!dystansDocelowy) {
      errors.push('Dystans docelowy jest wymagany dla celu przebiegnięcia dystansu');
    }
    
    // Poziom zaawansowania jest wymagany
    if (!poziomZaawansowania) {
      errors.push('Poziom zaawansowania jest wymagany dla celu przebiegnięcia dystansu');
    }
    
    // Walidacja rekordów na podstawie dystansu
    if (dystansDocelowy === '5km' && poziomZaawansowania !== 'poczatkujacy' && !rekord5km) {
      errors.push('Dla dystansu 5km i poziomu powyżej początkującego wymagany jest aktualny rekord 5km');
    }
    
    if (dystansDocelowy === '10km' && poziomZaawansowania !== 'poczatkujacy' && !rekord10km) {
      errors.push('Dla dystansu 10km i poziomu powyżej początkującego wymagany jest aktualny rekord 10km');
    }
    
    if (dystansDocelowy === 'polmaraton' && !rekordPolmaraton) {
      errors.push('Dla półmaratonu wymagany jest aktualny rekord półmaratonu lub 10km');
    }
    
    if (dystansDocelowy === 'maraton' && !rekordMaraton) {
      errors.push('Dla maratonu wymagany jest aktualny rekord maratonu lub półmaratonu');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Błędy walidacji dla celu przebiegnięcia dystansu',
        errors,
        recommendations: [
          'Wybierz dystans docelowy',
          'Określ swój poziom zaawansowania',
          'Podaj aktualny rekord na podobnym dystansie',
          'Uzupełnij informacje o aktualnym kilometrażu tygodniowym'
        ]
      });
    }
    
    req.formContext = {
      goal: 'distance_goal',
      targetDistance: dystansDocelowy,
      experienceLevel: poziomZaawansowania,
      requiredFields: ['dystansDocelowy', 'poziomZaawansowania', 'aktualnyKilometrTygodniowy'],
      recommendations: ProgressiveFormMiddleware.getDistanceRecommendations(dystansDocelowy, poziomZaawansowania)
    };
    
    next();
  }
  
  /**
   * Walidacja dla celu "redukcja masy ciała"
   */
  static validateWeightLoss(req, res, next) {
    const { aktualnaAktywnoscFizyczna, docelowaWaga, masaCiala } = req.body;
    const errors = [];
    
    // Aktualna aktywność fizyczna jest wymagana
    if (!aktualnaAktywnoscFizyczna) {
      errors.push('Aktualna aktywność fizyczna jest wymagana dla celu redukcji masy ciała');
    }
    
    // Sprawdź czy docelowa waga jest realna
    if (docelowaWaga && masaCiala && docelowaWaga >= masaCiala) {
      errors.push('Docelowa waga musi być niższa od aktualnej masy ciała');
    }
    
    // Sprawdź czy redukcja nie jest zbyt radykalna
    if (docelowaWaga && masaCiala && (masaCiala - docelowaWaga) > masaCiala * 0.3) {
      errors.push('Docelowa redukcja masy ciała nie powinna przekraczać 30% aktualnej wagi');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Błędy walidacji dla celu redukcji masy ciała',
        errors,
        recommendations: [
          'Określ aktualną aktywność fizyczną',
          'Ustaw realistyczną docelową wagę',
          'Planuj stopniową redukcję masy ciała',
          'Skup się na zdrowych nawykach żywieniowych'
        ]
      });
    }
    
    req.formContext = {
      goal: 'weight_loss',
      currentActivity: aktualnaAktywnoscFizyczna,
      requiredFields: ['aktualnaAktywnoscFizyczna', 'docelowaWaga', 'aktualnyWzorZywienia'],
      recommendations: [
        'Połącz aktywność fizyczną ze zdrową dietą',
        'Planuj realistyczne cele tygodniowe',
        'Monitoruj postępy regularnie'
      ]
    };
    
    next();
  }
  
  /**
   * Walidacja dla celu "poprawa kondycji"
   */
  static validateFitnessImprovement(req, res, next) {
    const { aktualnyKilometrTygodniowy, testCoopera, vo2max } = req.body;
    
    req.formContext = {
      goal: 'fitness_improvement',
      requiredFields: ['aktualnyKilometrTygodniowy', 'dniTreningowe', 'czasTreningu'],
      recommendations: [
        'Określ aktualny poziom kondycji',
        'Planuj systematyczny wzrost obciążenia',
        'Włącz różnorodne formy treningu'
      ]
    };
    
    next();
  }
  
  /**
   * Walidacja dla celu "aktywny tryb życia"
   */
  static validateActiveLifestyle(req, res, next) {
    req.formContext = {
      goal: 'active_lifestyle',
      requiredFields: ['dniTreningowe', 'czasTreningu', 'preferowanyCzasTreningu'],
      recommendations: [
        'Skup się na regularności nad intensywnością',
        'Wybierz formy aktywności, które Ci się podobają',
        'Planuj realistyczny harmonogram'
      ]
    };
    
    next();
  }
  
  /**
   * Walidacja dla celu "powrót po kontuzji"
   */
  static validateInjuryRecovery(req, res, next) {
    const { kontuzje, dataKontuzji } = req.body;
    const errors = [];
    
    // Informacje o kontuzji są wymagane
    if (!kontuzje || kontuzje.length === 0) {
      errors.push('Informacje o kontuzji są wymagane dla celu powrotu po kontuzji');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Błędy walidacji dla celu powrotu po kontuzji',
        errors,
        recommendations: [
          'Opisz szczegółowo przebytą kontuzję',
          'Podaj datę kontuzji i okres rehabilitacji',
          'Skonsultuj się z lekarzem przed rozpoczęciem treningu'
        ]
      });
    }
    
    req.formContext = {
      goal: 'injury_recovery',
      requiredFields: ['kontuzje', 'dataKontuzji', 'statusRehabilltacji'],
      recommendations: [
        'Rozpocznij bardzo ostrożnie',
        'Priorytetem jest unikanie ponownej kontuzji',
        'Regularnie monitoruj samopoczucie'
      ]
    };
    
    next();
  }
  
  /**
   * Walidacja dla celu "zmiana nawyków"
   */
  static validateHabitChange(req, res, next) {
    req.formContext = {
      goal: 'habit_change',
      requiredFields: ['glownaBariera', 'coMotywuje', 'gotowoscDoWyzwan'],
      recommendations: [
        'Zidentyfikuj główne bariery',
        'Określ źródła motywacji',
        'Planuj małe, regularne kroki'
      ]
    };
    
    next();
  }
  
  /**
   * Walidacja dla celu "inny cel"
   */
  static validateCustomGoal(req, res, next) {
    const { innyCelOpis } = req.body;
    const errors = [];
    
    if (!innyCelOpis || innyCelOpis.trim().length < 10) {
      errors.push('Szczegółowy opis celu jest wymagany i musi mieć co najmniej 10 znaków');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Błędy walidacji dla niestandardowego celu',
        errors
      });
    }
    
    req.formContext = {
      goal: 'custom_goal',
      requiredFields: ['innyCelOpis'],
      recommendations: [
        'Opisz szczegółowo swój cel',
        'Określ czas realizacji',
        'Wskaż preferowane formy aktywności'
      ]
    };
    
    next();
  }
  
  /**
   * Generuje rekomendacje na podstawie dystansu i poziomu zaawansowania
   */
  static getDistanceRecommendations(distance, level) {
    const recommendations = {
      '5km': {
        'poczatkujacy': ['Rozpocznij od programu Couch to 5K', 'Skup się na regularności, nie na tempie'],
        'sredniozaawansowany': ['Pracuj nad tempem i techniką', 'Dodaj trening interwałowy'],
        'zaawansowany': ['Optymalizuj tempo i strategię wyścigu', 'Włącz trening siłowy']
      },
      '10km': {
        'poczatkujacy': ['Najpierw ukończ 5km regularnie', 'Stopniowo wydłużaj dystans'],
        'sredniozaawansowany': ['Buduj bazę aerobową', 'Dodaj długie biegi'],
        'zaawansowany': ['Optymalizuj periodyzację', 'Pracuj nad tempem progowym']
      },
      'polmaraton': {
        'sredniozaawansowany': ['Buduj mocną bazę kilometrową', 'Practykuj długie biegi'],
        'zaawansowany': ['Periodyzuj trening', 'Optymalizuj strategię wyścigu']
      },
      'maraton': {
        'sredniozaawansowany': ['Przygotuj się na 16-20 tygodni treningu', 'Priorytetem są długie biegi'],
        'zaawansowany': ['Zaplanuj szczegółową periodyzację', 'Optymalizuj żywienie i regenerację']
      }
    };
    
    return recommendations[distance]?.[level] || ['Dostosuj trening do swojego poziomu i celu'];
  }
}

module.exports = ProgressiveFormMiddleware;