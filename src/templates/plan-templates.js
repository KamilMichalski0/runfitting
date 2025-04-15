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
        focus: "Wprowadzenie do regularnego biegania",
        days: [
          {
            day_name: "poniedziałek",
            workout: {
              type: 'easy',
              description: 'Bieg ciągły w strefie 2',
              distance: 3,
              duration: 30,
              target_pace: { min_per_km: 7, sec_per_km: 30 },
              target_heart_rate: { min: 120, max: 140 },
              support_exercises: [
                { name: "Przysiady", sets: 3, reps: 12 },
                { name: "Plank", sets: 3, duration: 30 }
              ]
            }
          },
          {
            day_name: "środa",
            workout: {
              type: 'recovery',
              description: 'Bieg/marsz w strefie 1',
              distance: 2,
              duration: 25,
              target_pace: { min_per_km: 8, sec_per_km: 0 },
              target_heart_rate: { min: 110, max: 130 },
              support_exercises: [
                { name: "Rozciąganie dynamiczne", sets: 1, duration: 10 }
              ]
            }
          },
          {
            day_name: "sobota",
            workout: {
              type: 'long',
              description: 'Dłuższy bieg w strefie 2',
              distance: 4,
              duration: 40,
              target_pace: { min_per_km: 7, sec_per_km: 30 },
              target_heart_rate: { min: 120, max: 140 },
              support_exercises: []
            }
          }
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
        focus: "Budowanie bazy wytrzymałościowej",
        days: [
          {
            day_name: "poniedziałek",
            workout: {
              type: 'easy',
              description: 'Bieg ciągły w strefie 2',
              distance: 5,
              duration: 45,
              target_pace: { min_per_km: 6, sec_per_km: 30 },
              target_heart_rate: { min: 130, max: 150 },
              support_exercises: [
                { name: "Przysiady", sets: 3, reps: 15 },
                { name: "Wykroki", sets: 3, reps: 12 }
              ]
            }
          },
          {
            day_name: "środa",
            workout: {
              type: 'tempo',
              description: 'Bieg tempowy w strefie 3',
              distance: 6,
              duration: 40,
              target_pace: { min_per_km: 5, sec_per_km: 45 },
              target_heart_rate: { min: 150, max: 165 },
              support_exercises: [
                { name: "Plank", sets: 3, duration: 45 }
              ]
            }
          },
          {
            day_name: "piątek",
            workout: {
              type: 'recovery',
              description: 'Bieg regeneracyjny w strefie 1',
              distance: 4,
              duration: 35,
              target_pace: { min_per_km: 7, sec_per_km: 0 },
              target_heart_rate: { min: 120, max: 140 },
              support_exercises: [
                { name: "Rozciąganie", sets: 1, duration: 15 }
              ]
            }
          },
          {
            day_name: "niedziela",
            workout: {
              type: 'long',
              description: 'Długi bieg w strefie 2',
              distance: 8,
              duration: 70,
              target_pace: { min_per_km: 6, sec_per_km: 30 },
              target_heart_rate: { min: 130, max: 150 },
              support_exercises: []
            }
          }
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
        focus: "Zwiększanie objętości treningowej",
        days: [
          {
            day_name: "poniedziałek",
            workout: {
              type: 'easy',
              description: 'Bieg ciągły w strefie 2',
              distance: 8,
              duration: 60,
              target_pace: { min_per_km: 5, sec_per_km: 30 },
              target_heart_rate: { min: 140, max: 160 },
              support_exercises: [
                { name: "Przysiady", sets: 4, reps: 15 },
                { name: "Wykroki", sets: 4, reps: 12 }
              ]
            }
          },
          {
            day_name: "wtorek",
            workout: {
              type: 'interval',
              description: 'Interwały 400m w strefie 5',
              distance: 8,
              duration: 50,
              target_pace: { min_per_km: 4, sec_per_km: 30 },
              target_heart_rate: { min: 170, max: 185 },
              support_exercises: [
                { name: "Plank", sets: 4, duration: 60 }
              ]
            }
          },
          {
            day_name: "czwartek",
            workout: {
              type: 'tempo',
              description: 'Bieg tempowy w strefie 3',
              distance: 10,
              duration: 60,
              target_pace: { min_per_km: 5, sec_per_km: 0 },
              target_heart_rate: { min: 160, max: 175 },
              support_exercises: [
                { name: "Wspięcia na palce", sets: 4, reps: 20 }
              ]
            }
          },
          {
            day_name: "piątek",
            workout: {
              type: 'recovery',
              description: 'Bieg regeneracyjny w strefie 1',
              distance: 6,
              duration: 45,
              target_pace: { min_per_km: 6, sec_per_km: 0 },
              target_heart_rate: { min: 130, max: 150 },
              support_exercises: [
                { name: "Rozciąganie", sets: 1, duration: 20 }
              ]
            }
          },
          {
            day_name: "niedziela",
            workout: {
              type: 'long',
              description: 'Długi bieg w strefie 2',
              distance: 15,
              duration: 100,
              target_pace: { min_per_km: 5, sec_per_km: 30 },
              target_heart_rate: { min: 140, max: 160 },
              support_exercises: []
            }
          }
        ]
      }
    ]
  },

  'running_return_plantar_fasciitis_4days_6weeks': {
    id: 'running_return_plantar_fasciitis_4days_6weeks',
    metadata: {
      discipline: "running",
      target_group: "Biegacze powracający po zapaleniu rozcięgna podeszwowego (plantar fasciitis)",
      target_goal: "return_after_injury",
      level_hint: "rehabilitation",
      days_per_week: 4,
      duration_weeks: 6,
      description: "Plan powrotu do biegania po zapaleniu rozcięgna podeszwowego",
      author: "Generator Fizjo AI"
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Bardzo delikatne wprowadzenie, zero bólu podczas i po aktywności",
        days: [
          {
            day_name: "Pon",
            workout: {
              type: 'rehabilitation',
              description: "Ćwiczenia Korekcyjne (patrz sekcja 'Ćwiczenia').",
              support_exercises: [
                { name: "Mobilizacja powięzi podeszwowej", sets: 3, duration: 60 },
                { name: "Rozciąganie łydek", sets: 3, duration: 30 }
              ]
            }
          },
          {
            day_name: "Śr",
            workout: {
              type: 'low_impact',
              description: "Lekka aktywność (jeśli bezbolesna)",
              duration: 25,
              options: [
                { activity: "Marsz", duration: 25 },
                { activity: "Rower stacjonarny", duration: 25 }
              ]
            }
          },
          {
            day_name: "Pt",
            workout: {
              type: 'low_impact',
              description: "Lekka aktywność (jeśli bezbolesna)",
              duration: 25,
              options: [
                { activity: "Marsz", duration: 25 },
                { activity: "Rower stacjonarny", duration: 25 }
              ]
            }
          },
          {
            day_name: "Ndz",
            workout: {
              type: 'cross_training',
              description: "Odpoczynek lub Cross-Training",
              duration: 30,
              options: [
                { activity: "Rower", duration: 30, intensity: "lekko" },
                { activity: "Pływanie", duration: 30 }
              ]
            }
          }
        ]
      }
    ],
    notes: [
      "KLUCZOWA ZASADA: Monitoruj ból! Używaj skali 0-10. Ból podczas aktywności/ćwiczeń nie powinien przekraczać 3-4/10. Ból następnego dnia rano nie powinien być wyższy niż przed aktywnością. Jeśli ból się nasila, zmniejsz intensywność/czas trwania, zrób dodatkowy dzień przerwy lub wróć do ćwiczeń/aktywności z poprzedniego etapu.",
      "DOZWOLONE: Marsz po płaskim, miękkim terenie (jeśli bezbolesny), jazda na rowerze stacjonarnym (z niskim oporem), pływanie (bez mocnej pracy nóg stylem klasycznym - 'żabką'), ćwiczenia korekcyjne wg planu (bezbolesne).",
      "PRZECIWWSKAZANE: Bieganie, skakanie, podskoki, sprinty, chodzenie/stanie na palcach, agresywny stretching Achillesa/łydek (szczególnie jeśli prowokuje ból), wszelkie aktywności, które wywołują ból > 4/10 lub zwiększają ból następnego dnia.",
      "ĆWICZENIA KOREKCYJNE: Wykonuj ćwiczenia korekcyjne codziennie lub minimum 5 razy w tygodniu dla najlepszych efektów.",
      "KONSULTACJA: Jeśli ból nie zmniejsza się po 2-4 tygodniach stosowania planu, nasila się lub pojawiają się nowe objawy, skonsultuj się z fizjoterapeutą lub lekarzem."
    ]
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
    },
    plan_weeks: [
      {
        week_num: 1,
        focus: "Kontrola bólu, wprowadzenie delikatnych ćwiczeń, ocena tolerancji",
        days: [
          {
            day_name: "Codziennie (15-30 min)",
            workout: {
              type: 'rehabilitation',
              description: "Ćwiczenia Korekcyjne: Delikatne krążenia stóp (10-15 w każdą stronę), zgięcie/wyprost stopy w pełnym bezbolesnym zakresie (15-20x). Rozpocznij Ćwiczenia Ekscentryczne Łydki (Heel Drops) - patrz 'Uwagi' - 3 serie po 10-15 powtórzeń, BARDZO powoli, tylko jeśli ból podczas ćwiczenia <= 3/10 i nie narasta po.",
              support_exercises: [
                { name: "Mobilizacja powięzi podeszwowej", sets: 3, duration: 60 },
                { name: "Rozciąganie łydek", sets: 3, duration: 30 }
              ]
            }
          },
          {
            day_name: "Dzień 1 (np. Wt)",
            workout: {
              type: 'low_impact',
              description: "Lekka aktywność (jeśli bezbolesna)",
              duration: 25,
              options: [
                { activity: "Marsz", duration: 25 },
                { activity: "Rower stacjonarny", duration: 25 }
              ]
            }
          },
          {
            day_name: "Dzień 2 (np. Czw)",
            workout: {
              type: 'low_impact',
              description: "Lekka aktywność (jeśli bezbolesna)",
              duration: 25,
              options: [
                { activity: "Marsz", duration: 25 },
                { activity: "Rower stacjonarny", duration: 25 }
              ]
            }
          },
          {
            day_name: "Dzień 3 (np. Sob)",
            workout: {
              type: 'low_impact',
              description: "Lekka aktywność (jeśli bezbolesna)",
              duration: 25,
              options: [
                { activity: "Marsz", duration: 25 },
                { activity: "Rower stacjonarny", duration: 25 }
              ]
            }
          }
        ]
      }
    ],
    notes: [
      "KLUCZOWA ZASADA: Monitoruj ból! Używaj skali 0-10. Ból podczas aktywności/ćwiczeń nie powinien przekraczać 3-4/10. Ból następnego dnia rano nie powinien być wyższy niż przed aktywnością. Jeśli ból się nasila, zmniejsz intensywność/czas trwania, zrób dodatkowy dzień przerwy lub wróć do ćwiczeń/aktywności z poprzedniego etapu.",
      "DOZWOLONE: Marsz po płaskim, miękkim terenie (jeśli bezbolesny), jazda na rowerze stacjonarnym (z niskim oporem), pływanie (bez mocnej pracy nóg stylem klasycznym - 'żabką'), ćwiczenia korekcyjne wg planu (bezbolesne).",
      "PRZECIWWSKAZANE: Bieganie, skakanie, podskoki, sprinty, chodzenie/stanie na palcach, agresywny stretching Achillesa/łydek (szczególnie jeśli prowokuje ból), wszelkie aktywności, które wywołują ból > 4/10 lub zwiększają ból następnego dnia.",
      "ĆWICZENIA KOREKCYJNE: Wykonuj ćwiczenia korekcyjne codziennie lub minimum 5 razy w tygodniu dla najlepszych efektów.",
      "KONSULTACJA: Jeśli ból nie zmniejsza się po 2-4 tygodniach stosowania planu, nasila się lub pojawiają się nowe objawy, skonsultuj się z fizjoterapeutą lub lekarzem."
    ]
  }
};