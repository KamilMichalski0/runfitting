/**
 * Moduł odpowiedzialny za dobieranie szablonu planu treningowego
 * na podstawie danych z formularza użytkownika.
 */

const planTemplates = require('./plan-templates');

/**
 * Dobiera szablon planu treningowego na podstawie danych z formularza.
 * @param {Object} userData - dane z formularza użytkownika
 * @returns {Object|null} - dopasowany szablon lub null jeśli brak dopasowania
 */
function selectPlanTemplate(userData) {
  console.log('\n=== Rozpoczynam proces doboru planu treningowego ===');
  console.log('Dane użytkownika:', {
    experienceLevel: userData.experienceLevel,
    mainGoal: userData.mainGoal,
    daysPerWeek: userData.daysPerWeek,
    injuries: userData.injuries
  });

  // Sprawdzenie kontuzji/problemów zdrowotnych (priorytet najwyższy)
  if (userData.injuries && userData.injuries.length > 0) {
    console.log('\nSprawdzam dopasowanie do kontuzji...');
    
    if (userData.injuries.includes('plantar_fasciitis')) {
      const plan = userData.daysPerWeek >= 4 
        ? planTemplates['running_return_plantar_fasciitis_4days_6weeks']
        : planTemplates['running_return_plantar_fasciitis_3days_6weeks'];
      console.log('Znaleziono plan dla kontuzji: plantar_fasciitis');
      console.log('Wybrany plan:', plan.metadata.description);
      return plan;
    }
    
    if (userData.injuries.includes('achilles_pain')) {
      const plan = userData.daysPerWeek >= 4
        ? planTemplates['achilles_pain_management_4days_4weeks']
        : planTemplates['achilles_pain_management_3days_4weeks'];
      console.log('Znaleziono plan dla kontuzji: achilles_pain');
      console.log('Wybrany plan:', plan.metadata.description);
      return plan;
    }

    if (userData.injuries.includes('shin_splints')) {
      const plan = planTemplates['shin_splints_recovery_3days_4weeks'];
      console.log('Znaleziono plan dla kontuzji: shin_splints');
      console.log('Wybrany plan:', plan.metadata.description);
      return plan;
    }

    if (userData.injuries.includes('knee_injury')) {
      const plan = planTemplates['return_to_running_after_knee_injury_3days_8weeks'];
      console.log('Znaleziono plan dla kontuzji: knee_injury');
      console.log('Wybrany plan:', plan.metadata.description);
      return plan;
    }
  }

  // Sprawdzenie celu i poziomu zaawansowania
  const { mainGoal, experienceLevel, daysPerWeek } = userData;
  console.log('\nSprawdzam dopasowanie do poziomu zaawansowania i celu...');
  console.log(`Poziom: ${experienceLevel}, Cel: ${mainGoal}, Dni/tydzień: ${daysPerWeek}`);
  
  // Absolutni początkujący
  if (experienceLevel === 'absolute_beginner') {
    console.log('Użytkownik jest absolutnym początkującym');
    if (mainGoal === 'start_running') {
      let plan;
      if (daysPerWeek >= 4) {
        plan = planTemplates['start_running_4days'];
      } else if (daysPerWeek >= 3) {
        plan = planTemplates['start_running_3days'];
      } else {
        plan = planTemplates['start_running_2days'];
      }
      console.log('Wybrany plan startowy:', plan.metadata.description);
      return plan;
    }
  }
  
  // Początkujący
  if (experienceLevel === 'beginner') {
    console.log('Użytkownik jest początkującym');
    if (mainGoal === 'run_5k') {
      const plan = daysPerWeek >= 4 ? planTemplates['5km_beginner_4days'] : planTemplates['5km_beginner_3days'];
      console.log('Wybrany plan 5km:', plan.metadata.description);
      return plan;
    }
    if (mainGoal === 'run_10k') {
      const plan = daysPerWeek >= 4 ? planTemplates['10km_beginner_4days'] : planTemplates['10km_beginner_3days'];
      console.log('Wybrany plan 10km:', plan.metadata.description);
      return plan;
    }
    if (mainGoal === 'half_marathon') {
      const plan = daysPerWeek >= 4 ? planTemplates['halfMarathon_beginner_4days'] : planTemplates['halfMarathon_beginner_3days'];
      console.log('Wybrany plan półmaratonu:', plan.metadata.description);
      return plan;
    }
  }
  
  // Średniozaawansowani
  if (experienceLevel === 'intermediate') {
    console.log('Użytkownik jest średniozaawansowany');
    if (mainGoal === 'run_5k') {
      let plan;
      if (daysPerWeek >= 5) {
        plan = planTemplates['5km_intermediate_5days'];
      } else if (daysPerWeek >= 4) {
        plan = planTemplates['5km_intermediate_4days'];
      } else {
        plan = planTemplates['5km_intermediate_3days'];
      }
      console.log('Wybrany plan 5km:', plan.metadata.description);
      return plan;
    }
    if (mainGoal === 'run_10k') {
      const plan = daysPerWeek >= 5 ? planTemplates['10km_intermediate_5days'] : planTemplates['10km_intermediate_4days'];
      console.log('Wybrany plan 10km:', plan.metadata.description);
      return plan;
    }
    if (mainGoal === 'half_marathon') {
      const plan = daysPerWeek >= 5 ? planTemplates['halfMarathon_intermediate_5days'] : planTemplates['halfMarathon_intermediate_4days'];
      console.log('Wybrany plan półmaratonu:', plan.metadata.description);
      return plan;
    }
    if (mainGoal === 'marathon') {
      const plan = daysPerWeek >= 5 ? planTemplates['marathon_intermediate_5days'] : planTemplates['marathon_intermediate_4days'];
      console.log('Wybrany plan maratonu:', plan.metadata.description);
      return plan;
    }
  }
  
  // Zaawansowani
  if (experienceLevel === 'advanced') {
    console.log('Użytkownik jest zaawansowany');
    if (mainGoal === 'run_5k') {
      let plan;
      if (daysPerWeek >= 5) {
        plan = planTemplates['5km_advanced_5days'];
      } else if (daysPerWeek >= 4) {
        plan = planTemplates['5km_advanced_4days'];
      } else {
        plan = planTemplates['5km_advanced_3days'];
      }
      console.log('Wybrany plan 5km:', plan.metadata.description);
      return plan;
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
      console.log('Wybrany plan 10km:', plan.metadata.description);
      return plan;
    }
    if (mainGoal === 'half_marathon') {
      const plan = daysPerWeek >= 6 ? planTemplates['halfMarathon_advanced_6days'] : planTemplates['halfMarathon_advanced_5days'];
      console.log('Wybrany plan półmaratonu:', plan.metadata.description);
      return plan;
    }
    if (mainGoal === 'marathon') {
      const plan = daysPerWeek >= 6 ? planTemplates['marathon_advanced_6days'] : planTemplates['marathon_advanced_5days'];
      console.log('Wybrany plan maratonu:', plan.metadata.description);
      return plan;
    }
  }

  console.log('\nNie znaleziono dopasowania do żadnego planu');
  return null;
}

/**
 * Zwraca przykładowy szablon planu do wykorzystania w promptach.
 * @param {Object} userData - dane z formularza użytkownika (opcjonalne)
 * @returns {Object} - przykładowy szablon planu
 */
function getExamplePlanTemplate(userData) {
  console.log('\n=== Rozpoczynam proces doboru przykładowego planu ===');
  
  // Najpierw próbujemy dopasować szablon do danych użytkownika
  console.log('Próba dopasowania planu do danych użytkownika...');
  const matchedTemplate = selectPlanTemplate(userData);
  if (matchedTemplate) {
    console.log('Znaleziono dopasowany plan:', matchedTemplate.metadata.description);
    return matchedTemplate;
  }
  
  // Jeśli nie ma dopasowania, wybierz odpowiedni szablon na podstawie celu
  if (userData.mainGoal) {
    console.log('\nNie znaleziono dopasowania, wybieram plan na podstawie celu...');
    let plan;
    switch (userData.mainGoal) {
      case 'start_running':
        plan = planTemplates['start_running_3days'];
        console.log('Wybrano plan startowy:', plan.metadata.description);
        return plan;
      case 'run_5k':
        plan = planTemplates['5km_beginner_3days'];
        console.log('Wybrano plan 5km:', plan.metadata.description);
        return plan;
      case 'run_10k':
        plan = planTemplates['10km_intermediate_4days'];
        console.log('Wybrano plan 10km:', plan.metadata.description);
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

  // Jeśli nie ma celu lub nie znaleziono dopasowania, zwróć domyślny szablon
  console.log('\nNie znaleziono dopasowania, używam domyślnego planu 10km');
  const defaultPlan = planTemplates['10km_intermediate_4days'];
  console.log('Wybrano domyślny plan:', defaultPlan.metadata.description);
  return defaultPlan;
}

module.exports = {
  selectPlanTemplate,
  getExamplePlanTemplate
};
