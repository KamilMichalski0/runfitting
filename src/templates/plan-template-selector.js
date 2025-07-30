/**
 * Moduł odpowiedzialny za dobieranie szablonu planu treningowego
 * na podstawie danych z formularza użytkownika.
 * Zawiera system randomizacji i wariantów dla zwiększenia różnorodności.
 */

const planTemplates = require('./plan-templates');

/**
 * Definicja wariantów dla różnych planów treningowych
 * Każdy plan bazowy może mieć kilka wariantów o różnym charakterze
 */
const PLAN_VARIANTS = {
  // Plany 5km dla średniozaawansowanych
  '5km_intermediate_4days': [
    { id: '5km_intermediate_4days_speed', focus: 'speed', description: 'Wariant z naciskiem na prędkość' },
    { id: '5km_intermediate_4days_endurance', focus: 'endurance', description: 'Wariant z naciskiem na wytrzymałość' },
    { id: '5km_intermediate_4days_interval', focus: 'intervals', description: 'Wariant z dużą ilością interwałów' },
    { id: '5km_intermediate_4days_tempo', focus: 'tempo', description: 'Wariant z naciskiem na tempo' }
  ],
  '5km_intermediate_3days': [
    { id: '5km_intermediate_3days_balanced', focus: 'balanced', description: 'Wariant zrównoważony' },
    { id: '5km_intermediate_3days_power', focus: 'power', description: 'Wariant z naciskiem na siłę' },
    { id: '5km_intermediate_3days_technique', focus: 'technique', description: 'Wariant z pracą nad techniką' }
  ],
  
  // Plany 10km dla średniozaawansowanych
  '10km_intermediate_4days': [
    { id: '10km_intermediate_4days_base', focus: 'base_building', description: 'Wariant budujący bazę aerobową' },
    { id: '10km_intermediate_4days_threshold', focus: 'threshold', description: 'Wariant z pracą nad progiem' },
    { id: '10km_intermediate_4days_mixed', focus: 'mixed', description: 'Wariant mieszany' }
  ],
  '10km_intermediate_5days': [
    { id: '10km_intermediate_5days_volume', focus: 'volume', description: 'Wariant z wysokim volumem' },
    { id: '10km_intermediate_5days_quality', focus: 'quality', description: 'Wariant z naciskiem na jakość' },
    { id: '10km_intermediate_5days_recovery', focus: 'recovery', description: 'Wariant z naciskiem na regenerację' }
  ],
  
  // Plany półmaraton
  'halfMarathon_intermediate_4days': [
    { id: 'halfMarathon_intermediate_4days_long', focus: 'long_runs', description: 'Wariant z długimi biegami' },
    { id: 'halfMarathon_intermediate_4days_tempo', focus: 'tempo', description: 'Wariant z wieloma tempówkami' },
    { id: 'halfMarathon_intermediate_4days_hills', focus: 'hills', description: 'Wariant z biegami górskimi' }
  ],
  'halfMarathon_intermediate_5days': [
    { id: 'halfMarathon_intermediate_5days_progressive', focus: 'progressive', description: 'Wariant z progresywnym budowaniem' },
    { id: 'halfMarathon_intermediate_5days_strength', focus: 'strength', description: 'Wariant z treningiem siłowym' },
    { id: 'halfMarathon_intermediate_5days_race_prep', focus: 'race_preparation', description: 'Wariant przygotowujący do wyścigu' }
  ],
  
  // Plany maraton
  'marathon_intermediate_4days': [
    { id: 'marathon_intermediate_4days_classic', focus: 'classic', description: 'Klasyczny wariant maratonu' },
    { id: 'marathon_intermediate_4days_time_efficient', focus: 'time_efficient', description: 'Wariant oszczędzający czas' },
    { id: 'marathon_intermediate_4days_injury_prevention', focus: 'injury_prevention', description: 'Wariant zapobiegający kontuzjom' }
  ],
  'marathon_intermediate_5days': [
    { id: 'marathon_intermediate_5days_high_mileage', focus: 'high_mileage', description: 'Wariant z wysokim kilometrażem' },
    { id: 'marathon_intermediate_5days_quality_focused', focus: 'quality_focused', description: 'Wariant z naciskiem na jakość' },
    { id: 'marathon_intermediate_5days_build_up', focus: 'build_up', description: 'Wariant stopniowego budowania' }
  ],
  
  // Plany dla zaawansowanych
  '5km_advanced_4days': [
    { id: '5km_advanced_4days_peaking', focus: 'peaking', description: 'Wariant na szczyt formy' },
    { id: '5km_advanced_4days_vo2max', focus: 'vo2max', description: 'Wariant z pracą nad VO2max' },
    { id: '5km_advanced_4days_lactate', focus: 'lactate', description: 'Wariant z tolerancją mleczanów' }
  ],
  '5km_advanced_5days': [
    { id: '5km_advanced_5days_competitive', focus: 'competitive', description: 'Wariant zawodniczy' },
    { id: '5km_advanced_5days_technical', focus: 'technical', description: 'Wariant z pracą techniczną' },
    { id: '5km_advanced_5days_periodized', focus: 'periodized', description: 'Wariant periodyzowany' }
  ],
  
  // Plany dla początkujących - mniej wariantów, ale bezpiecznych
  'start_running_2days': [
    { id: 'start_running_2days_gentle', focus: 'gentle', description: 'Wariant bardzo łagodny' },
    { id: 'start_running_2days_structured', focus: 'structured', description: 'Wariant bardziej strukturalny' },
    { id: 'start_running_2days_fun', focus: 'fun', description: 'Wariant z elementami zabawy' }
  ],
  'start_running_varied_3days': [
    { id: 'start_running_varied_3days_outdoor', focus: 'outdoor', description: 'Wariant na zewnątrz' },
    { id: 'start_running_varied_3days_mixed', focus: 'mixed', description: 'Wariant mieszany' },
    { id: 'start_running_varied_3days_social', focus: 'social', description: 'Wariant z elementami społecznymi' }
  ],
  
  // Plany 5km dla początkujących  
  '5km_beginner_3days': [
    { id: '5km_beginner_3days_walk_run', focus: 'walk_run', description: 'Wariant marsz-bieg' },
    { id: '5km_beginner_3days_continuous', focus: 'continuous', description: 'Wariant ciągłego biegu' },
    { id: '5km_beginner_3days_interval', focus: 'interval', description: 'Wariant interwałowy' }
  ],
  '5km_beginner_4days': [
    { id: '5km_beginner_4days_progressive', focus: 'progressive', description: 'Wariant progresywny' },
    { id: '5km_beginner_4days_recovery_focused', focus: 'recovery_focused', description: 'Wariant z naciskiem na regenerację' }
  ]
};

/**
 * Generuje seed dla randomizacji na podstawie danych użytkownika
 * Zapewnia powtarzalność dla tego samego użytkownika w krótkim okresie
 * @param {Object} userData - dane użytkownika
 * @returns {number} - seed dla randomizacji
 */
function generateUserSeed(userData) {
  const userString = `${userData.imieNazwisko || ''}_${userData.wiek || ''}_${userData.glownyCel || ''}`;
  let hash = 0;
  for (let i = 0; i < userString.length; i++) {
    const char = userString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Seeded random number generator
 * @param {number} seed - seed dla generatora
 * @returns {number} - liczba pseudolosowa między 0 a 1
 */
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Wybiera wariant planu na podstawie dostępnych opcji
 * @param {string} basePlanId - ID bazowego planu
 * @param {Object} userData - dane użytkownika
 * @param {Array} excludedVariants - warianty do wykluczenia
 * @returns {Object|null} - wybrany wariant lub null
 */
function selectPlanVariant(basePlanId, userData, excludedVariants = []) {
  const variants = PLAN_VARIANTS[basePlanId];
  if (!variants || variants.length === 0) {
    return null;
  }
  
  // Filtruj wykluczone warianty
  const availableVariants = variants.filter(variant => 
    !excludedVariants.includes(variant.id)
  );
  
  if (availableVariants.length === 0) {
    // Jeśli wszystkie warianty są wykluczone, użyj losowego
    return variants[Math.floor(Math.random() * variants.length)];
  }
  
  // Użyj seeded random dla powtarzalności
  const seed = generateUserSeed(userData) + Date.now();
  const randomValue = seededRandom(seed);
  const selectedIndex = Math.floor(randomValue * availableVariants.length);
  
  return availableVariants[selectedIndex];
}

/**
 * Dobiera szablon planu treningowego na podstawie danych z formularza.
 * NOWA WERSJA z systemem randomizacji i wariantów
 * @param {Object} userData - dane z formularza użytkownika
 * @param {Object} options - opcje wyboru planu
 * @param {Array} options.excludedVariants - warianty do wykluczenia
 * @param {boolean} options.forceRandomization - wymuś randomizację
 * @returns {Object|null} - dopasowany szablon lub null jeśli brak dopasowania
 */
function selectPlanTemplate(userData, options = {}) {

  // Sprawdzenie kontuzji/problemów zdrowotnych (priorytet najwyższy)
  if (userData.injuries && userData.injuries.length > 0) {
    
    if (userData.injuries.includes('plantar_fasciitis')) {
      const plan = userData.daysPerWeek >= 4 
        ? planTemplates['running_return_plantar_fasciitis_4days_6weeks']
        : planTemplates['running_return_plantar_fasciitis_3days_6weeks'];
          return plan;
    }
    
    if (userData.injuries.includes('achilles_pain')) {
      const plan = userData.daysPerWeek >= 4
        ? planTemplates['achilles_pain_management_4days_4weeks']
        : planTemplates['achilles_pain_management_3days_4weeks'];
          return plan;
    }

    if (userData.injuries.includes('shin_splints')) {
      const plan = planTemplates['shin_splints_recovery_3days_4weeks'];
          return plan;
    }

    if (userData.injuries.includes('knee_injury')) {
      const plan = planTemplates['return_to_running_after_knee_injury_3days_8weeks'];
          return plan;
    }
  }

  // Sprawdzenie celu i poziomu zaawansowania
  const { mainGoal, experienceLevel, daysPerWeek } = userData;
  
  // Absolutni początkujący - MAKSYMALNIE 2 DNI PRZEZ PIERWSZE 8 TYGODNI
  if (experienceLevel === 'absolute_beginner') {
    if (mainGoal === 'start_running') {
      // Dla absolutnych początkujących ZAWSZE 2 dni w tygodniu
      const plan = planTemplates['start_running_2days'];
      return plan;
    }
  }
  
  // Początkujący - RESPEKTUJ ZASADY PROGRESJI + randomizacja
  if (experienceLevel === 'beginner') {
    if (mainGoal === 'start_running') {
      // Dla początkujących maksymalnie 2 dni przez pierwsze 8 tygodni
      const basePlanId = daysPerWeek <= 2 ? 'start_running_2days' : 'start_running_varied_3days';
      
      // Spróbuj wybrać wariant planu
      const variant = selectPlanVariant(basePlanId, userData, options.excludedVariants);
      if (variant) {
        const basePlan = planTemplates[basePlanId];
        if (basePlan) {
          return {
            ...basePlan,
            variantId: variant.id,
            variantFocus: variant.focus,
            variantDescription: variant.description,
            metadata: {
              ...basePlan.metadata,
              description: `${basePlan.metadata.description} - ${variant.description}`,
              variant: variant.focus
            }
          };
        }
      }
      
      return planTemplates[basePlanId];
    }
    
    if (mainGoal === 'run_5k') {
      // Dla początkujących preferuj 3 dni, ale pozwól na 2 dni
      const basePlanId = daysPerWeek <= 2 ? '5km_beginner_3days' : '5km_beginner_3days';
      
      // Spróbuj wybrać wariant planu
      const variant = selectPlanVariant(basePlanId, userData, options.excludedVariants);
      if (variant) {
        const basePlan = planTemplates[basePlanId];
        if (basePlan) {
          return {
            ...basePlan,
            variantId: variant.id,
            variantFocus: variant.focus,
            variantDescription: variant.description,
            metadata: {
              ...basePlan.metadata,
              description: `${basePlan.metadata.description} - ${variant.description}`,
              variant: variant.focus
            }
          };
        }
      }
      
      return planTemplates[basePlanId];
    }
    if (mainGoal === 'run_10k') {
      // Dla początkujących preferuj 3 dni
      const plan = daysPerWeek <= 2 ? planTemplates['10km_beginner_3days'] : planTemplates['10km_beginner_3days'];
      return plan;
    }
    if (mainGoal === 'half_marathon') {
      // Dla początkujących preferuj 3 dni
      const plan = daysPerWeek <= 2 ? planTemplates['halfMarathon_beginner_3days'] : planTemplates['halfMarathon_beginner_3days'];
      return plan;
    }
  }
  
  // Średniozaawansowani - NOWA WERSJA z randomizacją
  if (experienceLevel === 'intermediate') {
    if (mainGoal === 'run_5k') {
      let basePlanId;
      if (daysPerWeek >= 5) {
        basePlanId = '5km_intermediate_5days';
      } else if (daysPerWeek >= 4) {
        basePlanId = '5km_intermediate_4days';
      } else {
        basePlanId = '5km_intermediate_3days';
      }
      
      // Spróbuj wybrać wariant planu
      const variant = selectPlanVariant(basePlanId, userData, options.excludedVariants);
      if (variant) {
        // Stwórz wirtualny plan z wariantem
        const basePlan = planTemplates[basePlanId];
        if (basePlan) {
          return {
            ...basePlan,
            variantId: variant.id,
            variantFocus: variant.focus,
            variantDescription: variant.description,
            metadata: {
              ...basePlan.metadata,
              description: `${basePlan.metadata.description} - ${variant.description}`,
              variant: variant.focus
            }
          };
        }
      }
      
      // Fallback do podstawowego planu
      return planTemplates[basePlanId];
    }
    
    if (mainGoal === 'run_10k') {
      const basePlanId = daysPerWeek >= 5 ? '10km_intermediate_5days' : '10km_intermediate_4days';
      
      // Spróbuj wybrać wariant planu
      const variant = selectPlanVariant(basePlanId, userData, options.excludedVariants);
      if (variant) {
        const basePlan = planTemplates[basePlanId];
        if (basePlan) {
          return {
            ...basePlan,
            variantId: variant.id,
            variantFocus: variant.focus,
            variantDescription: variant.description,
            metadata: {
              ...basePlan.metadata,
              description: `${basePlan.metadata.description} - ${variant.description}`,
              variant: variant.focus
            }
          };
        }
      }
      
      return planTemplates[basePlanId];
    }
    
    if (mainGoal === 'half_marathon') {
      const basePlanId = daysPerWeek >= 5 ? 'halfMarathon_intermediate_5days' : 'halfMarathon_intermediate_4days';
      
      // Spróbuj wybrać wariant planu
      const variant = selectPlanVariant(basePlanId, userData, options.excludedVariants);
      if (variant) {
        const basePlan = planTemplates[basePlanId];
        if (basePlan) {
          return {
            ...basePlan,
            variantId: variant.id,
            variantFocus: variant.focus,
            variantDescription: variant.description,
            metadata: {
              ...basePlan.metadata,
              description: `${basePlan.metadata.description} - ${variant.description}`,
              variant: variant.focus
            }
          };
        }
      }
      
      return planTemplates[basePlanId];
    }
    
    if (mainGoal === 'marathon') {
      const basePlanId = daysPerWeek >= 5 ? 'marathon_intermediate_5days' : 'marathon_intermediate_4days';
      
      // Spróbuj wybrać wariant planu
      const variant = selectPlanVariant(basePlanId, userData, options.excludedVariants);
      if (variant) {
        const basePlan = planTemplates[basePlanId];
        if (basePlan) {
          return {
            ...basePlan,
            variantId: variant.id,
            variantFocus: variant.focus,
            variantDescription: variant.description,
            metadata: {
              ...basePlan.metadata,
              description: `${basePlan.metadata.description} - ${variant.description}`,
              variant: variant.focus
            }
          };
        }
      }
      
      return planTemplates[basePlanId];
    }
  }
  
  // Zaawansowani - NOWA WERSJA z randomizacją
  if (experienceLevel === 'advanced') {
    if (mainGoal === 'run_5k') {
      let basePlanId;
      if (daysPerWeek >= 5) {
        basePlanId = '5km_advanced_5days';
      } else if (daysPerWeek >= 4) {
        basePlanId = '5km_advanced_4days';
      } else {
        basePlanId = '5km_advanced_3days';
      }
      
      // Spróbuj wybrać wariant planu
      const variant = selectPlanVariant(basePlanId, userData, options.excludedVariants);
      if (variant) {
        const basePlan = planTemplates[basePlanId];
        if (basePlan) {
          return {
            ...basePlan,
            variantId: variant.id,
            variantFocus: variant.focus,
            variantDescription: variant.description,
            metadata: {
              ...basePlan.metadata,
              description: `${basePlan.metadata.description} - ${variant.description}`,
              variant: variant.focus
            }
          };
        }
      }
      
      return planTemplates[basePlanId];
    }
    if (mainGoal === 'run_10k') {
      let plan;
      if (daysPerWeek >= 6) {
        plan = planTemplates['10km_advanced_6days'];
      } else if (daysPerWeek >= 5) {
        plan = planTemplates['10km_advanced_5days'];
      } else {
        plan = planTemplates['10km_advanced_4days'];
      }
      return plan;
    }
    if (mainGoal === 'half_marathon') {
      const plan = daysPerWeek >= 6 ? planTemplates['halfMarathon_advanced_6days'] : planTemplates['halfMarathon_advanced_5days'];
      return plan;
    }
    if (mainGoal === 'marathon') {
      const plan = daysPerWeek >= 6 ? planTemplates['marathon_advanced_6days'] : planTemplates['marathon_advanced_5days'];
      return plan;
    }
  }

  return null;
}

/**
 * Zwraca przykładowy szablon planu do wykorzystania w promptach.
 * @param {Object} userData - dane z formularza użytkownika (opcjonalne)
 * @returns {Object} - przykładowy szablon planu
 */
function getExamplePlanTemplate(userData) {
  
  // Najpierw próbujemy dopasować szablon do danych użytkownika
  const matchedTemplate = selectPlanTemplate(userData);
  if (matchedTemplate) {
    return matchedTemplate;
  }
  
  // Jeśli nie ma dopasowania, wybierz odpowiedni szablon na podstawie celu
  if (userData.mainGoal) {
    let plan;
    switch (userData.mainGoal) {
      case 'start_running':
        // Preferuj zróżnicowany plan dla lepszego przykładu
        plan = planTemplates['start_running_varied_3days'] || planTemplates['start_running_3days'];
        return plan;
      case 'run_5k':
        plan = planTemplates['5km_beginner_3days'];
        return plan;
      case 'run_10k':
        plan = planTemplates['10km_intermediate_4days'];
        return plan;
      case 'half_marathon':
        plan = planTemplates['halfMarathon_intermediate_4days'];
        console.log('Wybrano plan półmaratonu:', plan.metadata.description);
        return plan;
      case 'marathon':
        plan = planTemplates['marathon_intermediate_4days'];
        console.log('Wybrano plan maratonu:', plan.metadata.description);
        return plan;
    }
  }

  // Jeśli nie ma celu lub nie znaleziono dopasowania, sprawdź poziom dla lepszego defaultu
  if (userData.experienceLevel === 'absolute_beginner' || userData.experienceLevel === 'beginner') {
    console.log('\nUżycie zróżnicowanego planu dla początkującego jako domyślny');
    const defaultBeginnerPlan = planTemplates['start_running_varied_3days'] || planTemplates['start_running_3days'];
    console.log('Wybrano domyślny plan początkującego:', defaultBeginnerPlan.metadata.description);
    return defaultBeginnerPlan;
  }

  // Jeśli nic nie pasuje, zwróć standardowy domyślny szablon
  console.log('\nNie znaleziono dopasowania, używam domyślnego planu 10km');
  const defaultPlan = planTemplates['10km_intermediate_4days'];
  console.log('Wybrano domyślny plan:', defaultPlan.metadata.description);
  return defaultPlan;
}

/**
 * Wersja z pełną obsługą randomizacji - wrapper dla kompatybilności
 * @param {Object} userData - dane użytkownika
 * @param {Object} options - opcje dodatkowe
 * @returns {Object} - wybrany plan z informacjami o wariancie
 */
function selectRandomizedPlanTemplate(userData, options = {}) {
  const plan = selectPlanTemplate(userData, options);
  
  // Dodaj informacje o randomizacji do planu
  if (plan && plan.variantId) {
    console.log(`🎲 Wybrano wariant planu: ${plan.variantId} (${plan.variantFocus})`);
    console.log(`📋 Opis wariantu: ${plan.variantDescription}`);
  }
  
  return plan;
}

/**
 * Pobiera wszystkie dostępne warianty dla danego planu
 * @param {string} basePlanId - ID bazowego planu
 * @returns {Array} - lista dostępnych wariantów
 */
function getAvailableVariants(basePlanId) {
  return PLAN_VARIANTS[basePlanId] || [];
}

/**
 * Statystyki systemu wariantów
 * @returns {Object} - statystyki systemu
 */
function getVariantStats() {
  const totalPlans = Object.keys(PLAN_VARIANTS).length;
  const totalVariants = Object.values(PLAN_VARIANTS).reduce((sum, variants) => sum + variants.length, 0);
  const averageVariantsPerPlan = totalVariants / totalPlans;
  
  return {
    totalPlans,
    totalVariants,
    averageVariantsPerPlan: Math.round(averageVariantsPerPlan * 100) / 100,
    planVariants: Object.fromEntries(
      Object.entries(PLAN_VARIANTS).map(([key, variants]) => [key, variants.length])
    )
  };
}

module.exports = {
  selectPlanTemplate,
  getExamplePlanTemplate,
  selectRandomizedPlanTemplate,
  getAvailableVariants,
  getVariantStats,
  PLAN_VARIANTS // Eksport dla testów
};
