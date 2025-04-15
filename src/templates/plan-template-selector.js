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
  // Sprawdzenie kontuzji/problemów zdrowotnych (priorytet najwyższy)
  if (userData.injuries && userData.injuries.includes('plantar_fasciitis')) {
    return planTemplates['running_return_plantar_fasciitis_4days_6weeks'];
  }
  
  if (userData.injuries && userData.injuries.includes('achilles_pain')) {
    return planTemplates['achilles_pain_management_3days_4weeks'];
  }

  // Sprawdzenie celu i poziomu zaawansowania
  const { mainGoal, experienceLevel, daysPerWeek } = userData;
  
  // Początkujący
  if (experienceLevel === 'beginner') {
    if (mainGoal === 'run_5k') {
      return planTemplates['5km_beginner_3days'];
    }
    // Dodaj więcej szablonów dla początkujących z różnymi celami
  }
  
  // Średniozaawansowani
  if (experienceLevel === 'intermediate') {
    if (mainGoal === 'run_10k') {
      return planTemplates['10km_intermediate_4days'];
    }
    // Dodaj więcej szablonów dla średniozaawansowanych z różnymi celami
  }
  
  // Zaawansowani
  if (experienceLevel === 'advanced') {
    if (mainGoal === 'half_marathon' || mainGoal === 'marathon') {
      return planTemplates['halfMarathon_advanced_5days'];
    }
    // Dodaj więcej szablonów dla zaawansowanych z różnymi celami
  }

  // Jeśli nie znaleziono dopasowania, zwróć null
  // (w takim przypadku Gemini wygeneruje plan od podstaw)
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
  
  // Jeśli nie ma dopasowania, zwracamy domyślny przykład
  // Wybieramy szablon, który ma najbardziej kompletną strukturę
  if (userData.injuries && userData.injuries.length > 0) {
    // Jeśli użytkownik ma jakiekolwiek kontuzje, użyj szablonu rehabilitacyjnego
    return planTemplates['running_return_plantar_fasciitis_4days_6weeks'];
  } else {
    // W przeciwnym razie użyj standardowego szablonu biegowego
    return planTemplates['10km_intermediate_4days'];
  }
}

module.exports = {
  selectPlanTemplate,
  getExamplePlanTemplate
};
