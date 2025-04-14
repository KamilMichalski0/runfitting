module.exports = {
  // Szablon dla początkujących przygotowujących się do 5km
  '5km_beginner_3days': {
    baseDistance: 15, // km na tydzień
    weeks: [
      {
        weekNumber: 1,
        days: [
          {
            dayOfWeek: 'poniedziałek',
            workoutType: 'easy',
            description: 'Bieg ciągły w strefie 2',
            distance: 3,
            duration: 30,
            targetPace: { minPerKm: 7, secPerKm: 30 },
            targetHeartRate: { min: 120, max: 140 },
            supportExercises: [
              { name: "Przysiady", sets: 3, reps: 12 },
              { name: "Plank", sets: 3, duration: 30 }
            ]
          },
          {
            dayOfWeek: 'środa',
            workoutType: 'recovery',
            description: 'Bieg/walka w strefie 1',
            distance: 2,
            duration: 25,
            targetPace: { minPerKm: 8, secPerKm: 0 },
            targetHeartRate: { min: 110, max: 130 },
            supportExercises: [
              { name: "Rozciąganie dynamiczne", sets: 1, duration: 10 }
            ]
          },
          {
            dayOfWeek: 'sobota',
            workoutType: 'long',
            description: 'Dłuższy bieg w strefie 2',
            distance: 4,
            duration: 40,
            targetPace: { minPerKm: 7, secPerKm: 30 },
            targetHeartRate: { min: 120, max: 140 },
            supportExercises: []
          }
        ]
      },
      // Więcej tygodni...
    ]
  },

  // Szablon dla średniozaawansowanych przygotowujących się do 10km
  '10km_intermediate_4days': {
    baseDistance: 25,
    weeks: [
      {
        weekNumber: 1,
        days: [
          {
            dayOfWeek: 'poniedziałek',
            workoutType: 'easy',
            description: 'Bieg ciągły w strefie 2',
            distance: 5,
            duration: 45,
            targetPace: { minPerKm: 6, secPerKm: 30 },
            targetHeartRate: { min: 130, max: 150 },
            supportExercises: [
              { name: "Przysiady", sets: 3, reps: 15 },
              { name: "Wykroki", sets: 3, reps: 12 }
            ]
          },
          {
            dayOfWeek: 'środa',
            workoutType: 'tempo',
            description: 'Bieg tempowy w strefie 3',
            distance: 6,
            duration: 40,
            targetPace: { minPerKm: 5, secPerKm: 45 },
            targetHeartRate: { min: 150, max: 165 },
            supportExercises: [
              { name: "Plank", sets: 3, duration: 45 }
            ]
          },
          {
            dayOfWeek: 'piątek',
            workoutType: 'recovery',
            description: 'Bieg regeneracyjny w strefie 1',
            distance: 4,
            duration: 35,
            targetPace: { minPerKm: 7, secPerKm: 0 },
            targetHeartRate: { min: 120, max: 140 },
            supportExercises: [
              { name: "Rozciąganie", sets: 1, duration: 15 }
            ]
          },
          {
            dayOfWeek: 'niedziela',
            workoutType: 'long',
            description: 'Długi bieg w strefie 2',
            distance: 8,
            duration: 70,
            targetPace: { minPerKm: 6, secPerKm: 30 },
            targetHeartRate: { min: 130, max: 150 },
            supportExercises: []
          }
        ]
      },
      // Więcej tygodni...
    ]
  },

  // Szablon dla zaawansowanych przygotowujących się do półmaratonu
  'halfMarathon_advanced_5days': {
    baseDistance: 45,
    weeks: [
      {
        weekNumber: 1,
        days: [
          {
            dayOfWeek: 'poniedziałek',
            workoutType: 'easy',
            description: 'Bieg ciągły w strefie 2',
            distance: 8,
            duration: 60,
            targetPace: { minPerKm: 5, secPerKm: 30 },
            targetHeartRate: { min: 140, max: 160 },
            supportExercises: [
              { name: "Przysiady", sets: 4, reps: 15 },
              { name: "Wykroki", sets: 4, reps: 12 }
            ]
          },
          {
            dayOfWeek: 'wtorek',
            workoutType: 'interval',
            description: 'Interwały 400m w strefie 5',
            distance: 8,
            duration: 50,
            targetPace: { minPerKm: 4, secPerKm: 30 },
            targetHeartRate: { min: 170, max: 185 },
            supportExercises: [
              { name: "Plank", sets: 4, duration: 60 }
            ]
          },
          {
            dayOfWeek: 'czwartek',
            workoutType: 'tempo',
            description: 'Bieg tempowy w strefie 3',
            distance: 10,
            duration: 60,
            targetPace: { minPerKm: 5, secPerKm: 0 },
            targetHeartRate: { min: 160, max: 175 },
            supportExercises: [
              { name: "Wspięcia na palce", sets: 4, reps: 20 }
            ]
          },
          {
            dayOfWeek: 'piątek',
            workoutType: 'recovery',
            description: 'Bieg regeneracyjny w strefie 1',
            distance: 6,
            duration: 45,
            targetPace: { minPerKm: 6, secPerKm: 0 },
            targetHeartRate: { min: 130, max: 150 },
            supportExercises: [
              { name: "Rozciąganie", sets: 1, duration: 20 }
            ]
          },
          {
            dayOfWeek: 'niedziela',
            workoutType: 'long',
            description: 'Długi bieg w strefie 2',
            distance: 15,
            duration: 100,
            targetPace: { minPerKm: 5, secPerKm: 30 },
            targetHeartRate: { min: 140, max: 160 },
            supportExercises: []
          }
        ]
      },
      // Więcej tygodni...
    ]
  }
}; 