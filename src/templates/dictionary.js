// Plan szablonów biegowych - kompletny słownik obejmujący wszystkie kombinacje kryteriów

const planTemplates = {
    // POCZĄTKUJĄCY (BEGINNER) - 5KM
    '5km_beginner_3days': {
      id: '5km_beginner_3days',
      metadata: {
        discipline: "running",
        target_group: "Początkujący biegacze",
        target_goal: "5km",
        level_hint: "beginner",
        days_per_week: 3,
        duration_weeks: 8,
        base_distance_km: 15,
        description: "Plan treningowy dla początkujących biegaczy przygotowujących się do pierwszego biegu na 5km",
        author: "RunFitting AI"
      }
    },
    '5km_beginner_4days': {
      id: '5km_beginner_4days',
      metadata: {
        discipline: "running",
        target_group: "Początkujący biegacze",
        target_goal: "5km",
        level_hint: "beginner",
        days_per_week: 4,
        duration_weeks: 8,
        base_distance_km: 18,
        description: "4-dniowy plan treningowy dla początkujących biegaczy przygotowujących się do biegu na 5km",
        author: "RunFitting AI"
      }
    },
    
    // POCZĄTKUJĄCY (BEGINNER) - 10KM
    '10km_beginner_3days': {
      id: '10km_beginner_3days',
      metadata: {
        discipline: "running",
        target_group: "Początkujący biegacze",
        target_goal: "10km",
        level_hint: "beginner",
        days_per_week: 3,
        duration_weeks: 10,
        base_distance_km: 20,
        description: "Plan treningowy dla początkujących biegaczy przygotowujących się do biegu na 10km",
        author: "RunFitting AI"
      }
    },
    '10km_beginner_4days': {
      id: '10km_beginner_4days',
      metadata: {
        discipline: "running",
        target_group: "Początkujący biegacze",
        target_goal: "10km",
        level_hint: "beginner",
        days_per_week: 4,
        duration_weeks: 10,
        base_distance_km: 22,
        description: "4-dniowy plan treningowy dla początkujących biegaczy przygotowujących się do biegu na 10km",
        author: "RunFitting AI"
      }
    },
    
    // POCZĄTKUJĄCY (BEGINNER) - PÓŁMARATON
    'halfMarathon_beginner_3days': {
      id: 'halfMarathon_beginner_3days',
      metadata: {
        discipline: "running",
        target_group: "Początkujący biegacze",
        target_goal: "half_marathon",
        level_hint: "beginner",
        days_per_week: 3,
        duration_weeks: 16,
        base_distance_km: 25,
        description: "Plan treningowy dla początkujących biegaczy przygotowujących się do pierwszego półmaratonu",
        author: "RunFitting AI"
      }
    },
    'halfMarathon_beginner_4days': {
      id: 'halfMarathon_beginner_4days',
      metadata: {
        discipline: "running",
        target_group: "Początkujący biegacze",
        target_goal: "half_marathon",
        level_hint: "beginner",
        days_per_week: 4,
        duration_weeks: 16,
        base_distance_km: 30,
        description: "4-dniowy plan treningowy dla początkujących biegaczy przygotowujących się do półmaratonu",
        author: "RunFitting AI"
      }
    },
    
    // ŚREDNIOZAAWANSOWANI (INTERMEDIATE) - 5KM
    '5km_intermediate_3days': {
      id: '5km_intermediate_3days',
      metadata: {
        discipline: "running",
        target_group: "Średniozaawansowani biegacze",
        target_goal: "5km",
        level_hint: "intermediate",
        days_per_week: 3,
        duration_weeks: 8,
        base_distance_km: 20,
        description: "Plan treningowy dla średniozaawansowanych biegaczy chcących poprawić swój czas na 5km",
        author: "RunFitting AI"
      }
    },
    '5km_intermediate_4days': {
      id: '5km_intermediate_4days',
      metadata: {
        discipline: "running",
        target_group: "Średniozaawansowani biegacze",
        target_goal: "5km",
        level_hint: "intermediate",
        days_per_week: 4,
        duration_weeks: 8,
        base_distance_km: 25,
        description: "4-dniowy plan treningowy dla średniozaawansowanych biegaczy fokusujący na poprawie czasu na 5km",
        author: "RunFitting AI"
      }
    },
    '5km_intermediate_5days': {
      id: '5km_intermediate_5days',
      metadata: {
        discipline: "running",
        target_group: "Średniozaawansowani biegacze",
        target_goal: "5km",
        level_hint: "intermediate",
        days_per_week: 5,
        duration_weeks: 8,
        base_distance_km: 30,
        description: "Intensywny 5-dniowy plan treningowy dla średniozaawansowanych biegaczy skupiający się na 5km",
        author: "RunFitting AI"
      }
    },
    
    // ŚREDNIOZAAWANSOWANI (INTERMEDIATE) - 10KM
    '10km_intermediate_4days': {
      id: '10km_intermediate_4days',
      metadata: {
        discipline: "running",
        target_group: "Średniozaawansowani biegacze",
        target_goal: "10km",
        level_hint: "intermediate",
        days_per_week: 4,
        duration_weeks: 10,
        base_distance_km: 25,
        description: "Plan treningowy dla średniozaawansowanych biegaczy przygotowujących się do biegu na 10km",
        author: "RunFitting AI"
      }
    },
    '10km_intermediate_5days': {
      id: '10km_intermediate_5days',
      metadata: {
        discipline: "running",
        target_group: "Średniozaawansowani biegacze",
        target_goal: "10km",
        level_hint: "intermediate",
        days_per_week: 5,
        duration_weeks: 10,
        base_distance_km: 35,
        description: "5-dniowy plan treningowy dla średniozaawansowanych biegaczy skupiający się na dystansie 10km",
        author: "RunFitting AI"
      }
    },
    
    // ŚREDNIOZAAWANSOWANI (INTERMEDIATE) - PÓŁMARATON
    'halfMarathon_intermediate_4days': {
      id: 'halfMarathon_intermediate_4days',
      metadata: {
        discipline: "running",
        target_group: "Średniozaawansowani biegacze",
        target_goal: "half_marathon",
        level_hint: "intermediate",
        days_per_week: 4,
        duration_weeks: 12,
        base_distance_km: 35,
        description: "Plan treningowy dla średniozaawansowanych biegaczy przygotowujących się do półmaratonu",
        author: "RunFitting AI"
      }
    },
    'halfMarathon_intermediate_5days': {
      id: 'halfMarathon_intermediate_5days',
      metadata: {
        discipline: "running",
        target_group: "Średniozaawansowani biegacze",
        target_goal: "half_marathon",
        level_hint: "intermediate",
        days_per_week: 5,
        duration_weeks: 12,
        base_distance_km: 45,
        description: "Intensywny 5-dniowy plan treningowy dla średniozaawansowanych biegaczy przygotowujących się do półmaratonu",
        author: "RunFitting AI"
      }
    },
    
    // ŚREDNIOZAAWANSOWANI (INTERMEDIATE) - MARATON
    'marathon_intermediate_4days': {
      id: 'marathon_intermediate_4days',
      metadata: {
        discipline: "running",
        target_group: "Średniozaawansowani biegacze",
        target_goal: "marathon",
        level_hint: "intermediate",
        days_per_week: 4,
        duration_weeks: 16,
        base_distance_km: 45,
        description: "Plan treningowy dla średniozaawansowanych biegaczy przygotowujących się do maratonu",
        author: "RunFitting AI"
      }
    },
    'marathon_intermediate_5days': {
      id: 'marathon_intermediate_5days',
      metadata: {
        discipline: "running",
        target_group: "Średniozaawansowani biegacze",
        target_goal: "marathon",
        level_hint: "intermediate",
        days_per_week: 5,
        duration_weeks: 16,
        base_distance_km: 50,
        description: "5-dniowy plan treningowy dla średniozaawansowanych biegaczy przygotowujących się do maratonu",
        author: "RunFitting AI"
      }
    },
    
    // ZAAWANSOWANI (ADVANCED) - 5KM
    '5km_advanced_3days': {
      id: '5km_advanced_3days',
      metadata: {
        discipline: "running",
        target_group: "Zaawansowani biegacze",
        target_goal: "5km",
        level_hint: "advanced",
        days_per_week: 3,
        duration_weeks: 8,
        base_distance_km: 25,
        description: "Plan treningowy dla zaawansowanych biegaczy dążących do osiągnięcia najlepszego wyniku na 5km",
        author: "RunFitting AI"
      }
    },
    '5km_advanced_4days': {
      id: '5km_advanced_4days',
      metadata: {
        discipline: "running",
        target_group: "Zaawansowani biegacze",
        target_goal: "5km",
        level_hint: "advanced",
        days_per_week: 4,
        duration_weeks: 8,
        base_distance_km: 30,
        description: "Zaawansowany plan treningowy dla doświadczonych biegaczy chcących poprawić swój czas na 5km",
        author: "RunFitting AI"
      }
    },
    '5km_advanced_5days': {
      id: '5km_advanced_5days',
      metadata: {
        discipline: "running",
        target_group: "Zaawansowani biegacze",
        target_goal: "5km",
        level_hint: "advanced",
        days_per_week: 5,
        duration_weeks: 8,
        base_distance_km: 40,
        description: "Intensywny 5-dniowy plan treningowy dla zaawansowanych biegaczy skupiający się na poprawie wyników na 5km",
        author: "RunFitting AI"
      }
    },
    
    // ZAAWANSOWANI (ADVANCED) - 10KM
    '10km_advanced_4days': {
      id: '10km_advanced_4days',
      metadata: {
        discipline: "running",
        target_group: "Zaawansowani biegacze",
        target_goal: "10km",
        level_hint: "advanced",
        days_per_week: 4,
        duration_weeks: 10,
        base_distance_km: 40,
        description: "Zaawansowany plan treningowy dla doświadczonych biegaczy chcących poprawić czas na 10km",
        author: "RunFitting AI"
      }
    },
    '10km_advanced_5days': {
      id: '10km_advanced_5days',
      metadata: {
        discipline: "running",
        target_group: "Zaawansowani biegacze",
        target_goal: "10km",
        level_hint: "advanced",
        days_per_week: 5,
        duration_weeks: 10,
        base_distance_km: 50,
        description: "5-dniowy zaawansowany plan treningowy dla doświadczonych biegaczy fokusujący na 10km",
        author: "RunFitting AI"
      }
    },
    '10km_advanced_6days': {
      id: '10km_advanced_6days',
      metadata: {
        discipline: "running",
        target_group: "Zaawansowani biegacze",
        target_goal: "10km",
        level_hint: "advanced",
        days_per_week: 6,
        duration_weeks: 10,
        base_distance_km: 60,
        description: "Intensywny 6-dniowy plan treningowy dla zaawansowanych biegaczy skupiający się na dystansie 10km",
        author: "RunFitting AI"
      }
    },
    
    // ZAAWANSOWANI (ADVANCED) - PÓŁMARATON
    'halfMarathon_advanced_5days': {
      id: 'halfMarathon_advanced_5days',
      metadata: {
        discipline: "running",
        target_group: "Zaawansowani biegacze",
        target_goal: "half_marathon",
        level_hint: "advanced",
        days_per_week: 5,
        duration_weeks: 12,
        base_distance_km: 45,
        description: "Plan treningowy dla zaawansowanych biegaczy przygotowujących się do półmaratonu",
        author: "RunFitting AI"
      }
    },
    'halfMarathon_advanced_6days': {
      id: 'halfMarathon_advanced_6days',
      metadata: {
        discipline: "running",
        target_group: "Zaawansowani biegacze",
        target_goal: "half_marathon",
        level_hint: "advanced",
        days_per_week: 6,
        duration_weeks: 12,
        base_distance_km: 60,
        description: "Intensywny 6-dniowy plan treningowy dla zaawansowanych biegaczy przygotowujących się do półmaratonu",
        author: "RunFitting AI"
      }
    },
    
    // ZAAWANSOWANI (ADVANCED) - MARATON
    'marathon_advanced_5days': {
      id: 'marathon_advanced_5days',
      metadata: {
        discipline: "running",
        target_group: "Zaawansowani biegacze",
        target_goal: "marathon",
        level_hint: "advanced",
        days_per_week: 5,
        duration_weeks: 16,
        base_distance_km: 60,
        description: "Plan treningowy dla zaawansowanych biegaczy przygotowujących się do maratonu",
        author: "RunFitting AI"
      }
    },
    'marathon_advanced_6days': {
      id: 'marathon_advanced_6days',
      metadata: {
        discipline: "running",
        target_group: "Zaawansowani biegacze",
        target_goal: "marathon",
        level_hint: "advanced",
        days_per_week: 6,
        duration_weeks: 16,
        base_distance_km: 80,
        description: "Intensywny 6-dniowy plan treningowy dla zaawansowanych biegaczy przygotowujących się do maratonu",
        author: "RunFitting AI"
      }
    },
    
    // REHABILITACJA - PLANY POWROTU PO KONTUZJACH
    'running_return_plantar_fasciitis_3days_6weeks': {
      id: 'running_return_plantar_fasciitis_3days_6weeks',
      metadata: {
        discipline: "running",
        target_group: "Biegacze powracający po zapaleniu rozcięgna podeszwowego",
        target_goal: "return_after_injury",
        level_hint: "rehabilitation",
        days_per_week: 3,
        duration_weeks: 6,
        description: "Plan powrotu do biegania po zapaleniu rozcięgna podeszwowego (3 dni/tydzień)",
        author: "Generator Fizjo AI"
      }
    },
    'running_return_plantar_fasciitis_4days_6weeks': {
      id: 'running_return_plantar_fasciitis_4days_6weeks',
      metadata: {
        discipline: "running",
        target_group: "Biegacze powracający po zapaleniu rozcięgna podeszwowego",
        target_goal: "return_after_injury",
        level_hint: "rehabilitation",
        days_per_week: 4,
        duration_weeks: 6,
        description: "Plan powrotu do biegania po zapaleniu rozcięgna podeszwowego",
        author: "Generator Fizjo AI"
      }
    },
    'achilles_pain_management_3days_4weeks': {
      id: 'achilles_pain_management_3days_4weeks',
      metadata: {
        discipline: "Rehabilitacja/Fizjoterapia",
        target_group: "Osoby z lekkim, bieżącym bólem ścięgna Achillesa",
        target_goal: "pain_management_return_to_light_activity",
        level_hint: "rehabilitation",
        days_per_week: 3,
        duration_weeks: 4,
        description: "Plan postępowania dla osób z lekkim bólem ścięgna Achillesa",
        author: "Generator Fizjo AI"
      }
    },
    'achilles_pain_management_4days_4weeks': {
      id: 'achilles_pain_management_4days_4weeks',
      metadata: {
        discipline: "Rehabilitacja/Fizjoterapia",
        target_group: "Osoby z lekkim, bieżącym bólem ścięgna Achillesa",
        target_goal: "pain_management_return_to_light_activity",
        level_hint: "rehabilitation",
        days_per_week: 4,
        duration_weeks: 4,
        description: "4-dniowy plan postępowania dla osób z bólem ścięgna Achillesa",
        author: "Generator Fizjo AI"
      }
    },
    'shin_splints_recovery_3days_4weeks': {
      id: 'shin_splints_recovery_3days_4weeks',
      metadata: {
        discipline: "Rehabilitacja/Fizjoterapia",
        target_group: "Biegacze z zapaleniem okostnej (shin splints)",
        target_goal: "return_after_injury",
        level_hint: "rehabilitation",
        days_per_week: 3,
        duration_weeks: 4,
        description: "Plan rehabilitacji dla biegaczy z zapaleniem okostnej (shin splints)",
        author: "Generator Fizjo AI"
      }
    },
    'return_to_running_after_knee_injury_3days_8weeks': {
      id: 'return_to_running_after_knee_injury_3days_8weeks',
      metadata: {
        discipline: "Rehabilitacja/Fizjoterapia",
        target_group: "Biegacze powracający po kontuzji kolana",
        target_goal: "return_after_injury",
        level_hint: "rehabilitation",
        days_per_week: 3,
        duration_weeks: 8,
        description: "Plan powrotu do biegania po kontuzji kolana",
        author: "Generator Fizjo AI"
      }
    }
  };

/**
 * Funkcja wybierająca szablon planu treningowego na podstawie kryteriów
 * 
 * @param {Object} criteria - Kryteria wyboru planu
 * @param {string} criteria.level - Poziom zaawansowania ("beginner", "intermediate", "advanced" lub "rehabilitation")
 * @param {string} criteria.goal - Cel treningowy (np. "5km", "10km", "half_marathon", "marathon" lub specyficzny cel rehabilitacyjny)
 * @param {number} criteria.daysPerWeek - Preferowana liczba dni treningowych w tygodniu
 * @param {string} [criteria.injuryType] - Typ kontuzji (tylko dla rehabilitation)
 * @returns {Object|null} Wybrany szablon planu lub null jeśli nie znaleziono
 */
function selectPlanTemplate(criteria) {
  // Domyślne wartości, jeśli nie zostały podane
  const defaultCriteria = {
    level: "beginner",
    goal: "5km",
    daysPerWeek: 3,
    injuryType: null
  };

  // Połącz podane kryteria z domyślnymi
  const mergedCriteria = { ...defaultCriteria, ...criteria };
  
  // Mapowanie typów celów na klucze w metadanych szablonów
  const goalMapping = {
    '5km': '5km',
    '10km': '10km',
    'halfmarathon': 'half_marathon',
    'half-marathon': 'half_marathon',
    'half_marathon': 'half_marathon',
    'marathon': 'marathon',
    'plantar_fasciitis': 'return_after_injury',
    'achilles_pain': 'pain_management_return_to_light_activity',
    'shin_splints': 'return_after_injury',
    'knee_injury': 'return_after_injury'
  };

  // Znajdź pasujące szablony
  let matchingTemplates = [];
  const targetGoal = goalMapping[mergedCriteria.goal.toLowerCase()] || mergedCriteria.goal;

  for (const key in planTemplates) {
    const template = planTemplates[key];
    const metadata = template.metadata;
    
    // Dopasowanie do poziomu
    let levelMatch = metadata.level_hint === mergedCriteria.level;
    
    // Przypadek specjalny dla rehabilitacji
    if (mergedCriteria.level === 'rehabilitation' && metadata.level_hint === 'rehabilitation') {
      levelMatch = true;
      
      // Jeśli podano typ kontuzji, sprawdź czy szablon jest dla tego typu
      if (mergedCriteria.injuryType) {
        // Sprawdź czy ID szablonu zawiera ten typ kontuzji
        if (!key.includes(mergedCriteria.injuryType.toLowerCase())) {
          continue;
        }
      }
    }
    
    // Kontynuuj, jeśli poziom nie pasuje
    if (!levelMatch) continue;
    
    // Dopasowanie do celu
    if (metadata.target_goal !== targetGoal) continue;
    
    // Dodaj do pasujących szablonów
    matchingTemplates.push(template);
  }
  
  // Nie znaleziono pasujących szablonów
  if (matchingTemplates.length === 0) {
    return null;
  }
  
  // Znajdź najlepiej pasujący pod względem liczby dni
  let bestMatch = matchingTemplates[0];
  let bestDiff = Math.abs(bestMatch.metadata.days_per_week - mergedCriteria.daysPerWeek);
  
  for (let i = 1; i < matchingTemplates.length; i++) {
    const template = matchingTemplates[i];
    const diff = Math.abs(template.metadata.days_per_week - mergedCriteria.daysPerWeek);
    
    // Jeśli znaleziono lepsze dopasowanie liczby dni
    if (diff < bestDiff) {
      bestMatch = template;
      bestDiff = diff;
    }
  }
  
  return bestMatch;
}

/**
 * Funkcja wyszukująca wszystkie szablony planów dla danego poziomu zaawansowania
 * 
 * @param {string} level - Poziom zaawansowania ("beginner", "intermediate", "advanced" lub "rehabilitation")
 * @returns {Array} Lista szablonów dla danego poziomu
 */
function getTemplatesByLevel(level) {
  return Object.values(planTemplates).filter(template => 
    template.metadata.level_hint === level
  );
}

/**
 * Funkcja wyszukująca wszystkie szablony planów dla danego celu treningowego
 * 
 * @param {string} goal - Cel treningowy (np. "5km", "10km", "half_marathon", "marathon")
 * @returns {Array} Lista szablonów dla danego celu
 */
function getTemplatesByGoal(goal) {
  const goalMapping = {
    '5km': '5km',
    '10km': '10km',
    'halfmarathon': 'half_marathon',
    'half-marathon': 'half_marathon',
    'half_marathon': 'half_marathon',
    'marathon': 'marathon'
  };
  
  const targetGoal = goalMapping[goal.toLowerCase()] || goal;
  
  return Object.values(planTemplates).filter(template => 
    template.metadata.target_goal === targetGoal
  );
}

/**
 * Funkcja wyszukująca szablony planów rehabilitacyjnych dla konkretnego typu kontuzji
 * 
 * @param {string} injuryType - Typ kontuzji (np. "plantar_fasciitis", "achilles", "shin_splints", "knee")
 * @returns {Array} Lista szablonów rehabilitacyjnych dla danego typu kontuzji
 */
function getRehabTemplatesByInjury(injuryType) {
  return Object.values(planTemplates).filter(template => {
    return template.metadata.level_hint === 'rehabilitation' && 
           template.id.toLowerCase().includes(injuryType.toLowerCase());
  });
}

module.exports = {
  planTemplates,
  selectPlanTemplate,
  getTemplatesByLevel,
  getTemplatesByGoal,
  getRehabTemplatesByInjury
};