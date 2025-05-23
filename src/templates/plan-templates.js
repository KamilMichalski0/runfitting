module.exports = {
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
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Wprowadzenie do regularnego biegania, budowanie bazy.",
        days: [
          { day_name: "Wtorek", workout: { type: 'easy', description: 'Bieg ciągły w strefie 1-2', distance: 2, duration: 20, target_pace: { min_per_km: 8, sec_per_km: 0 }, target_heart_rate: { min: 115, max: 135 }, support_exercises: [{ name: "Rozciąganie dynamiczne", sets: 1, duration: 10 }] } },
          { day_name: "Czwartek", workout: { type: 'easy', description: 'Bieg/marsz w strefie 1', distance: 2.5, duration: 25, target_pace: { min_per_km: 8, sec_per_km: 30 }, target_heart_rate: { min: 110, max: 130 }, support_exercises: [] } },
          { day_name: "Sobota", workout: { type: 'long', description: 'Dłuższy bieg w strefie 1-2', distance: 3, duration: 30, target_pace: { min_per_km: 8, sec_per_km: 0 }, target_heart_rate: { min: 115, max: 135 }, support_exercises: [{ name: "Rozciąganie statyczne", sets: 1, duration: 10 }] } }
        ]
      }
    ]
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
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Budowanie regularności i bazy tlenowej.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'easy', description: 'Bieg ciągły w strefie 1-2', distance: 2.5, duration: 25, target_pace: { min_per_km: 8, sec_per_km: 0 }, target_heart_rate: { min: 115, max: 135 }, support_exercises: [] } },
          { day_name: "Środa", workout: { type: 'easy', description: 'Bieg/marsz w strefie 1', distance: 3, duration: 30, target_pace: { min_per_km: 8, sec_per_km: 30 }, target_heart_rate: { min: 110, max: 130 }, support_exercises: [{ name: "Przysiady", sets: 3, reps: 10 }] } },
          { day_name: "Piątek", workout: { type: 'recovery', description: 'Lekki bieg lub marsz', distance: 2, duration: 20, target_pace: { min_per_km: 9, sec_per_km: 0 }, target_heart_rate: { min: 100, max: 120 }, support_exercises: [] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Dłuższy bieg w strefie 1-2', distance: 3.5, duration: 35, target_pace: { min_per_km: 8, sec_per_km: 0 }, target_heart_rate: { min: 115, max: 135 }, support_exercises: [{ name: "Rozciąganie statyczne", sets: 1, duration: 10 }] } }
        ]
      }
    ]
  },
  
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
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Stopniowe zwiększanie dystansu, adaptacja do wysiłku.",
        days: [
          { day_name: "Wtorek", workout: { type: 'easy', description: 'Bieg ciągły w strefie 1-2', distance: 3, duration: 30, target_pace: { min_per_km: 7, sec_per_km: 30 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [] } },
          { day_name: "Czwartek", workout: { type: 'easy', description: 'Bieg w strefie 2', distance: 4, duration: 40, target_pace: { min_per_km: 7, sec_per_km: 45 }, target_heart_rate: { min: 125, max: 145 }, support_exercises: [{ name: "Plank", sets: 3, duration: 30 }] } },
          { day_name: "Sobota", workout: { type: 'long', description: 'Dłuższy bieg w strefie 1-2', distance: 5, duration: 50, target_pace: { min_per_km: 8, sec_per_km: 0 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [] } }
        ]
      }
    ]
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
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Budowanie wytrzymałości tlenowej, regularność.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'easy', description: 'Bieg ciągły w strefie 1-2', distance: 3, duration: 30, target_pace: { min_per_km: 7, sec_per_km: 30 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [] } },
          { day_name: "Środa", workout: { type: 'easy', description: 'Bieg w strefie 2', distance: 4, duration: 40, target_pace: { min_per_km: 7, sec_per_km: 45 }, target_heart_rate: { min: 125, max: 145 }, support_exercises: [] } },
          { day_name: "Piątek", workout: { type: 'recovery', description: 'Lekki bieg/marsz', distance: 3, duration: 30, target_pace: { min_per_km: 8, sec_per_km: 30 }, target_heart_rate: { min: 110, max: 130 }, support_exercises: [] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Dłuższy bieg w strefie 1-2', distance: 6, duration: 60, target_pace: { min_per_km: 8, sec_per_km: 0 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [{ name: "Przysiady", sets: 3, reps: 12 }, { name: "Wykroki", sets: 3, reps: 10 }] } }
        ]
      }
    ]
  },
  
  'halfMarathon_beginner_3days': {
    id: 'halfMarathon_beginner_3days',
    metadata: {
      discipline: "running",
      target_group: "Początkujący biegacze",
      target_goal: "Półmaraton",
      level_hint: "beginner",
      days_per_week: 3,
      duration_weeks: 16,
      base_distance_km: 20,
      description: "Plan treningowy dla początkujących biegaczy przygotowujących się do ukończenia pierwszego półmaratonu z 3 treningami tygodniowo",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Budowanie podstawowej wytrzymałości i przyzwyczajanie organizmu do regularnego treningu.",
        days: [
          { day_name: "Wtorek", workout: { type: 'easy', description: 'Bieg w strefie 2', distance: 5, duration: 40, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 145 }, support_exercises: [{ name: "Ćwiczenia mobilizacyjne", sets: 1, duration: 10 }] } },
          { day_name: "Czwartek", workout: { type: 'easy', description: 'Bieg w strefie 2 z przyśpieszeniami 5x30s', distance: 5, duration: 40, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 145 }, support_exercises: [] } },
          { day_name: "Sobota", workout: { type: 'long', description: 'Długi bieg w strefie 1-2', distance: 8, duration: 65, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [{ name: "Rozciąganie mięśni nóg", sets: 1, duration: 15 }] } }
        ]
      }
    ]
  },
  
  'halfMarathon_beginner_4days': {
    id: 'halfMarathon_beginner_4days',
    metadata: {
      discipline: "running",
      target_group: "Początkujący biegacze",
      target_goal: "Półmaraton",
      level_hint: "beginner",
      days_per_week: 4,
      duration_weeks: 16,
      base_distance_km: 25,
      description: "Plan treningowy dla początkujących biegaczy przygotowujących się do ukończenia pierwszego półmaratonu z 4 treningami tygodniowo",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Stopniowe budowanie bazy wytrzymałościowej z akcentem na prawidłową technikę i regularność.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'easy', description: 'Lekki bieg w strefie 2', distance: 5, duration: 40, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 145 }, support_exercises: [] } },
          { day_name: "Środa", workout: { type: 'easy', description: 'Bieg w strefie 2 z przyśpieszeniami 6x30s', distance: 6, duration: 45, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 145 }, support_exercises: [{ name: "Wzmacnianie core", sets: 2, reps: 12 }] } },
          { day_name: "Piątek", workout: { type: 'easy', description: 'Bieg w strefie 2', distance: 5, duration: 40, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 145 }, support_exercises: [] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Długi bieg w strefie 1-2', distance: 9, duration: 75, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [{ name: "Rozciąganie całego ciała", sets: 1, duration: 15 }] } }
        ]
      }
    ]
  },
  
  'halfMarathon_beginner_5days': {
    id: 'halfMarathon_beginner_5days',
    metadata: {
      discipline: "running",
      target_group: "Początkujący biegacze",
      target_goal: "Półmaraton",
      level_hint: "beginner",
      days_per_week: 5,
      duration_weeks: 16,
      base_distance_km: 30,
      description: "Plan treningowy dla początkujących biegaczy przygotowujących się do ukończenia pierwszego półmaratonu z 5 treningami tygodniowo",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Budowanie wytrzymałości aerobowej i przyzwyczajanie organizmu do codziennego treningu.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'easy', description: 'Lekki bieg w strefie 1-2', distance: 5, duration: 40, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 145 }, support_exercises: [] } },
          { day_name: "Wtorek", workout: { type: 'easy', description: 'Bieg w strefie 2 z techniką', distance: 6, duration: 45, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 145 }, support_exercises: [{ name: "Ćwiczenia techniki biegowej", sets: 4, reps: 20 }] } },
          { day_name: "Czwartek", workout: { type: 'easy', description: 'Bieg w strefie 2 z przyśpieszeniami 6x30s', distance: 6, duration: 45, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 145 }, support_exercises: [] } },
          { day_name: "Piątek", workout: { type: 'recovery', description: 'Bieg regeneracyjny w strefie 1', distance: 4, duration: 35, target_pace: { min_per_km: 7, sec_per_km: 30 }, target_heart_rate: { min: 120, max: 135 }, support_exercises: [{ name: "Rolowanie mięśni", sets: 1, duration: 10 }] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Długi bieg w strefie 1-2', distance: 10, duration: 85, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [{ name: "Stretching statyczny", sets: 1, duration: 15 }] } }
        ]
      }
    ]
  },
  
  'halfMarathon_intermediate_3days': {
    id: 'halfMarathon_intermediate_3days',
    metadata: {
      discipline: "running",
      target_group: "Średniozaawansowani biegacze",
      target_goal: "Półmaraton",
      level_hint: "intermediate",
      days_per_week: 3,
      duration_weeks: 14,
      base_distance_km: 30,
      description: "Plan treningowy dla średniozaawansowanych biegaczy przygotowujących się do półmaratonu z 3 treningami tygodniowo",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Zwiększenie wytrzymałości podstawowej z elementami tempa maratońskiego.",
        days: [
          { day_name: "Wtorek", workout: { type: 'tempo', description: 'Bieg tempowy 6km w strefie 3', distance: 10, duration: 65, target_pace: { min_per_km: 5, sec_per_km: 45 }, target_heart_rate: { min: 150, max: 165 }, support_exercises: [{ name: "Wzmacnianie mięśni nóg", sets: 3, reps: 12 }] } },
          { day_name: "Czwartek", workout: { type: 'interval', description: 'Interwały 5x1000m w strefie 4, przerwa 400m trucht', distance: 10, duration: 65, target_pace: { min_per_km: 5, sec_per_km: 0 }, target_heart_rate: { min: 160, max: 175 }, support_exercises: [] } },
          { day_name: "Sobota", workout: { type: 'long', description: 'Długi bieg w strefie 2', distance: 16, duration: 105, target_pace: { min_per_km: 6, sec_per_km: 0 }, target_heart_rate: { min: 140, max: 155 }, support_exercises: [{ name: "Rozciąganie mięśni nóg", sets: 1, duration: 15 }] } }
        ]
      }
    ]
  },
  
  'halfMarathon_intermediate_4days': {
    id: 'halfMarathon_intermediate_4days',
    metadata: {
      discipline: "running",
      target_group: "Średniozaawansowani biegacze",
      target_goal: "Półmaraton",
      level_hint: "intermediate",
      days_per_week: 4,
      duration_weeks: 14,
      base_distance_km: 35,
      description: "Plan treningowy dla średniozaawansowanych biegaczy przygotowujących się do półmaratonu z 4 treningami tygodniowo",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Zrównoważony trening łączący objętość z intensywnością.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'easy', description: 'Bieg w strefie 2', distance: 8, duration: 55, target_pace: { min_per_km: 6, sec_per_km: 15 }, target_heart_rate: { min: 140, max: 155 }, support_exercises: [] } },
          { day_name: "Środa", workout: { type: 'interval', description: 'Interwały 6x800m w strefie 4, przerwa 400m trucht', distance: 10, duration: 65, target_pace: { min_per_km: 4, sec_per_km: 45 }, target_heart_rate: { min: 160, max: 175 }, support_exercises: [{ name: "Ćwiczenia stabilizacyjne", sets: 3, duration: 5 }] } },
          { day_name: "Piątek", workout: { type: 'tempo', description: 'Bieg tempowy 8km w strefie 3', distance: 12, duration: 75, target_pace: { min_per_km: 5, sec_per_km: 30 }, target_heart_rate: { min: 155, max: 165 }, support_exercises: [] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Długi bieg w strefie 2', distance: 18, duration: 120, target_pace: { min_per_km: 6, sec_per_km: 0 }, target_heart_rate: { min: 140, max: 155 }, support_exercises: [{ name: "Rozciąganie dynamiczne po biegu", sets: 1, duration: 15 }] } }
        ]
      }
    ]
  },
  
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
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Wprowadzenie elementów tempowych i interwałowych.",
        days: [
          { day_name: "Wtorek", workout: { type: 'easy', description: 'Bieg w strefie 2', distance: 5, duration: 40, target_pace: { min_per_km: 6, sec_per_km: 30 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [] } },
          { day_name: "Czwartek", workout: { type: 'interval', description: 'Interwały 6x400m w strefie 4, przerwa 400m trucht', distance: 6, duration: 45, target_pace: { min_per_km: 5, sec_per_km: 0 }, target_heart_rate: { min: 155, max: 170 }, support_exercises: [] } },
          { day_name: "Sobota", workout: { type: 'long', description: 'Dłuższy bieg w strefie 2', distance: 7, duration: 60, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [] } }
        ]
      }
    ]
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
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Równowaga między objętością a intensywnością.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'easy', description: 'Bieg w strefie 2', distance: 6, duration: 45, target_pace: { min_per_km: 6, sec_per_km: 30 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [{ name: "Przysiady bułgarskie", sets: 3, reps: 10, side: 'each' }] } },
          { day_name: "Środa", workout: { type: 'tempo', description: 'Bieg tempowy 3km w strefie 3 + rozgrzewka i schłodzenie', distance: 7, duration: 45, target_pace: { min_per_km: 5, sec_per_km: 30 }, target_heart_rate: { min: 150, max: 165 }, support_exercises: [] } },
          { day_name: "Piątek", workout: { type: 'recovery', description: 'Lekki bieg regeneracyjny', distance: 4, duration: 30, target_pace: { min_per_km: 7, sec_per_km: 30 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Dłuższy bieg w strefie 2', distance: 8, duration: 70, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [] } }
        ]
      }
    ]
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
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Zwiększona objętość i intensywność, praca nad szybkością.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'easy', description: 'Bieg w strefie 2', distance: 6, duration: 45, target_pace: { min_per_km: 6, sec_per_km: 30 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [] } },
          { day_name: "Wtorek", workout: { type: 'interval', description: 'Interwały 8x400m w strefie 4/5, przerwa 400m trucht', distance: 7, duration: 50, target_pace: { min_per_km: 4, sec_per_km: 45 }, target_heart_rate: { min: 160, max: 175 }, support_exercises: [] } },
          { day_name: "Czwartek", workout: { type: 'tempo', description: 'Bieg tempowy 4km w strefie 3', distance: 8, duration: 50, target_pace: { min_per_km: 5, sec_per_km: 30 }, target_heart_rate: { min: 150, max: 165 }, support_exercises: [] } },
          { day_name: "Piątek", workout: { type: 'recovery', description: 'Bardzo lekki bieg regeneracyjny', distance: 4, duration: 30, target_pace: { min_per_km: 7, sec_per_km: 30 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [{ name: "Rolowanie łydek", sets: 1, duration: 5 }] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Dłuższy bieg w strefie 2', distance: 10, duration: 80, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [] } }
        ]
      }
    ]
  },

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
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Budowanie bazy wytrzymałościowej i wprowadzenie tempa.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'easy', description: 'Bieg ciągły w strefie 2', distance: 5, duration: 45, target_pace: { min_per_km: 6, sec_per_km: 30 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [{ name: "Przysiady", sets: 3, reps: 15 }, { name: "Wykroki", sets: 3, reps: 12 }] } },
          { day_name: "Środa", workout: { type: 'tempo', description: 'Bieg tempowy w strefie 3 (4km)', distance: 7, duration: 45, target_pace: { min_per_km: 5, sec_per_km: 45 }, target_heart_rate: { min: 155, max: 165 }, support_exercises: [{ name: "Plank", sets: 3, duration: 45 }] } },
          { day_name: "Piątek", workout: { type: 'recovery', description: 'Bieg regeneracyjny w strefie 1', distance: 4, duration: 35, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [{ name: "Rozciąganie", sets: 1, duration: 15 }] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Długi bieg w strefie 2', distance: 8, duration: 70, target_pace: { min_per_km: 6, sec_per_km: 30 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [] } }
        ]
      }
    ]
  },
  
  '10km_intermediate_3days': {
    id: '10km_intermediate_3days',
    metadata: {
      discipline: "running",
      target_group: "Średniozaawansowani biegacze",
      target_goal: "10km",
      level_hint: "intermediate",
      days_per_week: 3,
      duration_weeks: 8,
      base_distance_km: 30,
      duration_weeks: 10,
      base_distance_km: 22,
      description: "Plan treningowy dla średniozaawansowanych biegaczy przygotowujących się do biegu na 10km z 3 treningami tygodniowo",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Równowaga między objętością a intensywnością.",
        days: [
          { day_name: "Wtorek", workout: { type: 'tempo', description: 'Bieg tempowy w strefie 3 (4km)', distance: 8, duration: 50, target_pace: { min_per_km: 5, sec_per_km: 45 }, target_heart_rate: { min: 155, max: 165 }, support_exercises: [{ name: "Przysiady", sets: 3, reps: 15 }, { name: "Plank", sets: 3, duration: 45 }] } },
          { day_name: "Czwartek", workout: { type: 'interval', description: 'Interwały 6x800m w strefie 4, przerwa 400m trucht', distance: 8, duration: 50, target_pace: { min_per_km: 5, sec_per_km: 0 }, target_heart_rate: { min: 160, max: 175 }, support_exercises: [{ name: "Podskoki", sets: 3, reps: 15 }] } },
          { day_name: "Sobota", workout: { type: 'long', description: 'Długi bieg w strefie 2', distance: 10, duration: 65, target_pace: { min_per_km: 6, sec_per_km: 15 }, target_heart_rate: { min: 140, max: 155 }, support_exercises: [{ name: "Rozciąganie", sets: 1, duration: 15 }] } }
        ]
      }
    ]
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
      base_distance_km: 30,
      description: "Intensywny 5-dniowy plan treningowy dla średniozaawansowanych biegaczy skupiający się na dystansie 10km",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Zwiększona objętość treningowa z naciskiem na różnorodność bodźców treningowych.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'easy', description: 'Bieg w strefie 2', distance: 6, duration: 45, target_pace: { min_per_km: 6, sec_per_km: 20 }, target_heart_rate: { min: 135, max: 150 }, support_exercises: [{ name: "Wzmacnianie core", sets: 2, duration: 10 }] } },
          { day_name: "Wtorek", workout: { type: 'interval', description: 'Interwały 8x600m w strefie 4, przerwa 400m trucht', distance: 9, duration: 55, target_pace: { min_per_km: 4, sec_per_km: 45 }, target_heart_rate: { min: 160, max: 175 }, support_exercises: [] } },
          { day_name: "Czwartek", workout: { type: 'tempo', description: 'Bieg tempowy 5km w strefie 3', distance: 9, duration: 55, target_pace: { min_per_km: 5, sec_per_km: 30 }, target_heart_rate: { min: 150, max: 165 }, support_exercises: [] } },
          { day_name: "Piątek", workout: { type: 'recovery', description: 'Bieg regeneracyjny w strefie 1', distance: 5, duration: 40, target_pace: { min_per_km: 6, sec_per_km: 50 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [{ name: "Rozciąganie dynamiczne", sets: 1, duration: 10 }] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Długi bieg w strefie 2', distance: 12, duration: 80, target_pace: { min_per_km: 6, sec_per_km: 15 }, target_heart_rate: { min: 140, max: 155 }, support_exercises: [{ name: "Rozciąganie kompleksowe", sets: 1, duration: 15 }] } }
        ]
      }
    ]
  },
  
  'halfMarathon_intermediate_5days': {
    id: 'halfMarathon_intermediate_5days',
    metadata: {
      discipline: "running",
      target_group: "Średniozaawansowani biegacze",
      target_goal: "Półmaraton",
      level_hint: "intermediate",
      days_per_week: 5,
      duration_weeks: 18,
      base_distance_km: 60,
      description: "Plan treningowy dla średniozaawansowanych biegaczy przygotowujących się do maratonu z 5 treningami tygodniowo",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Kompleksowy rozwój wszystkich aspektów wytrzymałości przy 5 treningach tygodniowo.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'recovery', description: 'Bieg regeneracyjny w strefie 1', distance: 8, duration: 60, target_pace: { min_per_km: 6, sec_per_km: 45 }, target_heart_rate: { min: 125, max: 140 }, support_exercises: [] } },
          { day_name: "Wtorek", workout: { type: 'interval', description: 'Interwały 10x800m w strefie 4-5, przerwa 400m trucht', distance: 16, duration: 100, target_pace: { min_per_km: 4, sec_per_km: 30 }, target_heart_rate: { min: 160, max: 180 }, support_exercises: [{ name: "Ćwiczenia siłowe nóg", sets: 3, reps: 12 }] } },
          { day_name: "Czwartek", workout: { type: 'tempo', description: 'Bieg tempowy 12km w strefie 3', distance: 16, duration: 95, target_pace: { min_per_km: 5, sec_per_km: 15 }, target_heart_rate: { min: 150, max: 165 }, support_exercises: [{ name: "Wzmacnianie core", sets: 3, reps: 15 }] } },
          { day_name: "Piątek", workout: { type: 'easy', description: 'Lekki bieg w strefie 2', distance: 10, duration: 70, target_pace: { min_per_km: 6, sec_per_km: 30 }, target_heart_rate: { min: 135, max: 150 }, support_exercises: [] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Długi bieg w strefie 2 z ostatnimi 5km w strefie 3', distance: 26, duration: 160, target_pace: { min_per_km: 5, sec_per_km: 50 }, target_heart_rate: { min: 140, max: 160 }, support_exercises: [{ name: "Rozciąganie dynamiczne i statyczne", sets: 1, duration: 20 }] } }
        ]
      }
    ]
  },
  
  'marathon_beginner_3days': {
    id: 'marathon_beginner_3days',
    metadata: {
      discipline: "running",
      target_group: "Początkujący biegacze",
      target_goal: "Maraton",
      level_hint: "beginner",
      days_per_week: 3,
      duration_weeks: 20,
      base_distance_km: 25,
      description: "Plan treningowy dla początkujących biegaczy przygotowujących się do ukończenia pierwszego maratonu z 3 treningami tygodniowo",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Budowanie bazy wytrzymałościowej i przyzwyczajanie organizmu do regularnych długich biegów.",
        days: [
          { day_name: "Wtorek", workout: { type: 'easy', description: 'Bieg w strefie 2', distance: 7, duration: 55, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 145 }, support_exercises: [{ name: "Ćwiczenia wzmacniające mięśnie nóg", sets: 2, reps: 12 }] } },
          { day_name: "Czwartek", workout: { type: 'easy', description: 'Bieg w strefie 2 z przyśpieszeniami 5x30s', distance: 6, duration: 50, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 145 }, support_exercises: [] } },
          { day_name: "Sobota", workout: { type: 'long', description: 'Długi bieg w strefie 1-2', distance: 12, duration: 95, target_pace: { min_per_km: 7, sec_per_km: 15 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [{ name: "Rozciąganie mięśni nóg", sets: 1, duration: 15 }] } }
        ]
      }
    ]
  },
  
  'marathon_beginner_4days': {
    id: 'marathon_beginner_4days',
    metadata: {
      discipline: "running",
      target_group: "Początkujący biegacze",
      target_goal: "Maraton",
      level_hint: "beginner",
      days_per_week: 4,
      duration_weeks: 20,
      base_distance_km: 30,
      description: "Plan treningowy dla początkujących biegaczy przygotowujących się do ukończenia pierwszego maratonu z 4 treningami tygodniowo",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Budowanie wytrzymałości i adaptacja organizmu do zwiększonego obciążenia treningowego.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'easy', description: 'Lekki bieg w strefie 2', distance: 6, duration: 50, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 145 }, support_exercises: [] } },
          { day_name: "Środa", workout: { type: 'easy', description: 'Bieg w strefie 2 z przyśpieszeniami 6x30s', distance: 7, duration: 55, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 145 }, support_exercises: [{ name: "Wzmacnianie core", sets: 2, reps: 12 }] } },
          { day_name: "Piątek", workout: { type: 'easy', description: 'Bieg w strefie 2', distance: 6, duration: 50, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 145 }, support_exercises: [] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Długi bieg w strefie 1-2', distance: 14, duration: 110, target_pace: { min_per_km: 7, sec_per_km: 15 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [{ name: "Rozciąganie całego ciała", sets: 1, duration: 15 }] } }
        ]
      }
    ]
  },
  
  'marathon_beginner_5days': {
    id: 'marathon_beginner_5days',
    metadata: {
      discipline: "running",
      target_group: "Początkujący biegacze",
      target_goal: "Maraton",
      level_hint: "beginner",
      days_per_week: 5,
      duration_weeks: 20,
      base_distance_km: 35,
      description: "Plan treningowy dla początkujących biegaczy przygotowujących się do ukończenia pierwszego maratonu z 5 treningami tygodniowo",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Stopniowe zwiększanie objętości biegowej i przyzwyczajanie organizmu do codziennego biegania.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'easy', description: 'Lekki bieg w strefie 1-2', distance: 6, duration: 50, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 145 }, support_exercises: [] } },
          { day_name: "Wtorek", workout: { type: 'easy', description: 'Bieg w strefie 2 z techniką', distance: 7, duration: 55, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 145 }, support_exercises: [{ name: "Ćwiczenia techniki biegowej", sets: 4, reps: 20 }] } },
          { day_name: "Czwartek", workout: { type: 'easy', description: 'Bieg w strefie 2 z przyśpieszeniami 6x30s', distance: 7, duration: 55, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 145 }, support_exercises: [] } },
          { day_name: "Piątek", workout: { type: 'recovery', description: 'Bieg regeneracyjny w strefie 1', distance: 5, duration: 45, target_pace: { min_per_km: 7, sec_per_km: 30 }, target_heart_rate: { min: 120, max: 135 }, support_exercises: [{ name: "Rolowanie mięśni", sets: 1, duration: 10 }] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Długi bieg w strefie 1-2', distance: 16, duration: 125, target_pace: { min_per_km: 7, sec_per_km: 15 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [{ name: "Stretching statyczny", sets: 1, duration: 15 }] } }
        ]
      }
    ]
  },
  
  '10km_advanced_3days': {
    id: '10km_advanced_3days',
    metadata: {
      discipline: "running",
      target_group: "Zaawansowani biegacze",
      target_goal: "10km",
      level_hint: "advanced",
      days_per_week: 3,
      duration_weeks: 10,
      base_distance_km: 25,
      description: "Plan treningowy dla zaawansowanych biegaczy dążących do uzyskania najlepszego wyniku na 10km",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Jakościowy trening z naciskiem na intensywność.",
        days: [
          { day_name: "Wtorek", workout: { type: 'interval', description: 'Interwały 8x800m w strefie 4-5, przerwa 400m trucht', distance: 12, duration: 60, target_pace: { min_per_km: 3, sec_per_km: 50 }, target_heart_rate: { min: 170, max: 185 }, support_exercises: [{ name: "Wzmacnianie nóg", sets: 3, reps: 15 }] } },
          { day_name: "Czwartek", workout: { type: 'tempo', description: 'Bieg tempowy 6km w strefie 4', distance: 10, duration: 50, target_pace: { min_per_km: 4, sec_per_km: 15 }, target_heart_rate: { min: 165, max: 175 }, support_exercises: [{ name: "Core", sets: 3, duration: 10 }] } },
          { day_name: "Sobota", workout: { type: 'long', description: 'Długi bieg z wstawkami w tempie wyścigowym', distance: 16, duration: 85, target_pace: { min_per_km: 4, sec_per_km: 45 }, target_heart_rate: { min: 150, max: 170 }, support_exercises: [{ name: "Rozciąganie", sets: 1, duration: 15 }] } }
        ]
      }
    ]
  },
  
  '10km_advanced_4days': {
    id: '10km_advanced_4days',
    metadata: {
      discipline: "running",
      target_group: "Zaawansowani biegacze",
      target_goal: "10km",
      level_hint: "advanced",
      days_per_week: 4,
      duration_weeks: 10,
      base_distance_km: 30,
      description: "4-dniowy plan treningowy dla zaawansowanych biegaczy skupiający się na osiągnięciu rekordowego czasu na 10km",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Zbalansowana intensywność treningowa z odpowiednią regeneracją.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'easy', description: 'Bieg w strefie 2 z przyspieszeniami 6x100m', distance: 8, duration: 50, target_pace: { min_per_km: 5, sec_per_km: 15 }, target_heart_rate: { min: 140, max: 155 }, support_exercises: [{ name: "Mobilność bioder", sets: 2, duration: 8 }] } },
          { day_name: "Środa", workout: { type: 'interval', description: 'Interwały 2x(5x600m) w strefie 5, przerwa 200m trucht', distance: 12, duration: 60, target_pace: { min_per_km: 3, sec_per_km: 45 }, target_heart_rate: { min: 170, max: 185 }, support_exercises: [] } },
          { day_name: "Piątek", workout: { type: 'tempo', description: 'Bieg tempowy 7km w strefie 4', distance: 11, duration: 55, target_pace: { min_per_km: 4, sec_per_km: 10 }, target_heart_rate: { min: 165, max: 175 }, support_exercises: [] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Długi bieg z ostatnimi 3km w tempie progowym', distance: 16, duration: 85, target_pace: { min_per_km: 4, sec_per_km: 50 }, target_heart_rate: { min: 150, max: 170 }, support_exercises: [{ name: "Rozciąganie kompleksowe", sets: 1, duration: 15 }] } }
        ]
      }
    ]
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
      base_distance_km: 40,
      description: "Intensywny 5-dniowy plan treningowy dla zaawansowanych biegaczy z naciskiem na maksymalną wydajność na dystansie 10km",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Maksymalna adaptacja do wysokiej intensywności z odpowiednią regeneracją.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'easy', description: 'Bieg regeneracyjny w strefie 2', distance: 8, duration: 50, target_pace: { min_per_km: 5, sec_per_km: 30 }, target_heart_rate: { min: 140, max: 155 }, support_exercises: [{ name: "Mobilność", sets: 1, duration: 10 }] } },
          { day_name: "Wtorek", workout: { type: 'interval', description: 'Interwały 10x1000m w strefie 5, przerwa 400m trucht', distance: 16, duration: 80, target_pace: { min_per_km: 3, sec_per_km: 40 }, target_heart_rate: { min: 175, max: 185 }, support_exercises: [] } },
          { day_name: "Czwartek", workout: { type: 'tempo', description: 'Bieg tempowy progresywny 8km', distance: 12, duration: 60, target_pace: { min_per_km: 4, sec_per_km: 5 }, target_heart_rate: { min: 165, max: 180 }, support_exercises: [] } },
          { day_name: "Piątek", workout: { type: 'recovery', description: 'Bieg regeneracyjny w strefie 1-2', distance: 6, duration: 40, target_pace: { min_per_km: 5, sec_per_km: 50 }, target_heart_rate: { min: 130, max: 145 }, support_exercises: [{ name: "Rozciąganie dynamiczne", sets: 1, duration: 10 }] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Długi bieg z przyspieszeniami co 5km', distance: 18, duration: 95, target_pace: { min_per_km: 4, sec_per_km: 45 }, target_heart_rate: { min: 150, max: 170 }, support_exercises: [{ name: "Rozciąganie kompleksowe", sets: 1, duration: 15 }] } }
        ]
      }
    ]
  },
  
  'marathon_intermediate_3days': {
    id: 'marathon_intermediate_3days',
    metadata: {
      discipline: "running",
      target_group: "Średniozaawansowani biegacze",
      target_goal: "Maraton",
      level_hint: "intermediate",
      days_per_week: 3,
      duration_weeks: 18,
      base_distance_km: 40,
      description: "Plan treningowy dla średniozaawansowanych biegaczy przygotowujących się do maratonu z 3 treningami tygodniowo",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Budowanie podstawowej wytrzymałości i siły przy 3 treningach tygodniowo.",
        days: [
          { day_name: "Wtorek", workout: { type: 'interval', description: 'Interwały 6x800m w strefie 4-5, przerwa 400m trucht', distance: 12, duration: 75, target_pace: { min_per_km: 4, sec_per_km: 45 }, target_heart_rate: { min: 160, max: 180 }, support_exercises: [{ name: "Ćwiczenia wzmacniające core", sets: 3, reps: 15 }] } },
          { day_name: "Czwartek", workout: { type: 'tempo', description: 'Bieg tempowy 8km w strefie 3', distance: 12, duration: 75, target_pace: { min_per_km: 5, sec_per_km: 30 }, target_heart_rate: { min: 150, max: 165 }, support_exercises: [] } },
          { day_name: "Sobota", workout: { type: 'long', description: 'Długi bieg w strefie 2 z elementami strefy 3 w środku biegu', distance: 22, duration: 140, target_pace: { min_per_km: 6, sec_per_km: 0 }, target_heart_rate: { min: 140, max: 160 }, support_exercises: [{ name: "Rozciąganie dynamiczne", sets: 1, duration: 15 }] } }
        ]
      }
    ]
  },
  
  'marathon_intermediate_4days': {
    id: 'marathon_intermediate_4days',
    metadata: {
      discipline: "running",
      target_group: "Średniozaawansowani biegacze",
      target_goal: "marathon",
      level_hint: "intermediate",
      days_per_week: 4,
      duration_weeks: 16,
      base_distance_km: 30,
      description: "Plan treningowy dla średniozaawansowanych biegaczy przygotowujący do maratonu",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Budowanie bazy wytrzymałościowej i przyzwyczajanie organizmu do systematycznych treningów.",
        days: [
          { day_name: "Wtorek", workout: { type: 'easy', description: 'Spokojny bieg w strefie 2', distance: 8, duration: 48, target_pace: { min_per_km: 6, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [{ name: "Ćwiczenia mobilności", sets: 1, duration: 10 }] } },
          { day_name: "Czwartek", workout: { type: 'easy', description: 'Bieg z elementami tempa', distance: 10, duration: 60, target_pace: { min_per_km: 5, sec_per_km: 45 }, target_heart_rate: { min: 140, max: 160 }, support_exercises: [{ name: "Ćwiczenia stabilizacyjne core", sets: 2, reps: 10 }] } },
          { day_name: "Piątek", workout: { type: 'cross', description: 'Trening krzyżowy - rower/pływanie/elipsoida', distance: 0, duration: 40, target_heart_rate: { min: 120, max: 140 }, support_exercises: [{ name: "Rozciąganie statyczne", sets: 1, duration: 15 }] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Długi bieg w komfortowym tempie', distance: 14, duration: 84, target_pace: { min_per_km: 6, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [{ name: "Rozciąganie", sets: 1, duration: 15 }] } }
        ]
      }
    ]
  },
  
  'marathon_intermediate_5days': {
    id: 'marathon_intermediate_5days',
    metadata: {
      discipline: "running",
      target_group: "Średniozaawansowani biegacze",
      target_goal: "Maraton",
      level_hint: "intermediate",
      days_per_week: 5,
      duration_weeks: 18,
      base_distance_km: 60,
      description: "Plan treningowy dla średniozaawansowanych biegaczy przygotowujących się do maratonu z 5 treningami tygodniowo",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Kompleksowy rozwój wszystkich aspektów wytrzymałości przy 5 treningach tygodniowo.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'recovery', description: 'Bieg regeneracyjny w strefie 1', distance: 8, duration: 60, target_pace: { min_per_km: 6, sec_per_km: 45 }, target_heart_rate: { min: 125, max: 140 }, support_exercises: [] } },
          { day_name: "Wtorek", workout: { type: 'interval', description: 'Interwały 10x800m w strefie 4-5, przerwa 400m trucht', distance: 16, duration: 100, target_pace: { min_per_km: 4, sec_per_km: 30 }, target_heart_rate: { min: 160, max: 180 }, support_exercises: [{ name: "Ćwiczenia siłowe nóg", sets: 3, reps: 12 }] } },
          { day_name: "Czwartek", workout: { type: 'tempo', description: 'Bieg tempowy 12km w strefie 3', distance: 16, duration: 95, target_pace: { min_per_km: 5, sec_per_km: 15 }, target_heart_rate: { min: 150, max: 165 }, support_exercises: [{ name: "Wzmacnianie core", sets: 3, reps: 15 }] } },
          { day_name: "Piątek", workout: { type: 'easy', description: 'Lekki bieg w strefie 2', distance: 10, duration: 70, target_pace: { min_per_km: 6, sec_per_km: 30 }, target_heart_rate: { min: 135, max: 150 }, support_exercises: [] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Długi bieg w strefie 2 z ostatnimi 5km w strefie 3', distance: 26, duration: 160, target_pace: { min_per_km: 5, sec_per_km: 50 }, target_heart_rate: { min: 140, max: 160 }, support_exercises: [{ name: "Rozciąganie dynamiczne i statyczne", sets: 1, duration: 20 }] } }
        ]
      }
    ]
  },
  
  'marathon_advanced_4days': {
    id: 'marathon_advanced_4days',
    metadata: {
      discipline: "running",
      target_group: "Zaawansowani biegacze",
      target_goal: "Maraton",
      level_hint: "advanced",
      days_per_week: 4,
      duration_weeks: 16,
      base_distance_km: 70,
      description: "Plan treningowy dla zaawansowanych biegaczy przygotowujących się do maratonu z 4 treningami tygodniowo",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Intensyfikacja treningów pod kątem tempa docelowego maratonu przy 4 treningach tygodniowo.",
        days: [
          { day_name: "Wtorek", workout: { type: 'interval', description: 'Interwały 5x1600m w strefie 4, przerwa 800m trucht', distance: 18, duration: 100, target_pace: { min_per_km: 4, sec_per_km: 20 }, target_heart_rate: { min: 160, max: 175 }, support_exercises: [{ name: "Ćwiczenia stabilizacyjne", sets: 3, reps: 20 }] } },
          { day_name: "Czwartek", workout: { type: 'tempo', description: 'Bieg tempowy 15km w tempie półmaratonu', distance: 18, duration: 100, target_pace: { min_per_km: 4, sec_per_km: 40 }, target_heart_rate: { min: 155, max: 170 }, support_exercises: [{ name: "Wzmacnianie mięśni ud", sets: 3, reps: 15 }] } },
          { day_name: "Sobota", workout: { type: 'easy', description: 'Lekki bieg w strefie 2', distance: 12, duration: 75, target_pace: { min_per_km: 6, sec_per_km: 0 }, target_heart_rate: { min: 140, max: 155 }, support_exercises: [] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Długi bieg z elementami tempa maratońskiego (10km w środku biegu)', distance: 32, duration: 180, target_pace: { min_per_km: 5, sec_per_km: 0 }, target_heart_rate: { min: 145, max: 165 }, support_exercises: [{ name: "Rozciąganie kompleksowe", sets: 1, duration: 20 }] } }
        ]
      }
    ]
  },
  
  'marathon_advanced_5days': {
    id: 'marathon_advanced_5days',
    metadata: {
      discipline: "running",
      target_group: "Zaawansowani biegacze",
      target_goal: "Maraton",
      level_hint: "advanced",
      days_per_week: 5,
      duration_weeks: 16,
      base_distance_km: 80,
      description: "Plan treningowy dla zaawansowanych biegaczy przygotowujących się do maratonu z 5 treningami tygodniowo",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Kompleksowy rozwój wszystkich aspektów wytrzymałości i tempa maratońskiego przy 5 treningach tygodniowo.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'recovery', description: 'Bieg regeneracyjny w strefie 1', distance: 8, duration: 60, target_pace: { min_per_km: 6, sec_per_km: 45 }, target_heart_rate: { min: 125, max: 140 }, support_exercises: [] } },
          { day_name: "Wtorek", workout: { type: 'interval', description: 'Interwały 6x1600m w strefie 4, przerwa 800m trucht', distance: 20, duration: 110, target_pace: { min_per_km: 4, sec_per_km: 15 }, target_heart_rate: { min: 160, max: 175 }, support_exercises: [{ name: "Ćwiczenia siłowe nóg", sets: 3, reps: 12 }] } },
          { day_name: "Czwartek", workout: { type: 'tempo', description: 'Bieg tempowy 18km w tempie półmaratonu do maratonu', distance: 22, duration: 115, target_pace: { min_per_km: 4, sec_per_km: 30 }, target_heart_rate: { min: 155, max: 170 }, support_exercises: [{ name: "Wzmacnianie mięśni ud i pośladków", sets: 3, reps: 15 }] } },
          { day_name: "Piątek", workout: { type: 'easy', description: 'Lekki bieg regeneracyjny w strefie 2', distance: 12, duration: 80, target_pace: { min_per_km: 6, sec_per_km: 0 }, target_heart_rate: { min: 140, max: 155 }, support_exercises: [] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Długi bieg z elementami tempa maratońskiego (15km w tempie docelowym)', distance: 35, duration: 195, target_pace: { min_per_km: 4, sec_per_km: 50 }, target_heart_rate: { min: 145, max: 165 }, support_exercises: [{ name: "Rozciąganie po treningu", sets: 1, duration: 20 }] } }
        ]
      }
    ]
  },
  
  'marathon_advanced_6days': {
    id: 'marathon_advanced_6days',
    metadata: {
      discipline: "running",
      target_group: "Zaawansowani biegacze",
      target_goal: "Maraton",
      level_hint: "advanced",
      days_per_week: 6,
      duration_weeks: 16,
      base_distance_km: 100,
      description: "Plan treningowy dla zaawansowanych biegaczy przygotowujących się do maratonu z 6 treningami tygodniowo",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Kompleksowy rozwój wysokiej wytrzymałości z dużym naciskiem na adaptację do objętości i intensywności treningowej przy 6 treningach tygodniowo.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'recovery', description: 'Bieg regeneracyjny w strefie 1', distance: 8, duration: 60, target_pace: { min_per_km: 6, sec_per_km: 45 }, target_heart_rate: { min: 125, max: 140 }, support_exercises: [] } },
          { day_name: "Wtorek", workout: { type: 'interval', description: 'Interwały 10x1000m w strefie 4, przerwa 400m trucht', distance: 20, duration: 110, target_pace: { min_per_km: 4, sec_per_km: 0 }, target_heart_rate: { min: 165, max: 180 }, support_exercises: [{ name: "Trening siłowy", sets: 3, reps: 12 }] } },
          { day_name: "Środa", workout: { type: 'easy', description: 'Lekki bieg regeneracyjny w strefie 2', distance: 14, duration: 90, target_pace: { min_per_km: 6, sec_per_km: 0 }, target_heart_rate: { min: 140, max: 155 }, support_exercises: [] } },
          { day_name: "Czwartek", workout: { type: 'tempo', description: 'Bieg tempowy 20km w tempie półmaratonu do maratonu', distance: 24, duration: 120, target_pace: { min_per_km: 4, sec_per_km: 25 }, target_heart_rate: { min: 155, max: 170 }, support_exercises: [{ name: "Wzmacnianie core i mięśni ud", sets: 3, reps: 15 }] } },
          { day_name: "Sobota", workout: { type: 'easy', description: 'Lekki bieg regeneracyjny w strefie 2', distance: 12, duration: 75, target_pace: { min_per_km: 6, sec_per_km: 0 }, target_heart_rate: { min: 140, max: 155 }, support_exercises: [] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Długi bieg z elementami tempa maratońskiego (20km w tempie docelowym)', distance: 36, duration: 200, target_pace: { min_per_km: 4, sec_per_km: 45 }, target_heart_rate: { min: 145, max: 165 }, support_exercises: [{ name: "Rozciąganie kompleksowe", sets: 1, duration: 25 }] } }
        ]
      }
    ]
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
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Maksymalne wykorzystanie potencjału biegowego poprzez różnorodne treningi o zróżnicowanej intensywności.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'easy', description: 'Bieg regeneracyjny w strefie 2', distance: 8, duration: 50, target_pace: { min_per_km: 5, sec_per_km: 30 }, target_heart_rate: { min: 140, max: 155 }, support_exercises: [{ name: "Dynamiczne rozciąganie", sets: 1, duration: 10 }] } },
          { day_name: "Wtorek", workout: { type: 'interval', description: 'Interwały 10x600m w strefie 5, przerwa 200m trucht', distance: 12, duration: 70, target_pace: { min_per_km: 3, sec_per_km: 40 }, target_heart_rate: { min: 170, max: 185 }, support_exercises: [{ name: "Wzmacnianie mięśni nóg", sets: 3, reps: 15 }] } },
          { day_name: "Środa", workout: { type: 'recovery', description: 'Lekki trucht regeneracyjny', distance: 6, duration: 40, target_pace: { min_per_km: 6, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 145 }, support_exercises: [] } },
          { day_name: "Czwartek", workout: { type: 'tempo', description: 'Bieg tempowy ze stopniowaniem intensywności', distance: 12, duration: 65, target_pace: { min_per_km: 4, sec_per_km: 10 }, target_heart_rate: { min: 160, max: 175 }, support_exercises: [] } },
          { day_name: "Piątek", workout: { type: 'fartlek', description: 'Fartlek z przyśpieszeniami', distance: 10, duration: 60, target_pace: { min_per_km: 5, sec_per_km: 0 }, target_heart_rate: { min: 150, max: 170 }, support_exercises: [{ name: "Stabilizacja core", sets: 3, reps: 15 }] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Długi bieg z przyspieszeniami w końcówce', distance: 18, duration: 100, target_pace: { min_per_km: 5, sec_per_km: 0 }, target_heart_rate: { min: 145, max: 165 }, support_exercises: [{ name: "Kompleksowe rozciąganie", sets: 1, duration: 15 }] } }
        ]
      }
    ]
  },
  
  '5km_advanced_3days': {
    id: '5km_advanced_3days',
    metadata: {
      discipline: "running",
      target_group: "Zaawansowani biegacze",
      target_goal: "5km",
      level_hint: "advanced",
      days_per_week: 3,
      duration_weeks: 8,
      base_distance_km: 20,
      description: "Plan treningowy dla zaawansowanych biegaczy dążących do uzyskania najlepszego wyniku na 5km",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Budowanie jakości treningu z naciskiem na intensywność.",
        days: [
          { day_name: "Wtorek", workout: { type: 'interval', description: 'Interwały 10x400m w strefie 5, przerwa 200m trucht', distance: 8, duration: 45, target_pace: { min_per_km: 4, sec_per_km: 0 }, target_heart_rate: { min: 170, max: 185 }, support_exercises: [{ name: "Wzmacnianie mięśni nóg", sets: 3, reps: 15 }] } },
          { day_name: "Czwartek", workout: { type: 'tempo', description: 'Bieg tempowy 4km w strefie 4', distance: 8, duration: 40, target_pace: { min_per_km: 4, sec_per_km: 30 }, target_heart_rate: { min: 165, max: 175 }, support_exercises: [{ name: "Ćwiczenia stabilizacyjne", sets: 2, duration: 10 }] } },
          { day_name: "Sobota", workout: { type: 'long', description: 'Długi bieg z wstawkami w strefie 3', distance: 12, duration: 65, target_pace: { min_per_km: 5, sec_per_km: 15 }, target_heart_rate: { min: 150, max: 165 }, support_exercises: [{ name: "Kompleksowe rozciąganie", sets: 1, duration: 15 }] } }
        ]
      }
    ]
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
      base_distance_km: 25,
      description: "4-dniowy plan treningowy dla zaawansowanych biegaczy skupiający się na osiągnięciu rekordowego czasu na 5km",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Wysoka jakość sesji treningowych z odpowiednią regeneracją.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'easy', description: 'Bieg w strefie 2 z przyspieszeniami 6x100m', distance: 7, duration: 45, target_pace: { min_per_km: 5, sec_per_km: 30 }, target_heart_rate: { min: 140, max: 155 }, support_exercises: [{ name: "Mobilność bioder", sets: 2, duration: 8 }] } },
          { day_name: "Środa", workout: { type: 'interval', description: 'Interwały 6x600m w strefie 5, przerwa 200m trucht', distance: 9, duration: 45, target_pace: { min_per_km: 3, sec_per_km: 50 }, target_heart_rate: { min: 170, max: 185 }, support_exercises: [] } },
          { day_name: "Piątek", workout: { type: 'tempo', description: 'Bieg tempowy 5km w strefie 4', distance: 8, duration: 40, target_pace: { min_per_km: 4, sec_per_km: 15 }, target_heart_rate: { min: 165, max: 175 }, support_exercises: [] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Długi bieg z ostatnimi 2km w tempie progowym', distance: 12, duration: 65, target_pace: { min_per_km: 5, sec_per_km: 10 }, target_heart_rate: { min: 150, max: 170 }, support_exercises: [{ name: "Kompleksowe rozciąganie", sets: 1, duration: 15 }] } }
        ]
      }
    ]
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
      base_distance_km: 30,
      description: "Intensywny 5-dniowy plan treningowy dla zaawansowanych biegaczy z naciskiem na maksymalną wydajność na dystansie 5km",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Maksymalna adaptacja do wysokiej intensywności z odpowiednią regeneracją.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'easy', description: 'Bieg regeneracyjny w strefie 2', distance: 6, duration: 40, target_pace: { min_per_km: 5, sec_per_km: 40 }, target_heart_rate: { min: 140, max: 155 }, support_exercises: [{ name: "Mobilność", sets: 1, duration: 10 }] } },
          { day_name: "Wtorek", workout: { type: 'interval', description: 'Interwały 12x400m w strefie 5, przerwa 200m trucht', distance: 10, duration: 50, target_pace: { min_per_km: 3, sec_per_km: 40 }, target_heart_rate: { min: 175, max: 185 }, support_exercises: [] } },
          { day_name: "Czwartek", workout: { type: 'tempo', description: 'Bieg tempowy progresywny 6km', distance: 10, duration: 50, target_pace: { min_per_km: 4, sec_per_km: 10 }, target_heart_rate: { min: 165, max: 180 }, support_exercises: [] } },
          { day_name: "Piątek", workout: { type: 'recovery', description: 'Bieg regeneracyjny w strefie 1-2', distance: 5, duration: 35, target_pace: { min_per_km: 6, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 145 }, support_exercises: [{ name: "Rozciąganie dynamiczne", sets: 1, duration: 10 }] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Długi bieg z przyspieszeniami na końcu', distance: 14, duration: 75, target_pace: { min_per_km: 5, sec_per_km: 0 }, target_heart_rate: { min: 150, max: 170 }, support_exercises: [{ name: "Rozciąganie kompleksowe", sets: 1, duration: 15 }] } }
        ]
      }
    ]
  },
  
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
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Zbalansowany rozwój wytrzymałości i tempa dla optymalnego wyniku w półmaratonie.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'recovery', description: 'Bieg regeneracyjny w strefie 2', distance: 8, duration: 50, target_pace: { min_per_km: 5, sec_per_km: 45 }, target_heart_rate: { min: 140, max: 155 }, support_exercises: [] } },
          { day_name: "Wtorek", workout: { type: 'interval', description: 'Interwały 6x1200m w strefie 4, przerwa 400m trucht', distance: 14, duration: 80, target_pace: { min_per_km: 4, sec_per_km: 15 }, target_heart_rate: { min: 165, max: 180 }, support_exercises: [{ name: "Trening siłowy dla biegaczy", sets: 3, reps: 12 }] } },
          { day_name: "Czwartek", workout: { type: 'tempo', description: 'Bieg tempowy 10km w strefie 3', distance: 15, duration: 85, target_pace: { min_per_km: 4, sec_per_km: 30 }, target_heart_rate: { min: 155, max: 170 }, support_exercises: [] } },
          { day_name: "Piątek", workout: { type: 'easy', description: 'Lekki bieg regeneracyjny', distance: 6, duration: 40, target_pace: { min_per_km: 6, sec_per_km: 15 }, target_heart_rate: { min: 130, max: 145 }, support_exercises: [{ name: "Mobilność stawów", sets: 1, duration: 10 }] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Długi bieg ze zmiennym tempem', distance: 20, duration: 115, target_pace: { min_per_km: 5, sec_per_km: 0 }, target_heart_rate: { min: 145, max: 165 }, support_exercises: [{ name: "Rozciąganie po treningu", sets: 1, duration: 15 }] } }
        ]
      }
    ]
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
      base_distance_km: 70,
      description: "Intensywny 6-dniowy plan treningowy dla zaawansowanych biegaczy przygotowujących się do półmaratonu",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Budowanie wytrzymałości i siły biegowej poprzez zróżnicowane treningi o wysokiej intensywności.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'easy', description: 'Bieg regeneracyjny w strefie 2', distance: 10, duration: 60, target_pace: { min_per_km: 5, sec_per_km: 0 }, target_heart_rate: { min: 140, max: 155 }, support_exercises: [{ name: "Dynamiczne rozciąganie", sets: 1, duration: 10 }] } },
          { day_name: "Wtorek", workout: { type: 'interval', description: 'Interwały 6x1000m w strefie 5, przerwa 400m trucht', distance: 14, duration: 75, target_pace: { min_per_km: 3, sec_per_km: 50 }, target_heart_rate: { min: 170, max: 185 }, support_exercises: [{ name: "Wzmacnianie mięśni nóg", sets: 3, reps: 15 }] } },
          { day_name: "Środa", workout: { type: 'recovery', description: 'Lekki trucht regeneracyjny', distance: 8, duration: 50, target_pace: { min_per_km: 6, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 145 }, support_exercises: [] } },
          { day_name: "Czwartek", workout: { type: 'tempo', description: 'Bieg tempowy ze stopniowaniem intensywności', distance: 14, duration: 75, target_pace: { min_per_km: 4, sec_per_km: 15 }, target_heart_rate: { min: 160, max: 175 }, support_exercises: [] } },
          { day_name: "Piątek", workout: { type: 'fartlek', description: 'Fartlek z przyśpieszeniami', distance: 12, duration: 70, target_pace: { min_per_km: 5, sec_per_km: 0 }, target_heart_rate: { min: 150, max: 170 }, support_exercises: [{ name: "Stabilizacja core", sets: 3, reps: 15 }] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Długi bieg z przyspieszeniami w końcówce', distance: 22, duration: 120, target_pace: { min_per_km: 5, sec_per_km: 0 }, target_heart_rate: { min: 145, max: 165 }, support_exercises: [{ name: "Kompleksowe rozciąganie", sets: 1, duration: 15 }] } }
        ]
      }
    ]
  },
  
  'running_return_plantar_fasciitis_3days_6weeks': {
    id: 'running_return_plantar_fasciitis_3days_6weeks',
    metadata: {
      discipline: "running",
      target_group: "Biegacze z zapaleniem powięzi podeszwy",
      target_goal: "Rehabilitacja",
      level_hint: "rehabilitation",
      days_per_week: 3,
      duration_weeks: 6,
      base_distance_km: 10,
      description: "Plan powrotu do biegania dla osób z zapaleniem powięzi podeszwowej, skupiający się na regeneracji i stopniowym zwiększaniu obciążeń",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Minimalizacja bólu i kontrolowane wprowadzanie obciążeń.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'recovery', description: 'Marsz 15 minut + ćwiczenia stóp', distance: 1.5, duration: 25, target_pace: { min_per_km: 10, sec_per_km: 0 }, target_heart_rate: { min: 90, max: 120 }, support_exercises: [{ name: "Rozciąganie łydek i powięzi podeszwowej", sets: 3, duration: 5 }, { name: "Rolowanie stopy na piłeczce", sets: 2, duration: 5 }] } },
          { day_name: "Środa", workout: { type: 'cross', description: 'Trening alternatywny: rower lub pływanie', distance: 0, duration: 30, target_pace: { min_per_km: 0, sec_per_km: 0 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [{ name: "Ćwiczenia stóp z gumą oporową", sets: 2, reps: 15 }] } },
          { day_name: "Piątek", workout: { type: 'recovery', description: 'Marsz z krótkimi odcinkami truchtu (20 sek trucht + 4 min marsz)', distance: 2, duration: 30, target_pace: { min_per_km: 9, sec_per_km: 30 }, target_heart_rate: { min: 100, max: 130 }, support_exercises: [{ name: "Rozciąganie łydek", sets: 2, duration: 5 }, { name: "Ćwiczenia wzmacniające stopy", sets: 3, reps: 12 }] } }
        ]
      }
    ]
  },
  
  'running_return_plantar_fasciitis_4days_6weeks': {
    id: 'running_return_plantar_fasciitis_4days_6weeks',
    metadata: {
      discipline: "running",
      target_group: "Biegacze z zapaleniem powięzi podeszwowej",
      target_goal: "Rehabilitacja",
      level_hint: "rehabilitation",
      days_per_week: 4,
      duration_weeks: 6,
      base_distance_km: 12,
      description: "Plan powrotu do biegania dla osób po przebytym zapaleniu powięzi podeszwy stopy, z 4 treningami tygodniowo",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Minimalne obciążenie stopy i stopniowe wprowadzanie krótkich odcinków biegowych.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'rehab', description: 'Marsz z krótkimi odcinkami truchtu (30s/3min)', distance: 3, duration: 30, target_pace: { min_per_km: 9, sec_per_km: 0 }, target_heart_rate: { min: 100, max: 120 }, support_exercises: [{ name: "Rolowanie stopy na piłeczce", sets: 2, duration: 5 }, { name: "Rozciąganie powięzi podeszwowej", sets: 3, duration: 30 }] } },
          { day_name: "Środa", workout: { type: 'cross', description: 'Trening alternatywny: rower lub pływanie', distance: 0, duration: 40, target_pace: { min_per_km: 0, sec_per_km: 0 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [{ name: "Ćwiczenia wzmacniające stopę", sets: 3, reps: 15 }, { name: "Zginanie palców stóp", sets: 3, reps: 20 }] } },
          { day_name: "Piątek", workout: { type: 'rehab', description: 'Interwały marsz/trucht (45s/2min)', distance: 3.5, duration: 35, target_pace: { min_per_km: 8, sec_per_km: 30 }, target_heart_rate: { min: 110, max: 130 }, support_exercises: [{ name: "Ćwiczenia mobilności stopy", sets: 2, reps: 10 }, { name: "Napinanie mięśni stopy", sets: 3, reps: 15 }] } },
          { day_name: "Niedziela", workout: { type: 'mobility', description: 'Sesja mobilności i wzmacniania stopy', distance: 0, duration: 30, target_pace: { min_per_km: 0, sec_per_km: 0 }, target_heart_rate: { min: 80, max: 100 }, support_exercises: [{ name: "Ćwiczenia propriocepcji stopy", sets: 3, duration: 3 }, { name: "Rozciąganie łydek", sets: 3, duration: 30 }, { name: "Rolowanie powięzi podeszwowej", sets: 2, duration: 5 }] } }
        ]
      },
      {
        week_num: 2,
        focus: "Wydłużanie interwałów biegowych przy stałej kontroli dolegliwości.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'run_walk', description: 'Interwały biegu 1min/2min marszu', distance: 4, duration: 40, target_pace: { min_per_km: 8, sec_per_km: 0 }, target_heart_rate: { min: 110, max: 130 }, support_exercises: [{ name: "Ćwiczenia na równowagę", sets: 2, duration: 5 }, { name: "Rozciąganie powięzi podeszwowej", sets: 3, duration: 30 }] } },
          { day_name: "Środa", workout: { type: 'cross', description: 'Trening alternatywny + wzmacnianie', distance: 0, duration: 45, target_pace: { min_per_km: 0, sec_per_km: 0 }, target_heart_rate: { min: 125, max: 145 }, support_exercises: [{ name: "Wzmacnianie łydek i stóp", sets: 3, reps: 15 }, { name: "Rozciąganie łydek", sets: 3, duration: 30 }] } },
          { day_name: "Piątek", workout: { type: 'run_walk', description: 'Interwały biegu 2min/1min marszu', distance: 4.5, duration: 45, target_pace: { min_per_km: 7, sec_per_km: 30 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [{ name: "Ćwiczenia stabilizujące stopę", sets: 2, reps: 12 }, { name: "Automasaż łydek", sets: 1, duration: 10 }] } },
          { day_name: "Niedziela", workout: { type: 'easy', description: 'Marsz z elementami biegu', distance: 5, duration: 50, target_pace: { min_per_km: 7, sec_per_km: 45 }, target_heart_rate: { min: 110, max: 130 }, support_exercises: [{ name: "Rozciąganie kompleksowe nóg", sets: 1, duration: 15 }, { name: "Rolowanie powięzi", sets: 2, duration: 5 }] } }
        ]
      },
      {
        week_num: 3,
        focus: "Zwiększanie obciążenia biegowego przy zachowaniu środków ostrożności.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'run_walk', description: 'Interwały biegu 3min/1min marszu', distance: 5, duration: 45, target_pace: { min_per_km: 7, sec_per_km: 15 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [{ name: "Ćwiczenia wzmacniające stopę", sets: 3, reps: 15 }, { name: "Rozciąganie powięzi podeszwowej", sets: 3, duration: 30 }] } },
          { day_name: "Środa", workout: { type: 'cross', description: 'Trening alternatywny z elementami wzmacniającymi', distance: 0, duration: 45, target_pace: { min_per_km: 0, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [{ name: "Kompleksowe wzmacnianie nóg", sets: 3, reps: 12 }, { name: "Stretching dynamiczny", sets: 1, duration: 10 }] } },
          { day_name: "Piątek", workout: { type: 'run_walk', description: 'Interwały biegu 5min/1min marszu', distance: 5.5, duration: 50, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 125, max: 145 }, support_exercises: [{ name: "Ekscentryczne ćwiczenia łydek", sets: 3, reps: 15 }, { name: "Mobilizacja stawu skokowego", sets: 2, reps: 10 }] } },
          { day_name: "Niedziela", workout: { type: 'easy', description: 'Bieg ciągły z krótkimi przerwami', distance: 6, duration: 55, target_pace: { min_per_km: 6, sec_per_km: 45 }, target_heart_rate: { min: 125, max: 145 }, support_exercises: [{ name: "Kompleksowe rozciąganie", sets: 1, duration: 15 }, { name: "Automasaż stóp", sets: 1, duration: 10 }] } }
        ]
      },
      {
        week_num: 4,
        focus: "Przejście do dłuższych odcinków biegowych z minimalnym udziałem marszu.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'run_walk', description: 'Interwały biegu 8min/1min marszu', distance: 6, duration: 55, target_pace: { min_per_km: 6, sec_per_km: 30 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [{ name: "Ćwiczenia stabilizacyjne stopy", sets: 3, reps: 12 }, { name: "Rozciąganie powięzi podeszwowej", sets: 3, duration: 30 }] } },
          { day_name: "Środa", workout: { type: 'cross', description: 'Trening alternatywny o wyższej intensywności', distance: 0, duration: 50, target_pace: { min_per_km: 0, sec_per_km: 0 }, target_heart_rate: { min: 135, max: 155 }, support_exercises: [{ name: "Wzmacnianie mięśni stóp i łydek", sets: 3, reps: 15 }, { name: "Mobilność stawu skokowego", sets: 2, duration: 5 }] } },
          { day_name: "Piątek", workout: { type: 'easy', description: 'Bieg ciągły w kontrolowanym tempie', distance: 6.5, duration: 60, target_pace: { min_per_km: 6, sec_per_km: 15 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [{ name: "Ćwiczenia wzmacniające mięśnie stopy", sets: 3, reps: 15 }, { name: "Rolowanie powięzi", sets: 2, duration: 5 }] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Dłuższy bieg ciągły z monitorowaniem odczuć', distance: 8, duration: 75, target_pace: { min_per_km: 6, sec_per_km: 30 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [{ name: "Kompleksowe rozciąganie nóg", sets: 1, duration: 15 }, { name: "Automasaż stóp i łydek", sets: 1, duration: 15 }] } }
        ]
      },
      {
        week_num: 5,
        focus: "Stopniowy powrót do normalnych treningów z zachowaniem ćwiczeń profilaktycznych.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'easy', description: 'Bieg ciągły w umiarkowanym tempie', distance: 7, duration: 65, target_pace: { min_per_km: 6, sec_per_km: 15 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [{ name: "Rozciąganie powięzi podeszwowej", sets: 2, duration: 5 }, { name: "Wzmacnianie mięśni stopy", sets: 3, reps: 15 }] } },
          { day_name: "Środa", workout: { type: 'fartlek', description: 'Lekki fartlek z kontrolowanymi przyspieszeniami', distance: 6, duration: 55, target_pace: { min_per_km: 6, sec_per_km: 0 }, target_heart_rate: { min: 135, max: 155 }, support_exercises: [{ name: "Ćwiczenia stabilizacyjne", sets: 2, reps: 15 }, { name: "Mobilizacja stopy", sets: 1, duration: 10 }] } },
          { day_name: "Piątek", workout: { type: 'easy', description: 'Bieg ciągły ze stopniowaniem tempa', distance: 7, duration: 65, target_pace: { min_per_km: 6, sec_per_km: 0 }, target_heart_rate: { min: 135, max: 155 }, support_exercises: [{ name: "Rozciąganie kompleksowe nóg", sets: 1, duration: 15 }, { name: "Rolowanie powięzi podeszwowej", sets: 2, duration: 5 }] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Dłuższy bieg ciągły z elementami tempa', distance: 10, duration: 90, target_pace: { min_per_km: 6, sec_per_km: 15 }, target_heart_rate: { min: 130, max: 155 }, support_exercises: [{ name: "Kompleksowy stretching", sets: 1, duration: 15 }, { name: "Automasaż", sets: 1, duration: 10 }] } }
        ]
      },
      {
        week_num: 6,
        focus: "Pełny powrót do treningu biegowego z zachowaniem elementów profilaktyki.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'easy', description: 'Bieg ciągły w strefie 2', distance: 8, duration: 70, target_pace: { min_per_km: 6, sec_per_km: 0 }, target_heart_rate: { min: 135, max: 155 }, support_exercises: [{ name: "Ćwiczenia mobilizacyjne stopy", sets: 2, duration: 5 }, { name: "Rozciąganie łydek", sets: 2, duration: 5 }] } },
          { day_name: "Środa", workout: { type: 'interval', description: 'Łagodne interwały 5x3min w szybszym tempie', distance: 8, duration: 70, target_pace: { min_per_km: 5, sec_per_km: 45 }, target_heart_rate: { min: 140, max: 160 }, support_exercises: [{ name: "Wzmacnianie mięśni stopy", sets: 3, reps: 15 }, { name: "Rozciąganie powięzi podeszwowej", sets: 2, duration: 5 }] } },
          { day_name: "Piątek", workout: { type: 'easy', description: 'Bieg regeneracyjny', distance: 6, duration: 55, target_pace: { min_per_km: 6, sec_per_km: 30 }, target_heart_rate: { min: 125, max: 145 }, support_exercises: [{ name: "Ćwiczenia balansowe", sets: 2, duration: 5 }, { name: "Rolowanie stóp", sets: 1, duration: 10 }] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Długi bieg - test pełnego powrotu do formy', distance: 12, duration: 105, target_pace: { min_per_km: 6, sec_per_km: 0 }, target_heart_rate: { min: 135, max: 155 }, support_exercises: [{ name: "Kompleksowe rozciąganie", sets: 1, duration: 15 }, { name: "Automasaż stóp i łydek", sets: 1, duration: 15 }] } }
        ]
      }
    ]
  },
  
  'achilles_pain_management_3days_4weeks': {
    id: 'achilles_pain_management_3days_4weeks',
    metadata: {
      discipline: "running",
      target_group: "Biegacze z bólem ścięgna Achillesa",
      target_goal: "Rehabilitacja",
      level_hint: "rehabilitation",
      days_per_week: 3,
      duration_weeks: 4,
      base_distance_km: 5,
      description: "Plan treningowy dla biegaczy zmagających się z bólem ścięgna Achillesa, z 3 treningami tygodniowo przez 4 tygodnie",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Redukcja bólu i rozpoczęcie podstawowych ćwiczeń rehabilitacyjnych.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'rehab', description: 'Ćwiczenia rehabilitacyjne + marsz', distance: 1.5, duration: 25, target_pace: { min_per_km: 10, sec_per_km: 0 }, target_heart_rate: { min: 90, max: 110 }, support_exercises: [{ name: "Ekscentryczne opuszczanie pięty (bez obciążenia)", sets: 3, reps: 10 }, { name: "Mobilizacja stawu skokowego", sets: 2, reps: 15 }, { name: "Okłady z lodu", sets: 1, duration: 15 }] } },
          { day_name: "Środa", workout: { type: 'cross', description: 'Trening alternatywny: pływanie lub rower stacjonarny', distance: 0, duration: 30, target_pace: { min_per_km: 0, sec_per_km: 0 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [{ name: "Ekscentryczne opuszczanie pięty (bez obciążenia)", sets: 3, reps: 12 }, { name: "Rozciąganie mięśni łydki", sets: 3, duration: 30 }, { name: "Rolowanie mięśni łydki", sets: 2, duration: 5 }] } },
          { day_name: "Piątek", workout: { type: 'rehab', description: 'Marsz z krótkimi odcinkami biegu', distance: 2, duration: 30, target_pace: { min_per_km: 9, sec_per_km: 30 }, target_heart_rate: { min: 100, max: 120 }, support_exercises: [{ name: "Ekscentryczne opuszczanie pięty (lekkie obciążenie)", sets: 3, reps: 10 }, { name: "Ćwiczenia stabilizacyjne stopy", sets: 2, reps: 12 }, { name: "Okłady z lodu", sets: 1, duration: 15 }] } }
        ]
      },
      {
        week_num: 2,
        focus: "Zwiększenie intensywności ćwiczeń wzmacniających i wprowadzenie krótkich sesji biegowych.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'run_walk', description: 'Interwały bieg/marsz (1min/3min) x 6', distance: 2.5, duration: 35, target_pace: { min_per_km: 8, sec_per_km: 30 }, target_heart_rate: { min: 110, max: 130 }, support_exercises: [{ name: "Ekscentryczne opuszczanie pięty (z obciążeniem)", sets: 3, reps: 12 }, { name: "Rozciąganie mięśni łydki", sets: 3, duration: 30 }, { name: "Rolowanie stopy na piłeczce", sets: 2, duration: 5 }] } },
          { day_name: "Środa", workout: { type: 'cross', description: 'Trening alternatywny: elipsa lub rower + ćwiczenia wzmacniające', distance: 0, duration: 35, target_pace: { min_per_km: 0, sec_per_km: 0 }, target_heart_rate: { min: 125, max: 145 }, support_exercises: [{ name: "Ekscentryczne opuszczanie pięty (z obciążeniem)", sets: 3, reps: 15 }, { name: "Ćwiczenia mięśni stopy", sets: 3, reps: 12 }, { name: "Rozciąganie dynamiczne nóg", sets: 1, duration: 10 }] } },
          { day_name: "Piątek", workout: { type: 'run_walk', description: 'Interwały bieg/marsz (2min/2min) x 7', distance: 3, duration: 40, target_pace: { min_per_km: 8, sec_per_km: 0 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [{ name: "Ekscentryczne opuszczanie pięty (jednostronne)", sets: 3, reps: 10 }, { name: "Wzmacnianie mięśni stopy", sets: 2, reps: 15 }, { name: "Automasaż łydek", sets: 1, duration: 10 }] } }
        ]
      },
      {
        week_num: 3,
        focus: "Stopniowe zwiększanie obciążenia biegowego z monitorowaniem bólu.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'run_walk', description: 'Interwały bieg/marsz (3min/1min) x 6', distance: 4, duration: 45, target_pace: { min_per_km: 7, sec_per_km: 30 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [{ name: "Ekscentryczne ćwiczenia łydek na schodku", sets: 3, reps: 12 }, { name: "Wzmacnianie mięśni piszczelowych", sets: 3, reps: 15 }, { name: "Rozciąganie ścięgna Achillesa", sets: 3, duration: 30 }] } },
          { day_name: "Środa", workout: { type: 'cross', description: 'Trening alternatywny o umiarkowanej intensywności', distance: 0, duration: 40, target_pace: { min_per_km: 0, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [{ name: "Ekscentryczne ćwiczenia łydek na jednej nodze", sets: 3, reps: 10 }, { name: "Ćwiczenia propriocepcji", sets: 2, duration: 5 }, { name: "Rozciąganie mięśni łydki", sets: 3, duration: 30 }] } },
          { day_name: "Piątek", workout: { type: 'easy', description: 'Lekki bieg ciągły z krótkimi przerwami marszowymi', distance: 4.5, duration: 45, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 125, max: 145 }, support_exercises: [{ name: "Ekscentryczne ćwiczenia łydek z obciążeniem", sets: 3, reps: 12 }, { name: "Stretching dynamiczny nóg", sets: 1, duration: 10 }, { name: "Rolowanie mięśni łydki", sets: 2, duration: 5 }] } }
        ]
      },
      {
        week_num: 4,
        focus: "Powrót do regularnych treningów biegowych z zachowaniem ćwiczeń profilaktycznych.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'easy', description: 'Bieg ciągły o niskiej intensywności', distance: 5, duration: 50, target_pace: { min_per_km: 6, sec_per_km: 45 }, target_heart_rate: { min: 125, max: 145 }, support_exercises: [{ name: "Ekscentryczne ćwiczenia łydek na jednej nodze", sets: 3, reps: 12 }, { name: "Wzmacnianie mięśni stopy", sets: 3, reps: 15 }, { name: "Rozciąganie ścięgna Achillesa", sets: 3, duration: 30 }] } },
          { day_name: "Środa", workout: { type: 'fartlek', description: 'Lekki fartlek z kontrolowanymi przyspieszeniami', distance: 5, duration: 50, target_pace: { min_per_km: 6, sec_per_km: 30 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [{ name: "Ekscentryczne ćwiczenia łydek z obciążeniem", sets: 3, reps: 15 }, { name: "Ćwiczenia stabilizacyjne", sets: 2, reps: 12 }, { name: "Rozciąganie dynamiczne", sets: 1, duration: 10 }] } },
          { day_name: "Piątek", workout: { type: 'easy', description: 'Dłuższy bieg ciągły ze stabilnym tempem', distance: 6, duration: 60, target_pace: { min_per_km: 6, sec_per_km: 30 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [{ name: "Kompleksowe rozciąganie nóg", sets: 1, duration: 15 }, { name: "Ekscentryczne ćwiczenia łydek", sets: 3, reps: 15 }, { name: "Automasaż", sets: 1, duration: 10 }] } }
        ]
      }
    ]
  },
  
  'achilles_pain_management_4days_4weeks': {
    id: 'achilles_pain_management_4days_4weeks',
    metadata: {
      discipline: "running",
      target_group: "Biegacze z bólem ścięgna Achillesa",
      target_goal: "Rehabilitacja",
      level_hint: "rehabilitation",
      days_per_week: 4,
      duration_weeks: 4,
      base_distance_km: 6,
      description: "Intensywniejszy plan treningowy dla biegaczy z bólem ścięgna Achillesa, z 4 sesjami tygodniowo przez 4 tygodnie",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Redukcja bólu i rozpoczęcie podstawowych ćwiczeń rehabilitacyjnych.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'rehab', description: 'Ćwiczenia rehabilitacyjne + marsz', distance: 1.5, duration: 25, target_pace: { min_per_km: 10, sec_per_km: 0 }, target_heart_rate: { min: 90, max: 110 }, support_exercises: [{ name: "Ekscentryczne opuszczanie pięty (bez obciążenia)", sets: 3, reps: 10 }, { name: "Mobilizacja stawu skokowego", sets: 2, reps: 15 }, { name: "Okłady z lodu", sets: 1, duration: 15 }] } },
          { day_name: "Wtorek", workout: { type: 'cross', description: 'Trening alternatywny: pływanie lub aqua jogging', distance: 0, duration: 30, target_pace: { min_per_km: 0, sec_per_km: 0 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [{ name: "Stretching mięśni łydki", sets: 3, duration: 30 }, { name: "Rozciąganie ścięgna Achillesa", sets: 3, duration: 30 }] } },
          { day_name: "Czwartek", workout: { type: 'rehab', description: 'Marsz z krótkimi odcinkami biegu', distance: 2, duration: 30, target_pace: { min_per_km: 9, sec_per_km: 30 }, target_heart_rate: { min: 100, max: 120 }, support_exercises: [{ name: "Ekscentryczne opuszczanie pięty (lekkie obciążenie)", sets: 3, reps: 10 }, { name: "Ćwiczenia stabilizacyjne stopy", sets: 2, reps: 12 }, { name: "Okłady z lodu", sets: 1, duration: 15 }] } },
          { day_name: "Sobota", workout: { type: 'cross', description: 'Rower stacjonarny + ćwiczenia wzmacniające core', distance: 0, duration: 35, target_pace: { min_per_km: 0, sec_per_km: 0 }, target_heart_rate: { min: 125, max: 145 }, support_exercises: [{ name: "Ekscentryczne opuszczanie pięty (bez obciążenia)", sets: 3, reps: 12 }, { name: "Rolowanie mięśni łydki", sets: 2, duration: 5 }, { name: "Wzmacnianie mięśni stopy", sets: 2, reps: 15 }] } }
        ]
      },
      {
        week_num: 2,
        focus: "Zwiększenie intensywności ćwiczeń wzmacniających i wprowadzenie krótkich sesji biegowych.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'run_walk', description: 'Interwały bieg/marsz (1min/3min) x 6', distance: 2.5, duration: 35, target_pace: { min_per_km: 8, sec_per_km: 30 }, target_heart_rate: { min: 110, max: 130 }, support_exercises: [{ name: "Ekscentryczne opuszczanie pięty (z obciążeniem)", sets: 3, reps: 12 }, { name: "Rozciąganie mięśni łydki", sets: 3, duration: 30 }, { name: "Rolowanie stopy na piłeczce", sets: 2, duration: 5 }] } },
          { day_name: "Wtorek", workout: { type: 'cross', description: 'Trening alternatywny: elipsa lub rower + ćwiczenia wzmacniające', distance: 0, duration: 35, target_pace: { min_per_km: 0, sec_per_km: 0 }, target_heart_rate: { min: 125, max: 145 }, support_exercises: [{ name: "Ekscentryczne opuszczanie pięty (z obciążeniem)", sets: 3, reps: 15 }, { name: "Ćwiczenia mięśni stopy", sets: 3, reps: 12 }, { name: "Rozciąganie dynamiczne nóg", sets: 1, duration: 10 }] } },
          { day_name: "Czwartek", workout: { type: 'run_walk', description: 'Interwały bieg/marsz (2min/2min) x 7', distance: 3, duration: 40, target_pace: { min_per_km: 8, sec_per_km: 0 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [{ name: "Ekscentryczne opuszczanie pięty (jednostronne)", sets: 3, reps: 10 }, { name: "Wzmacnianie mięśni stopy", sets: 2, reps: 15 }, { name: "Automasaż łydek", sets: 1, duration: 10 }] } },
          { day_name: "Sobota", workout: { type: 'rehab', description: 'Trening mobilności i stabilizacji z elementami marszu', distance: 2.5, duration: 40, target_pace: { min_per_km: 8, sec_per_km: 30 }, target_heart_rate: { min: 110, max: 130 }, support_exercises: [{ name: "Kompleksowe rozciąganie nóg", sets: 1, duration: 15 }, { name: "Ekscentryczne ćwiczenia łydek na podwyższeniu", sets: 3, reps: 15 }, { name: "Ćwiczenia równoważne", sets: 2, duration: 5 }] } }
        ]
      },
      {
        week_num: 3,
        focus: "Stopniowe zwiększanie obciążenia biegowego z monitorowaniem bólu.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'run_walk', description: 'Interwały bieg/marsz (3min/1min) x 6', distance: 4, duration: 45, target_pace: { min_per_km: 7, sec_per_km: 30 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [{ name: "Ekscentryczne ćwiczenia łydek na schodku", sets: 3, reps: 12 }, { name: "Wzmacnianie mięśni piszczelowych", sets: 3, reps: 15 }, { name: "Rozciąganie ścięgna Achillesa", sets: 3, duration: 30 }] } },
          { day_name: "Środa", workout: { type: 'cross', description: 'Trening alternatywny o umiarkowanej intensywności', distance: 0, duration: 40, target_pace: { min_per_km: 0, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [{ name: "Ekscentryczne ćwiczenia łydek na jednej nodze", sets: 3, reps: 10 }, { name: "Ćwiczenia propriocepcji", sets: 2, duration: 5 }, { name: "Rozciąganie mięśni łydki", sets: 3, duration: 30 }] } },
          { day_name: "Piątek", workout: { type: 'easy', description: 'Lekki bieg ciągły z krótkimi przerwami marszowymi', distance: 4.5, duration: 45, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 125, max: 145 }, support_exercises: [{ name: "Ekscentryczne ćwiczenia łydek z obciążeniem", sets: 3, reps: 12 }, { name: "Stretching dynamiczny nóg", sets: 1, duration: 10 }, { name: "Rolowanie mięśni łydki", sets: 2, duration: 5 }] } },
          { day_name: "Niedziela", workout: { type: 'recovery', description: 'Marsz/trucht regeneracyjny + mobilność', distance: 3, duration: 35, target_pace: { min_per_km: 8, sec_per_km: 0 }, target_heart_rate: { min: 110, max: 130 }, support_exercises: [{ name: "Mobilność stawu skokowego", sets: 2, reps: 15 }, { name: "Rozciąganie statyczne", sets: 1, duration: 15 }, { name: "Automasaż z użyciem piłki", sets: 2, duration: 5 }] } }
        ]
      },
      {
        week_num: 4,
        focus: "Powrót do regularnych treningów biegowych z zachowaniem ćwiczeń profilaktycznych.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'easy', description: 'Bieg ciągły o niskiej intensywności', distance: 5, duration: 50, target_pace: { min_per_km: 6, sec_per_km: 45 }, target_heart_rate: { min: 125, max: 145 }, support_exercises: [{ name: "Ekscentryczne ćwiczenia łydek na jednej nodze", sets: 3, reps: 12 }, { name: "Wzmacnianie mięśni stopy", sets: 3, reps: 15 }, { name: "Rozciąganie ścięgna Achillesa", sets: 3, duration: 30 }] } },
          { day_name: "Środa", workout: { type: 'fartlek', description: 'Lekki fartlek z kontrolowanymi przyspieszeniami', distance: 5, duration: 50, target_pace: { min_per_km: 6, sec_per_km: 30 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [{ name: "Ekscentryczne ćwiczenia łydek z obciążeniem", sets: 3, reps: 15 }, { name: "Ćwiczenia stabilizacyjne", sets: 2, reps: 12 }, { name: "Rozciąganie dynamiczne", sets: 1, duration: 10 }] } },
          { day_name: "Piątek", workout: { type: 'cross', description: 'Alternatywny trening wzmacniający + lekka aktywność cardio', distance: 0, duration: 45, target_pace: { min_per_km: 0, sec_per_km: 0 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [{ name: "Trening siłowy górnej części ciała", sets: 3, reps: 12 }, { name: "Ekscentryczne ćwiczenia łydek", sets: 3, reps: 15 }, { name: "Stretching kompleksowy", sets: 1, duration: 15 }] } },
          { day_name: "Niedziela", workout: { type: 'easy', description: 'Dłuższy bieg ciągły ze stabilnym tempem', distance: 6, duration: 60, target_pace: { min_per_km: 6, sec_per_km: 30 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [{ name: "Kompleksowe rozciąganie nóg", sets: 1, duration: 15 }, { name: "Ekscentryczne ćwiczenia łydek", sets: 3, reps: 15 }, { name: "Automasaż", sets: 1, duration: 10 }] } }
        ]
      }
    ]
  },
  
  'shin_splints_recovery_3days_4weeks': {
    id: 'shin_splints_recovery_3days_4weeks',
    metadata: {
      discipline: "running",
      target_group: "Biegacze z zapaleniem okostnej",
      target_goal: "Rehabilitacja",
      level_hint: "rehabilitation",
      days_per_week: 3,
      duration_weeks: 4,
      base_distance_km: 6,
      description: "Plan powrotu do biegania dla osób po zapaleniu okostnej (shin splints), z 3 treningami tygodniowo przez 4 tygodnie",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Zmniejszenie obciążenia i ból, wprowadzenie aktywności o niskim wpływie.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'rehab', description: 'Marsz 20-30 minut + ćwiczenia', distance: 2, duration: 30, target_pace: { min_per_km: 10, sec_per_km: 0 }, target_heart_rate: { min: 90, max: 110 }, support_exercises: [{ name: "Rozciąganie mięśni łydki", sets: 3, duration: 30 }, { name: "Rozciąganie mięśni piszczelowych", sets: 3, duration: 30 }, { name: "Okłady z lodu", sets: 1, duration: 15 }] } },
          { day_name: "Środa", workout: { type: 'cross', description: 'Trening alternatywny: pływanie lub rower', distance: 0, duration: 30, target_pace: { min_per_km: 0, sec_per_km: 0 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [{ name: "Wzmacnianie mięśni piszczelowych", sets: 3, reps: 15 }, { name: "Wzmacnianie mięśni stopy", sets: 3, reps: 15 }, { name: "Okłady z lodu", sets: 1, duration: 15 }] } },
          { day_name: "Piątek", workout: { type: 'rehab', description: 'Marsz 25-35 minut na miękkim podłożu', distance: 3, duration: 35, target_pace: { min_per_km: 9, sec_per_km: 30 }, target_heart_rate: { min: 100, max: 120 }, support_exercises: [{ name: "Rolowanie mięśni łydki", sets: 2, duration: 5 }, { name: "Rozciąganie dynamiczne nóg", sets: 1, duration: 10 }, { name: "Okłady z lodu", sets: 1, duration: 15 }] } }
        ]
      },
      {
        week_num: 2,
        focus: "Stopniowe wprowadzanie krótkiego biegu, kontynuacja wzmacniania i rozciągania.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'run_walk', description: 'Interwały marsz/bieg (4min/1min) x 5', distance: 3, duration: 35, target_pace: { min_per_km: 8, sec_per_km: 30 }, target_heart_rate: { min: 110, max: 130 }, support_exercises: [{ name: "Wzmacnianie mięśni piszczelowych", sets: 3, reps: 15 }, { name: "Rozciąganie mięśni łydki", sets: 3, duration: 30 }, { name: "Masaż poprzeczny piszczeli", sets: 1, duration: 10 }] } },
          { day_name: "Środa", workout: { type: 'cross', description: 'Trening alternatywny + wzmacnianie', distance: 0, duration: 40, target_pace: { min_per_km: 0, sec_per_km: 0 }, target_heart_rate: { min: 125, max: 145 }, support_exercises: [{ name: "Ćwiczenia mięśni piszczelowych z taśmą", sets: 3, reps: 15 }, { name: "Wzmacnianie mięśni stopy i łydki", sets: 3, reps: 15 }, { name: "Ćwiczenia równoważne", sets: 2, duration: 3 }] } },
          { day_name: "Piątek", workout: { type: 'run_walk', description: 'Interwały marsz/bieg (3min/2min) x 6', distance: 4, duration: 45, target_pace: { min_per_km: 8, sec_per_km: 0 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [{ name: "Mobilizacja stawu skokowego", sets: 2, reps: 10 }, { name: "Rozciąganie mięśni piszczelowych", sets: 3, duration: 30 }, { name: "Automasaż z rollerem", sets: 1, duration: 10 }] } }
        ]
      },
      {
        week_num: 3,
        focus: "Zwiększenie obciążenia biegowego z monitorowaniem odczuć w piszczelach.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'run_walk', description: 'Interwały marsz/bieg (2min/3min) x 6', distance: 5, duration: 50, target_pace: { min_per_km: 7, sec_per_km: 30 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [{ name: "Wzmacnianie mięśni piszczelowych", sets: 3, reps: 15 }, { name: "Rozciąganie mięśni łydki i piszczeli", sets: 3, duration: 30 }, { name: "Automasaż", sets: 1, duration: 10 }] } },
          { day_name: "Środa", workout: { type: 'cross', description: 'Trening alternatywny o umiarkowanej intensywności', distance: 0, duration: 45, target_pace: { min_per_km: 0, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [{ name: "Kompleksowe wzmacnianie nóg", sets: 3, reps: 12 }, { name: "Stretching dynamiczny", sets: 1, duration: 10 }, { name: "Balansowanie na niestabilnym podłożu", sets: 2, duration: 3 }] } },
          { day_name: "Piątek", workout: { type: 'easy', description: 'Lekki bieg ciągły z krótkim marszem', distance: 5, duration: 50, target_pace: { min_per_km: 7, sec_per_km: 0 }, target_heart_rate: { min: 125, max: 145 }, support_exercises: [{ name: "Rolowanie mięśni łydki i piszczeli", sets: 2, duration: 5 }, { name: "Rozciąganie statyczne", sets: 1, duration: 15 }, { name: "Masaż poprzeczny piszczeli", sets: 1, duration: 10 }] } }
        ]
      },
      {
        week_num: 4,
        focus: "Przejście do normalnych treningów z zachowaniem ćwiczeń profilaktycznych.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'easy', description: 'Bieg ciągły w kontrolowanym tempie', distance: 6, duration: 55, target_pace: { min_per_km: 6, sec_per_km: 30 }, target_heart_rate: { min: 130, max: 150 }, support_exercises: [{ name: "Ćwiczenia stabilizacyjne", sets: 3, reps: 12 }, { name: "Rozciąganie mięśni piszczelowych", sets: 3, duration: 30 }, { name: "Rolowanie powięzi", sets: 1, duration: 10 }] } },
          { day_name: "Środa", workout: { type: 'fartlek', description: 'Luźny fartlek z kontrolowanymi przyspieszeniami', distance: 6, duration: 55, target_pace: { min_per_km: 6, sec_per_km: 15 }, target_heart_rate: { min: 135, max: 155 }, support_exercises: [{ name: "Wzmacnianie mięśni piszczelowych", sets: 3, reps: 15 }, { name: "Mobilność stawu skokowego", sets: 2, duration: 5 }, { name: "Stretching dynamiczny", sets: 1, duration: 10 }] } },
          { day_name: "Piątek", workout: { type: 'easy', description: 'Lekki bieg z przyspieszeniami na końcu', distance: 7, duration: 65, target_pace: { min_per_km: 6, sec_per_km: 15 }, target_heart_rate: { min: 130, max: 155 }, support_exercises: [{ name: "Kompleksowe rozciąganie nóg", sets: 1, duration: 15 }, { name: "Rolowanie mięśni piszczelowych", sets: 2, duration: 5 }, { name: "Ćwiczenia wzmacniające mięśnie podudzia", sets: 2, reps: 15 }] } }
        ]
      }
    ]
  },
  
  'return_to_running_after_knee_injury_3days_8weeks': {
    id: 'return_to_running_after_knee_injury_3days_8weeks',
    metadata: {
      discipline: "running",
      target_group: "Biegacze po kontuzji kolana",
      target_goal: "Rehabilitacja",
      level_hint: "rehabilitation",
      days_per_week: 3,
      duration_weeks: 8,
      base_distance_km: 5,
      description: "Plan powrotu do biegania po kontuzji kolana, składający się z 3 treningów tygodniowo przez 8 tygodni, z naciskiem na stopniowe zwiększanie obciążenia i wzmacnianie mięśni stabilizujących staw kolanowy",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Wzmacnianie mięśni wokół stawu kolanowego bez obciążenia biegowego.",
        days: [
          { day_name: "Wtorek", workout: { type: 'rehab', description: 'Ćwiczenia wzmacniające + marsz', distance: 1.5, duration: 30, target_pace: { min_per_km: 12, sec_per_km: 0 }, target_heart_rate: { min: 90, max: 110 }, support_exercises: [{ name: "Unoszenie wyprostowanej nogi w leżeniu", sets: 3, reps: 12 }, { name: "Przysiady izometryczne przy ścianie", sets: 3, reps: 10, duration: 30 }, { name: "Naprzemienne prostowanie nóg na siedząco", sets: 3, reps: 10 }] } },
          { day_name: "Czwartek", workout: { type: 'cross', description: 'Rower stacjonarny o niskim oporze', distance: 0, duration: 25, target_pace: { min_per_km: 0, sec_per_km: 0 }, target_heart_rate: { min: 100, max: 120 }, support_exercises: [{ name: "Wyprosty kolana z lekkim oporem", sets: 3, reps: 15 }, { name: "Rozciąganie mięśni czworogłowych", sets: 3, duration: 30 }, { name: "Ćwiczenia mobilności biodra", sets: 2, reps: 15 }] } },
          { day_name: "Sobota", workout: { type: 'rehab', description: 'Kompleksowy trening rehabilitacyjny + marsz', distance: 2, duration: 35, target_pace: { min_per_km: 12, sec_per_km: 0 }, target_heart_rate: { min: 90, max: 110 }, support_exercises: [{ name: "Wznoszenie bioder leżąc", sets: 3, reps: 12 }, { name: "Mini przysiady", sets: 3, reps: 10 }, { name: "Napinanie mięśnia czworogłowego w leżeniu", sets: 3, reps: 15 }] } }
        ]
      },
      {
        week_num: 2,
        focus: "Kontynuacja wzmacniania z wprowadzeniem krótkich interwałów truchtu.",
        days: [
          { day_name: "Wtorek", workout: { type: 'run_walk', description: 'Marsz z 30-sekundowymi interwałami truchtu', distance: 2, duration: 30, target_pace: { min_per_km: 10, sec_per_km: 0 }, target_heart_rate: { min: 100, max: 120 }, support_exercises: [{ name: "Wyprosty kolana siedząc ze zwiększonym oporem", sets: 3, reps: 12 }, { name: "Przysiady z podparciem", sets: 3, reps: 10 }, { name: "Rozciąganie tylnej części uda", sets: 3, duration: 30 }] } },
          { day_name: "Czwartek", workout: { type: 'cross', description: 'Trening na eliptycznym lub rowerze', distance: 0, duration: 30, target_pace: { min_per_km: 0, sec_per_km: 0 }, target_heart_rate: { min: 110, max: 130 }, support_exercises: [{ name: "Zginanie kolana w leżeniu na brzuchu", sets: 3, reps: 15 }, { name: "Wysunięcia miednicy", sets: 3, reps: 15 }, { name: "Prostowanie kolana w siadzie z oporem", sets: 3, reps: 12 }] } },
          { day_name: "Sobota", workout: { type: 'run_walk', description: 'Marsz z wydłużonymi interwałami truchtu (45s)', distance: 2.5, duration: 35, target_pace: { min_per_km: 9, sec_per_km: 30 }, target_heart_rate: { min: 100, max: 120 }, support_exercises: [{ name: "Wchodzenie na niski stopień", sets: 3, reps: 10 }, { name: "Wykroki w miejscu", sets: 2, reps: 10 }, { name: "Przysiady z piłką przy ścianie", sets: 3, reps: 12 }] } }
        ]
      },
      {
        week_num: 3,
        focus: "Zwiększenie czasu biegu w interwałach biegowych.",
        days: [
          { day_name: "Wtorek", workout: { type: 'run_walk', description: 'Interwały biegu/marsz (1min/2min) x 8', distance: 3, duration: 40, target_pace: { min_per_km: 8, sec_per_km: 30 }, target_heart_rate: { min: 110, max: 130 }, support_exercises: [{ name: "Wykroki w bok", sets: 3, reps: 10 }, { name: "Mostek na jednej nodze", sets: 3, reps: 8 }, { name: "Rozciąganie wszystkich grup mięśniowych nóg", sets: 1, duration: 15 }] } },
          { day_name: "Czwartek", workout: { type: 'cross', description: 'Trening na rowerze ze stopniowo zwiększanym oporem', distance: 0, duration: 35, target_pace: { min_per_km: 0, sec_per_km: 0 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [{ name: "Wyprosty kolana z obciążeniem", sets: 3, reps: 12 }, { name: "Przysiady z lekkim obciążeniem", sets: 3, reps: 12 }, { name: "Rozciąganie mięśni czworogłowych i dwugłowych uda", sets: 3, duration: 30 }] } },
          { day_name: "Poniedziałek", workout: { type: 'recovery', description: 'Marsz 20 minut + ćwiczenia wzmacniające mięśnie ud', distance: 2, duration: 30, target_pace: { min_per_km: 10, sec_per_km: 0 }, target_heart_rate: { min: 90, max: 120 }, support_exercises: [{ name: "Półprzysiady", sets: 3, reps: 10 }, { name: "Prostowanie nóg w siadzie", sets: 3, reps: 12 }] } },
          { day_name: "Środa", workout: { type: 'cross', description: 'Trening alternatywny o niskim obciążeniu stawów (pływanie/rower stacjonarny)', distance: 0, duration: 30, target_pace: { min_per_km: 0, sec_per_km: 0 }, target_heart_rate: { min: 120, max: 140 }, support_exercises: [{ name: "Ćwiczenia stabilizacyjne kolana", sets: 2, duration: 5 }] } },
          { day_name: "Piątek", workout: { type: 'recovery', description: 'Marsz/trucht interwałowy 30 sek trucht + 4 min marsz', distance: 2.5, duration: 35, target_pace: { min_per_km: 9, sec_per_km: 0 }, target_heart_rate: { min: 100, max: 130 }, support_exercises: [{ name: "Rozciąganie mięśni czworogłowych i dwugłowych uda", sets: 2, duration: 5 }, { name: "Ćwiczenia wzmacniające mięśnie stabilizujące kolano", sets: 3, reps: 12 }] } }
        ]
      }
    ]
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
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Maksymalne wykorzystanie potencjału biegowego poprzez różnorodne treningi o zróżnicowanej intensywności.",
        days: [
          { day_name: "Poniedziałek", workout: { type: 'easy', description: 'Bieg regeneracyjny w strefie 2', distance: 8, duration: 50, target_pace: { min_per_km: 5, sec_per_km: 30 }, target_heart_rate: { min: 140, max: 155 }, support_exercises: [{ name: "Dynamiczne rozciąganie", sets: 1, duration: 10 }] } },
          { day_name: "Wtorek", workout: { type: 'interval', description: 'Interwały 10x600m w strefie 5, przerwa 200m trucht', distance: 12, duration: 70, target_pace: { min_per_km: 3, sec_per_km: 40 }, target_heart_rate: { min: 170, max: 185 }, support_exercises: [{ name: "Wzmacnianie mięśni nóg", sets: 3, reps: 15 }] } },
          { day_name: "Środa", workout: { type: 'recovery', description: 'Lekki trucht regeneracyjny', distance: 6, duration: 40, target_pace: { min_per_km: 6, sec_per_km: 0 }, target_heart_rate: { min: 130, max: 145 }, support_exercises: [] } },
          { day_name: "Czwartek", workout: { type: 'tempo', description: 'Bieg tempowy ze stopniowaniem intensywności', distance: 12, duration: 65, target_pace: { min_per_km: 4, sec_per_km: 10 }, target_heart_rate: { min: 160, max: 175 }, support_exercises: [] } },
          { day_name: "Piątek", workout: { type: 'fartlek', description: 'Fartlek z przyśpieszeniami', distance: 10, duration: 60, target_pace: { min_per_km: 5, sec_per_km: 0 }, target_heart_rate: { min: 150, max: 170 }, support_exercises: [{ name: "Stabilizacja core", sets: 3, reps: 15 }] } },
          { day_name: "Niedziela", workout: { type: 'long', description: 'Długi bieg z przyspieszeniami w końcówce', distance: 18, duration: 100, target_pace: { min_per_km: 5, sec_per_km: 0 }, target_heart_rate: { min: 145, max: 165 }, support_exercises: [{ name: "Kompleksowe rozciąganie", sets: 1, duration: 15 }] } }
        ]
      }
    ]
  },

  'start_running_2days': {
    id: 'start_running_2days',
    metadata: {
      discipline: "running",
      target_group: "Osoby rozpoczynające przygodę z bieganiem",
      target_goal: "start_running",
      level_hint: "absolute_beginner",
      days_per_week: 2,
      duration_weeks: 8,
      base_distance_km: 0,
      description: "Łagodny plan dla osób rozpoczynających przygodę z bieganiem. Mieszanka marszu i biegu, stopniowo zwiększająca czas biegu.",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Wprowadzenie do aktywności, nauka prawidłowego marszu i biegu.",
        days: [
          { 
            day_name: "Wtorek", 
            workout: { 
              type: 'walk_run', 
              description: 'Marsz 5 min, bieg 1 min, marsz 5 min, bieg 1 min, marsz 5 min', 
              duration: 17,
              intervals: [
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 1 },
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 1 },
                { type: 'walk', duration: 5 }
              ],
              target_heart_rate: { min: 100, max: 130 },
              support_exercises: [
                { name: "Rozciąganie dynamiczne", sets: 1, duration: 5 },
                { name: "Ćwiczenia oddechowe", sets: 1, duration: 3 }
              ]
            }
          },
          { 
            day_name: "Piątek", 
            workout: { 
              type: 'walk_run', 
              description: 'Marsz 5 min, bieg 1 min, marsz 5 min, bieg 1 min, marsz 5 min', 
              duration: 17,
              intervals: [
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 1 },
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 1 },
                { type: 'walk', duration: 5 }
              ],
              target_heart_rate: { min: 100, max: 130 },
              support_exercises: [
                { name: "Rozciąganie statyczne", sets: 1, duration: 5 },
                { name: "Ćwiczenia stabilizacyjne", sets: 1, duration: 5 }
              ]
            }
          }
        ]
      },
      {
        week_num: 2,
        focus: "Zwiększenie czasu biegu, utrzymanie prawidłowej techniki.",
        days: [
          { 
            day_name: "Wtorek", 
            workout: { 
              type: 'walk_run', 
              description: 'Marsz 5 min, bieg 2 min, marsz 5 min, bieg 2 min, marsz 5 min', 
              duration: 19,
              intervals: [
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 2 },
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 2 },
                { type: 'walk', duration: 5 }
              ],
              target_heart_rate: { min: 100, max: 130 },
              support_exercises: [
                { name: "Rozciąganie dynamiczne", sets: 1, duration: 5 },
                { name: "Ćwiczenia oddechowe", sets: 1, duration: 3 }
              ]
            }
          },
          { 
            day_name: "Piątek", 
            workout: { 
              type: 'walk_run', 
              description: 'Marsz 5 min, bieg 2 min, marsz 5 min, bieg 2 min, marsz 5 min', 
              duration: 19,
              intervals: [
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 2 },
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 2 },
                { type: 'walk', duration: 5 }
              ],
              target_heart_rate: { min: 100, max: 130 },
              support_exercises: [
                { name: "Rozciąganie statyczne", sets: 1, duration: 5 },
                { name: "Ćwiczenia stabilizacyjne", sets: 1, duration: 5 }
              ]
            }
          }
        ]
      }
    ]
  },

  'start_running_3days': {
    id: 'start_running_3days',
    metadata: {
      discipline: "running",
      target_group: "Osoby rozpoczynające przygodę z bieganiem",
      target_goal: "start_running",
      level_hint: "absolute_beginner",
      days_per_week: 3,
      duration_weeks: 8,
      base_distance_km: 0,
      description: "Plan dla osób rozpoczynających przygodę z bieganiem. Systematyczne zwiększanie czasu biegu z elementami marszu.",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Wprowadzenie do regularnej aktywności, nauka prawidłowej techniki.",
        days: [
          { 
            day_name: "Wtorek", 
            workout: { 
              type: 'walk_run', 
              description: 'Marsz 5 min, bieg 1 min, marsz 5 min, bieg 1 min, marsz 5 min', 
              duration: 17,
              intervals: [
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 1 },
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 1 },
                { type: 'walk', duration: 5 }
              ],
              target_heart_rate: { min: 100, max: 130 },
              support_exercises: [
                { name: "Rozciąganie dynamiczne", sets: 1, duration: 5 },
                { name: "Ćwiczenia oddechowe", sets: 1, duration: 3 }
              ]
            }
          },
          { 
            day_name: "Czwartek", 
            workout: { 
              type: 'walk_run', 
              description: 'Marsz 5 min, bieg 1 min, marsz 5 min, bieg 1 min, marsz 5 min', 
              duration: 17,
              intervals: [
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 1 },
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 1 },
                { type: 'walk', duration: 5 }
              ],
              target_heart_rate: { min: 100, max: 130 },
              support_exercises: [
                { name: "Ćwiczenia stabilizacyjne", sets: 1, duration: 5 },
                { name: "Rozciąganie statyczne", sets: 1, duration: 5 }
              ]
            }
          },
          { 
            day_name: "Sobota", 
            workout: { 
              type: 'walk_run', 
              description: 'Marsz 5 min, bieg 1 min, marsz 5 min, bieg 1 min, marsz 5 min', 
              duration: 17,
              intervals: [
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 1 },
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 1 },
                { type: 'walk', duration: 5 }
              ],
              target_heart_rate: { min: 100, max: 130 },
              support_exercises: [
                { name: "Rozciąganie całego ciała", sets: 1, duration: 10 },
                { name: "Ćwiczenia oddechowe", sets: 1, duration: 3 }
              ]
            }
          }
        ]
      },
      {
        week_num: 2,
        focus: "Zwiększenie czasu biegu, utrzymanie prawidłowej techniki.",
        days: [
          { 
            day_name: "Wtorek", 
            workout: { 
              type: 'walk_run', 
              description: 'Marsz 5 min, bieg 2 min, marsz 5 min, bieg 2 min, marsz 5 min', 
              duration: 19,
              intervals: [
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 2 },
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 2 },
                { type: 'walk', duration: 5 }
              ],
              target_heart_rate: { min: 100, max: 130 },
              support_exercises: [
                { name: "Rozciąganie dynamiczne", sets: 1, duration: 5 },
                { name: "Ćwiczenia oddechowe", sets: 1, duration: 3 }
              ]
            }
          },
          { 
            day_name: "Czwartek", 
            workout: { 
              type: 'walk_run', 
              description: 'Marsz 5 min, bieg 2 min, marsz 5 min, bieg 2 min, marsz 5 min', 
              duration: 19,
              intervals: [
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 2 },
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 2 },
                { type: 'walk', duration: 5 }
              ],
              target_heart_rate: { min: 100, max: 130 },
              support_exercises: [
                { name: "Ćwiczenia stabilizacyjne", sets: 1, duration: 5 },
                { name: "Rozciąganie statyczne", sets: 1, duration: 5 }
              ]
            }
          },
          { 
            day_name: "Sobota", 
            workout: { 
              type: 'walk_run', 
              description: 'Marsz 5 min, bieg 2 min, marsz 5 min, bieg 2 min, marsz 5 min', 
              duration: 19,
              intervals: [
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 2 },
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 2 },
                { type: 'walk', duration: 5 }
              ],
              target_heart_rate: { min: 100, max: 130 },
              support_exercises: [
                { name: "Rozciąganie całego ciała", sets: 1, duration: 10 },
                { name: "Ćwiczenia oddechowe", sets: 1, duration: 3 }
              ]
            }
          }
        ]
      }
    ]
  },

  'start_running_4days': {
    id: 'start_running_4days',
    metadata: {
      discipline: "running",
      target_group: "Osoby rozpoczynające przygodę z bieganiem",
      target_goal: "start_running",
      level_hint: "absolute_beginner",
      days_per_week: 4,
      duration_weeks: 8,
      base_distance_km: 0,
      description: "Intensywniejszy plan dla osób rozpoczynających przygodę z bieganiem. Szybsze przejście do ciągłego biegu.",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Wprowadzenie do regularnej aktywności, nauka prawidłowej techniki.",
        days: [
          { 
            day_name: "Poniedziałek", 
            workout: { 
              type: 'walk_run', 
              description: 'Marsz 5 min, bieg 1 min, marsz 5 min, bieg 1 min, marsz 5 min', 
              duration: 17,
              intervals: [
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 1 },
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 1 },
                { type: 'walk', duration: 5 }
              ],
              target_heart_rate: { min: 100, max: 130 },
              support_exercises: [
                { name: "Rozciąganie dynamiczne", sets: 1, duration: 5 },
                { name: "Ćwiczenia oddechowe", sets: 1, duration: 3 }
              ]
            }
          },
          { 
            day_name: "Środa", 
            workout: { 
              type: 'walk_run', 
              description: 'Marsz 5 min, bieg 1 min, marsz 5 min, bieg 1 min, marsz 5 min', 
              duration: 17,
              intervals: [
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 1 },
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 1 },
                { type: 'walk', duration: 5 }
              ],
              target_heart_rate: { min: 100, max: 130 },
              support_exercises: [
                { name: "Ćwiczenia stabilizacyjne", sets: 1, duration: 5 },
                { name: "Rozciąganie statyczne", sets: 1, duration: 5 }
              ]
            }
          },
          { 
            day_name: "Piątek", 
            workout: { 
              type: 'walk_run', 
              description: 'Marsz 5 min, bieg 1 min, marsz 5 min, bieg 1 min, marsz 5 min', 
              duration: 17,
              intervals: [
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 1 },
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 1 },
                { type: 'walk', duration: 5 }
              ],
              target_heart_rate: { min: 100, max: 130 },
              support_exercises: [
                { name: "Rozciąganie dynamiczne", sets: 1, duration: 5 },
                { name: "Ćwiczenia oddechowe", sets: 1, duration: 3 }
              ]
            }
          },
          { 
            day_name: "Niedziela", 
            workout: { 
              type: 'walk_run', 
              description: 'Marsz 5 min, bieg 1 min, marsz 5 min, bieg 1 min, marsz 5 min', 
              duration: 17,
              intervals: [
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 1 },
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 1 },
                { type: 'walk', duration: 5 }
              ],
              target_heart_rate: { min: 100, max: 130 },
              support_exercises: [
                { name: "Rozciąganie całego ciała", sets: 1, duration: 10 },
                { name: "Ćwiczenia oddechowe", sets: 1, duration: 3 }
              ]
            }
          }
        ]
      },
      {
        week_num: 2,
        focus: "Zwiększenie czasu biegu, utrzymanie prawidłowej techniki.",
        days: [
          { 
            day_name: "Poniedziałek", 
            workout: { 
              type: 'walk_run', 
              description: 'Marsz 5 min, bieg 2 min, marsz 5 min, bieg 2 min, marsz 5 min', 
              duration: 19,
              intervals: [
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 2 },
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 2 },
                { type: 'walk', duration: 5 }
              ],
              target_heart_rate: { min: 100, max: 130 },
              support_exercises: [
                { name: "Rozciąganie dynamiczne", sets: 1, duration: 5 },
                { name: "Ćwiczenia oddechowe", sets: 1, duration: 3 }
              ]
            }
          },
          { 
            day_name: "Środa", 
            workout: { 
              type: 'walk_run', 
              description: 'Marsz 5 min, bieg 2 min, marsz 5 min, bieg 2 min, marsz 5 min', 
              duration: 19,
              intervals: [
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 2 },
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 2 },
                { type: 'walk', duration: 5 }
              ],
              target_heart_rate: { min: 100, max: 130 },
              support_exercises: [
                { name: "Ćwiczenia stabilizacyjne", sets: 1, duration: 5 },
                { name: "Rozciąganie statyczne", sets: 1, duration: 5 }
              ]
            }
          },
          { 
            day_name: "Piątek", 
            workout: { 
              type: 'walk_run', 
              description: 'Marsz 5 min, bieg 2 min, marsz 5 min, bieg 2 min, marsz 5 min', 
              duration: 19,
              intervals: [
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 2 },
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 2 },
                { type: 'walk', duration: 5 }
              ],
              target_heart_rate: { min: 100, max: 130 },
              support_exercises: [
                { name: "Rozciąganie całego ciała", sets: 1, duration: 10 },
                { name: "Ćwiczenia oddechowe", sets: 1, duration: 3 }
              ]
            }
          },
          { 
            day_name: "Niedziela", 
            workout: { 
              type: 'walk_run', 
              description: 'Marsz 5 min, bieg 2 min, marsz 5 min, bieg 2 min, marsz 5 min', 
              duration: 19,
              intervals: [
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 2 },
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 2 },
                { type: 'walk', duration: 5 }
              ],
              target_heart_rate: { min: 100, max: 130 },
              support_exercises: [
                { name: "Rozciąganie całego ciała", sets: 1, duration: 10 },
                { name: "Ćwiczenia oddechowe", sets: 1, duration: 3 }
              ]
            }
          }
        ]
      }
    ]
  },

  'start_running_varied_3days': {
    id: 'start_running_varied_3days',
    metadata: {
      discipline: "running",
      target_group: "Osoby rozpoczynające przygodę z bieganiem - plan zróżnicowany",
      target_goal: "start_running",
      level_hint: "absolute_beginner",
      days_per_week: 3,
      duration_weeks: 8,
      base_distance_km: 0,
      description: "Zróżnicowany plan dla początkujących z progresywnym wprowadzaniem różnych typów treningów",
      author: "RunFitting AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Wprowadzenie do regularnej aktywności, nauka podstaw",
        days: [
          { 
            day_name: "Wtorek", 
            workout: { 
              type: 'walk_run', 
              description: 'Łagodne wprowadzenie: marsz 5 min, bieg 1 min, marsz 5 min, bieg 1 min, marsz 5 min', 
              duration: 17,
              intervals: [
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 1 },
                { type: 'walk', duration: 5 },
                { type: 'run', duration: 1 },
                { type: 'walk', duration: 5 }
              ],
              target_heart_rate: { min: 100, max: 130 },
              support_exercises: [
                { name: "Rozciąganie dynamiczne", sets: 1, duration: 5 },
                { name: "Ćwiczenia oddechowe", sets: 1, duration: 3 }
              ]
            }
          },
          { 
            day_name: "Czwartek", 
            workout: { 
              type: 'mobility_walk', 
              description: 'Spacer z ćwiczeniami mobilności - co 2 minuty zatrzymaj się na proste ćwiczenia', 
              duration: 20,
              target_heart_rate: { min: 90, max: 120 },
              support_exercises: [
                { name: "Koła ramionami podczas spaceru", sets: 5, reps: 10, duration: null },
                { name: "Wysokie kolana w miejscu", sets: 3, reps: 10, duration: null },
                { name: "Rozciąganie łydek", sets: 2, reps: null, duration: 15 }
              ]
            }
          },
          { 
            day_name: "Sobota", 
            workout: { 
              type: 'walk_run', 
              description: 'Weekend challenge: marsz 4 min, bieg 1 min - powtórz 3 razy', 
              duration: 15,
              intervals: [
                { type: 'walk', duration: 4 },
                { type: 'run', duration: 1 },
                { type: 'walk', duration: 4 },
                { type: 'run', duration: 1 },
                { type: 'walk', duration: 4 },
                { type: 'run', duration: 1 }
              ],
              target_heart_rate: { min: 100, max: 130 },
              support_exercises: [
                { name: "Rozciąganie całego ciała", sets: 1, duration: 10 },
                { name: "Ćwiczenia równowagi", sets: 2, reps: 5, duration: null }
              ]
            }
          }
        ]
      },
      {
        week_num: 2,
        focus: "Wprowadzenie variacji i wydłużanie czasu aktywności",
        days: [
          { 
            day_name: "Wtorek", 
            workout: { 
              type: 'walk_run_intervals', 
              description: 'Progresja: marsz 4 min, bieg 2 min, powtórz 3 razy', 
              duration: 18,
              intervals: [
                { type: 'walk', duration: 4 },
                { type: 'run', duration: 2 },
                { type: 'walk', duration: 4 },
                { type: 'run', duration: 2 },
                { type: 'walk', duration: 4 },
                { type: 'run', duration: 2 }
              ],
              target_heart_rate: { min: 100, max: 140 },
              support_exercises: [
                { name: "Rozgrzewka dynamiczna", sets: 1, duration: 5 },
                { name: "Mini przysiady", sets: 2, reps: 8, duration: null }
              ]
            }
          },
          { 
            day_name: "Czwartek", 
            workout: { 
              type: 'active_recovery', 
              description: 'Aktywna regeneracja: spacer z elementami fitness', 
              duration: 25,
              target_heart_rate: { min: 90, max: 120 },
              support_exercises: [
                { name: "Spacer z przysiadami co 3 minuty", sets: 4, reps: 5, duration: null },
                { name: "Skłony i skręty podczas spaceru", sets: 1, duration: 5 },
                { name: "Rozciąganie kończące", sets: 1, duration: 8 }
              ]
            }
          },
          { 
            day_name: "Sobota", 
            workout: { 
              type: 'endurance_building', 
              description: 'Budowanie wytrzymałości: dłuższe interwały biegu', 
              duration: 20,
              intervals: [
                { type: 'walk', duration: 3 },
                { type: 'run', duration: 3 },
                { type: 'walk', duration: 3 },
                { type: 'run', duration: 3 },
                { type: 'walk', duration: 3 },
                { type: 'run', duration: 3 },
                { type: 'walk', duration: 2 }
              ],
              target_heart_rate: { min: 110, max: 140 },
              support_exercises: [
                { name: "Wzmacnianie core", sets: 2, reps: 8, duration: null },
                { name: "Rozciąganie nóg", sets: 1, duration: 10 }
              ]
            }
          }
        ]
      }
    ]
  }
};