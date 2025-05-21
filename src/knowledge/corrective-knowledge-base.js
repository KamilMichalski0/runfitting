const correctiveExercisesKnowledgeBase = {
  introduction: {
    title: "Wdrażanie Ćwiczeń Korekcyjnych w Planie Treningowym Biegacza",
    mainPoints: [
      "Bieganie wiąże się z ryzykiem urazów, ale kontuzja nie musi oznaczać końca kariery biegowej.",
      "Okres rekonwalescencji to okazja do identyfikacji i eliminacji czynników ryzyka oraz poprawy formy.",
      "Ćwiczenia korekcyjne są kluczowe w powrocie do biegania po kontuzji, stanowiąc pomost między ograniczoną sprawnością a bezpiecznym wznowieniem treningów.",
      "Rehabilitacja powinna być indywidualnie dostosowana, uwzględniając rodzaj uszkodzenia, cele sportowe i wiek biegacza.",
      "Celem ćwiczeń korekcyjnych jest leczenie objawów oraz identyfikacja i eliminacja przyczyn kontuzji (osłabienie mięśni, ograniczenia zakresu ruchu, nieprawidłowa technika).",
    ],
    trainingTypes: {
      properTraining: "Aktywności bezpośrednio związane z bieganiem (rozbiegania, tempówki, interwały).",
      supportiveTraining: "Inne formy aktywności poprawiające parametry niezbędne do bezpiecznego biegania (siła, stabilizacja, mobilność, elastyczność, regeneracja).",
      emphasisDuringRecovery: "W okresie rekonwalescencji nacisk przesuwa się z intensywnego treningu biegowego na ćwiczenia wspomagające.",
      examplesOfSupportiveTraining: "Ćwiczenia siłowe (ciężar ciała, hantle, gumy, TRX, kettlebelle), ćwiczenia mobilności i elastyczności, techniki autorelaksacyjne.",
      substituteTraining: "Jazda na rowerze, pływanie, aqua jogging dla utrzymania kondycji sercowo-naczyniowej bez obciążania kontuzjowanych struktur."
    }
  },
  exerciseSections: {
    strengthAndActivation: {
      title: "Siła i aktywacja mięśniowa",
      description: "Wzmocnienie bioder, pośladków, tułowia i mięśni głębokich jest fundamentalne dla powrotu do biegania i profilaktyki urazów. Silne mięśnie absorbują siły, utrzymują biomechanikę i zapobiegają przeciążeniom.",
      areas: {
        hipsAndGlutes: {
          title: "Biodra i pośladki",
          exercises: [
            {
              name: "Mostek biodrowy",
              equipment: ["hantle (opcjonalnie)", "mini bandy (opcjonalnie)"],
              instructions: "Połóż się na plecach z ugiętymi kolanami i stopami płasko na podłodze. Unieś biodra w górę, napinając mięśnie pośladkowe. Można dodać obciążenie (hantle na biodrach) lub mini band wokół ud.",
              sets_reps: "3 serie po 10-15 powtórzeń.",
              focus: "Mocne napięcie pośladków w górnej fazie.",
              contraindications: "Ból w kontuzjowanej okolicy."
            },
            {
              name: "Odwodzenie biodra w leżeniu bokiem",
              equipment: ["mini bandy (opcjonalnie)"],
              instructions: "Połóż się na boku z nogami wyprostowanymi. Mini band wokół ud, tuż nad kolanami. Unieś górną nogę, kontrolując ruch.",
              sets_reps: "3 serie po 15-20 powtórzeń na nogę.",
              progression: "Użycie mocniejszej gumy.",
              contraindications: "Ból."
            },
            {
              name: "Clamshell",
              equipment: ["mini bandy (opcjonalnie)"],
              instructions: "Połóż się na boku z ugiętymi kolanami i stopami złączonymi. Mini band wokół ud. Unieś górne kolano, utrzymując stopy złączone.",
              sets_reps: "3 serie po 15 powtórzeń na stronę.",
              focus: "Kontrolowany ruch.",
              contraindications: "Ból."
            },
            {
              name: "Przysiad jednonóż z TRX",
              equipment: ["TRX"],
              instructions: "Stań przodem do punktu zaczepienia TRX, trzymając uchwyty. Unieś jedną nogę w przód i wykonaj przysiad na drugiej nodze, kontrolując ruch za pomocą TRX.",
              sets_reps: "2 serie po 10 powtórzeń na nogę.",
              progression: "Zmiana kąta nachylenia ciała.",
              contraindications: "Ból."
            },
            {
              name: "Martwy ciąg jednonóż z kettlebell",
              equipment: ["kettlebell"],
              instructions: "Stań na jednej nodze, drugą unieś lekko do tyłu. Wykonaj skłon tułowia w przód, opuszczając kettlebell, jednocześnie unosząc tylną nogę. Powrót do pozycji wyjściowej.",
              sets_reps: "3 serie po 8 powtórzeń na nogę.",
              focus: "Praca biodra, rozciąganie mięśni dwugłowych uda.",
              contraindications: "Ból, problemy z równowagą."
            }
          ]
        },
        coreAndDeepMuscles: {
          title: "Tułów i mięśnie głębokie",
          exercises: [
            {
              name: "Plank (deska)",
              instructions: "Oprzyj się na przedramionach i palcach stóp, utrzymując ciało w linii prostej.",
              sets_duration: "3 serie po 30-60 sekund.",
              focus: "Napięcie mięśni brzucha i pośladków.",
              contraindications: "Ból."
            },
            {
              name: "Side Plank (deska boczna)",
              instructions: "Połóż się na boku, opierając na przedramieniu i zewnętrznej krawędzi stopy. Unieś biodra, utrzymując ciało w linii prostej.",
              sets_duration: "3 serie po 30-60 sekund na stronę.",
              contraindications: "Ból."
            },
            {
              name: "Pallof Press",
              equipment: ["gumy oporowe"],
              instructions: "Stań bokiem do punktu zaczepienia gumy, trzymając uchwyt przed klatką piersiową. Wyprostuj ręce przed siebie, utrzymując stabilny tułów i przeciwdziałając rotacji.",
              sets_reps: "3 serie po 10-12 powtórzeń na stronę.",
              contraindications: "Ból."
            },
            {
              name: "TRX Plank",
              equipment: ["TRX"],
              instructions: "Umieść stopy w uchwytach TRX, pozycja planku na dłoniach lub przedramionach. Utrzymaj ciało w linii prostej, napinając mięśnie brzucha i pośladków.",
              sets_duration: "3 serie po 30-60 sekund.",
              contraindications: "Ból."
            },
            {
              name: "Martwy ciąg z kettlebell",
              equipment: ["kettlebell"],
              instructions: "Stań nad kettlebell ze stopami na szerokość bioder. Wykonaj ruch martwego ciągu, utrzymując proste plecy i angażując mięśnie pośladkowe i dwugłowe ud.",
              sets_reps: "3 serie po 8-10 powtórzeń.",
              contraindications: "Ból."
            }
          ]
        },
        calfMuscles: {
          title: "Mięśnie łydki",
          exercises: [
            {
              name: "Wspięcia na palce",
              equipment: ["ciężar ciała", "hantle (opcjonalnie)", "kettlebell (opcjonalnie)"],
              instructions: "Stań na podwyższeniu lub płaskiej powierzchni. Unieś się na palcach, napinając mięśnie łydki. Wykonuj z prostymi i lekko ugiętymi kolanami. Można dodać obciążenie.",
              sets_reps: "3 serie po 12-15 powtórzeń.",
              contraindications: "Ból."
            },
            {
              name: "Heel Drops",
              equipment: ["stopień/krawędź"],
              instructions: "Stań na krawędzi stopnia na palcach. Powoli opuść pięty poniżej poziomu stopnia, czując rozciąganie.",
              sets_reps: "3 serie po 10 powtórzeń.",
              focus: "Kontrolowany ruch ekscentryczny.",
              contraindications: "Ból."
            },
            {
              name: "Seated Calf Raises",
              equipment: ["hantle (opcjonalnie)", "kettlebell (opcjonalnie)"],
              instructions: "Usiądź na krześle ze stopami płasko na podłodze. Umieść obciążenie na udach, tuż nad kolanami. Unieś pięty, napinając mięśnie łydki.",
              sets_reps: "3 serie po 10 powtórzeń.",
              contraindications: "Ból."
            }
          ]
        }
      },
      generalRecommendations: {
        sets_reps: "2-3 serie po 8-15 powtórzeń (zależnie od celu: siła vs. wytrzymałość).",
        intensity: "Ostatnie powtórzenia wymagające, ale z prawidłową techniką. Zaczynać od ciężaru ciała, stopniowo zwiększać obciążenie.",
        tempo: "Ruchy kontrolowane, faza ekscentryczna (opuszczanie) wolniejsza niż koncentryczna (podnoszenie).",
        contraindications: "Ostry ból, nasilenie obrzęku, brak możliwości wykonania ruchu w pełnym zakresie bez bólu. Wątpliwości konsultować z fizjoterapeutą."
      }
    },
    stabilization: {
      title: "Stabilizacja centralna i kończyn dolnych",
      description: "Niezbędna dla równowagi, absorpcji wstrząsów i zapobiegania niekontrolowanym ruchom. Zapewnia optymalne rozłożenie sił.",
      exercises: [
        {
          name: "Single-Leg Balance",
          equipment: ["opcjonalnie: niestabilne podłoże (np. poduszka sensoryczna)"],
          instructions: "Stań na jednej nodze, drugą unieś. Utrzymaj równowagę.",
          sets_duration: "3-5 powtórzeń po 30 sekund na nogę.",
          progression: "Zamknięcie oczu, stanie na niestabilnym podłożu.",
          contraindications: "Utrata równowagi, ból."
        },
        {
          name: "Hip Hikes",
          equipment: ["stopień/krawędź"],
          instructions: "Stań na krawędzi stopnia na jednej nodze. Opuść miednicę po stronie nieobciążonej nogi, następnie unieś ją, utrzymując prostą nogę podporową.",
          sets_reps: "3 serie po 12-15 powtórzeń na nogę.",
          focus: "Kontrolowany ruch.",
          contraindications: "Ból."
        },
        {
          name: "Monster Walks",
          equipment: ["mini bandy"],
          instructions: "Załóż mini band na uda, tuż nad kolanami. Wykonuj kroki do przodu, do tyłu i na boki, utrzymując napięcie na gumie.",
          sets_reps: "2-3 serie po 10-15 kroków w każdym kierunku.",
          contraindications: "Ból."
        },
        {
          name: "TRX Single-Leg Squat",
          description: "Opisano w sekcji 'Siła i aktywacja mięśniowa'."
        },
        {
          name: "Bird Dog",
          instructions: "Pozycja na czworakach. Unieś jednocześnie prawą rękę i lewą nogę, utrzymując prosty kręgosłup i napięte mięśnie brzucha. Wytrzymaj kilka sekund, zmień stronę.",
          sets_reps: "3 serie po 10-12 powtórzeń na stronę.",
          contraindications: "Ból."
        }
      ],
      generalRecommendations: "Kluczowa jest jakość ruchu i utrzymanie równowagi. Stopniowo wydłużać czas utrzymania pozycji, zwiększać opór lub wprowadzać niestabilne podłoże.",
      contraindications: "Unikać ćwiczeń powodujących ból lub utratę kontroli nad ruchem."
    },
    mobility: {
      title: "Mobilność",
      description: "Odpowiednia mobilność w stawach skokowych, biodrowych i kręgosłupa piersiowego jest niezbędna dla efektywnego biegu, amortyzacji i zapobiegania urazom. Ograniczona ruchomość może prowadzić do kompensacji.",
      areas: {
        ankles: {
          title: "Stawy skokowe",
          exercises: [
            { name: "Ankle Circles", instructions: "Usiądź lub stań. Krążenia stopami w obie strony.", sets_reps: "10 w prawo, 10 w lewo na nogę.", frequency: "Codziennie, delikatne ruchy.", contraindications: "Ból." },
            { name: "Towel Scrunch", equipment: ["ręcznik"], instructions: "Usiądź, stopa na ręczniku. Zmarszcz ręcznik palcami, potem rozłóż.", sets_reps: "3 serie po 8-12 powtórzeń na stopę.", frequency: "Codziennie, delikatnie.", contraindications: "Ból." },
            { name: "Calf Stretch", equipment: ["ściana", "stopień"], instructions: "Rozciąganie mięśni łydki (brzuchatego i płaszczkowatego) z prostym i ugiętym kolanem.", sets_duration: "3 powtórzenia po 30 sekund na nogę.", focus: "Czuć rozciąganie.", contraindications: "Ból." },
            { name: "Ankle Alphabet", instructions: "Usiądź lub połóż się. Wykreślaj stopą litery alfabetu.", sets_reps: "1-2 razy na stopę.", frequency: "Codziennie, powoli, kontrolując ruch.", contraindications: "Ból." }
          ]
        },
        hips: {
          title: "Biodra",
          exercises: [
            { name: "Hip Flexor Stretch", equipment: ["ściana (opcjonalnie)", "krzesło (opcjonalnie)"], instructions: "Rozciąganie zginaczy biodra w klęku lub stojąc.", sets_duration: "3 powtórzenia po 30 sekund na stronę.", focus: "Czuć rozciąganie w przedniej części biodra.", contraindications: "Ból." },
            { name: "Piriformis Stretch", instructions: "Rozciąganie mięśnia gruszkowatego siedząc lub leżąc.", sets_duration: "3 powtórzenia po 30 sekund na stronę.", focus: "Czuć rozciąganie w głębi pośladka.", contraindications: "Ból." },
            { name: "Forward Fold with Crossed Legs", instructions: "Stojąc, skrzyżuj nogi, skłon w przód z lekko ugiętymi kolanami.", duration: "Do 1 minuty na stronę.", focus: "Rozciąganie pasma biodrowo-piszczelowego i zewnętrznej części uda.", contraindications: "Zawrót głowy." },
            { name: "Cow Face Pose (Gomukhasana)", instructions: "Pozycja jogi rozciągająca pośladki, biodra, uda.", duration: "Do 1 minuty na stronę.", focus: "Czuć rozciąganie, unikać pogłębiania na jedną stronę.", contraindications: "Ból kolana." }
          ]
        },
        thoracicSpine: {
          title: "Odcinek piersiowy kręgosłupa",
          exercises: [
            { name: "Thoracic Extension over Foam Roller", equipment: ["wałek do masażu"], instructions: "Leżąc na plecach na wałku (poprzecznie pod łopatkami), powolne wyprosty kręgosłupa.", sets_reps: "5-10 powtórzeń.", frequency: "Codziennie, delikatnie.", contraindications: "Ból." },
            { name: "Thoracic Rotation", instructions: "Siedząc lub klęcząc, delikatne rotacje tułowia w obie strony.", sets_reps: "10-15 na stronę.", frequency: "Codziennie, delikatnie.", contraindications: "Ból." }
          ]
        }
      },
      generalRecommendations: "Wykonywać powoli i z kontrolą, utrzymując rozciąganie. Często można wykonywać codziennie.",
      contraindications: "Nie forsować ruchów poza komfortowy zakres, przerywać przy bólu."
    },
    correctiveStretching: {
      title: "Stretching korekcyjny",
      description: "Poprawia elastyczność, zmniejsza sztywność, niweluje nierównowagę mięśniową. Wydłuża skrócone mięśnie, poprawia zakres ruchu i ustawienie ciała.",
      types: {
        staticStretching: {
          title: "Stretching statyczny",
          guidelines: "Utrzymaj każde rozciąganie przez 30-60 sekund, 2-3 powtórzenia na stronę. Po treningach lub jako oddzielna sesja kilka razy w tygodniu.",
          exercises: [
            { name: "Hamstring Stretch" },
            { name: "Quadriceps Stretch" },
            { name: "Calf Stretch" },
            { name: "Hip Flexor Stretch" },
            { name: "Piriformis Stretch" },
            { name: "IT Band Stretch" }
          ]
        },
        dynamicStretching: {
          title: "Stretching dynamiczny",
          guidelines: "Wykonuj przed bieganiem jako część rozgrzewki, 10-15 powtórzeń na każde ćwiczenie.",
          exercises: [
            { name: "Leg Swings (przód, tył, bok)" },
            { name: "Arm Swings" },
            { name: "Torso Twists" },
            { name: "Walking Lunges" },
            { name: "High Knees" },
            { name: "Butt Kicks" }
          ]
        }
      },
      generalRecommendations: "Stretching statyczny: dłuższe utrzymanie dla wydłużenia mięśni. Dynamiczny: kontrolowane ruchy dla przygotowania do aktywności. Unikać gwałtownych ruchów i forsowania.",
      contraindications: "Unikać rozciągania świeżo uszkodzonych mięśni. Rozciągać do delikatnego ciągnięcia, nie bólu."
    },
    selfRelaxation: {
      title: "Techniki autorelaksacyjne",
      description: "Automasaż (rolowanie, masaż punktów spustowych) zmniejsza napięcie mięśniowe, poprawia przepływ krwi, uwalnia punkty spustowe, wspomaga regenerację. Pomaga radzić sobie z bólem i sztywnością.",
      methods: {
        foamRolling: {
          title: "Foam Rolling",
          guidelines: "Roluj powoli każdą grupę mięśniową przez 30-60 sekund, skupiając się na bolesnych miejscach (punktach spustowych).",
          areas: [
            { name: "Łydki" },
            { name: "Mięśnie dwugłowe uda" },
            { name: "Mięśnie czworogłowe uda" },
            { name: "Pasma biodrowo-piszczelowe" },
            { name: "Pośladki" }
          ]
        },
        ballMassage: {
          title: "Lacrosse Ball/Tennis Ball Massage",
          guidelines: "Przykładaj nacisk do punktów spustowych przez 30-60 sekund.",
          areas: [
            { name: "Rozcięgno podeszwowe" },
            { name: "Pośladki" },
            { name: "Łydki" },
            { name: "Mięsień gruszkowaty" }
          ]
        }
      },
      generalRecommendations: "Codziennie lub kilka razy w tygodniu, szczególnie po treningach. Umiarkowany nacisk, unikać ostrego bólu.",
      contraindications: "Unikać rolowania bezpośrednio po świeżych urazach, w miejscach zapalnych, nad wystającymi kośćmi. Przerwać przy ostrym bólu lub mrowieniu."
    }
  },
  implementationPrinciples: {
    title: "Zasady wdrażania ćwiczeń do planu biegowego",
    bySkillLevel: {
      title: "Rekomendacje dla różnych poziomów zaawansowania",
      beginner: "Niska intensywność, opanowanie wzorców ruchowych, budowanie siły i stabilności. Krótsze czasy, mniej powtórzeń, stopniowe zwiększanie. Głównie ciężar ciała i mini bandy.",
      intermediate: "Bardziej wymagające ćwiczenia (hantle, TRX, kettlebell). Zwiększona objętość i intensywność. Więcej dynamicznej mobilności i stabilizacji.",
      advanced: "Złożone ćwiczenia, większe obciążenia. Utrzymanie siły, stabilności, mobilności przy stopniowym zwiększaniu objętości i intensywności biegania. Ćwiczenia specyficzne dla biegania i plyometryczne (gdy regeneracja pozwoli)."
    },
    byTargetDistance: {
      title: "Wskazania w zależności od dystansu docelowego",
      "5km_10km": "Budowanie siły i mocy w dolnej części ciała i tułowiu (szybkość, efektywność). Ćwiczenia wspierające szybszą kadencję i absorpcję wstrząsów.",
      halfMarathon_Marathon: "Wytrzymałość mięśni wspierających. Stabilność tułowia, ćwiczenia zapobiegające zmęczeniu posturalnemu i utrzymujące biomechanikę."
    },
    byTrainingPhase: {
      title: "Integracja ćwiczeń w poszczególnych fazach planu",
      basePeriod: "Budowanie fundamentów siły, stabilności, mobilności. Większa objętość ćwiczeń korekcyjnych (słabości, nierównowaga).",
      buildPeriod: "Utrzymanie siły i stabilności przy wzroście objętości/intensywności biegania. Dostosowanie objętości/intensywności ćwiczeń korekcyjnych.",
      peakPeriod: "Zmniejszenie objętości treningu siłowego (utrzymanie kondycji bez zmęczenia). Fokus na mobilności i regeneracji (świeżość na zawody).",
      recoveryPeriod: "Ćwiczenia o niskiej intensywności (mobilność, rozciąganie, automasaż) dla regeneracji i adresowania bólów/sztywności."
    },
    frequencyByType: {
      title: "Jak często wykonywać ćwiczenia danego typu",
      mobility: "Codziennie lub większość dni tygodnia.",
      stretching: "Po biegach/treningach lub jako oddzielna sesja kilka razy w tygodniu. Dynamiczne przed biegami.",
      strength: "2-3 razy w tygodniu (odpowiednia regeneracja). Dostosować do fazy i regeneracji.",
      stabilization: "2-3 razy w tygodniu (często łączone z siłowym).",
      selfRelaxation: "Codziennie lub w razie potrzeby, szczególnie po biegach lub przy napięciu mięśni."
    },
    conclusion: "Konsekwencja jest kluczowa. Regularna rutyna przyniesie najlepsze rezultaty w zapobieganiu urazom i poprawie wydajności."
    // Example weekly layout is too specific for a general knowledge base, but principles are covered.
  },
  adaptationAndModification: {
    title: "Adaptacja i modyfikacja",
    painOrRecurrence: {
      title: "Co robić w przypadku bólu lub nawrotu kontuzji",
      action: "Natychmiast przerwać aktywność wywołującą dolegliwości. Unikać forsowania. Powrót do wcześniejszych, mniej obciążających etapów lub zmniejszenie intensywności/objętości. Możliwy dodatkowy dzień przerwy.",
      monitoring: "Monitorować reakcję organizmu. Jeśli ból nie ustępuje w ciągu 24h lub nasila się, konsultacja z fizjoterapeutą/lekarzem."
    },
    progressionsAndRegressions: {
      title: "Progresje i regresje ćwiczeń",
      progression: "Stopniowe zwiększanie trudności w miarę poprawy. Może obejmować: więcej powtórzeń/serii, dłuższy czas, większe obciążenie, mniejsza stabilność podłoża, bardziej zaawansowane ćwiczenia.",
      regression: "Zmniejszenie trudności przy pogorszeniu samopoczucia, bólu, nawrocie kontuzji. Może obejmować: mniej powtórzeń/serii, krótszy czas, mniejsze obciążenie, większa stabilność, prostsze warianty."
    },
    overloadSignals: {
      title: "Sygnalizatory przeciążenia i kiedy skonsultować się z fizjoterapeutą",
      signals: [
        "Nasilający się ból podczas lub po ćwiczeniach.",
        "Ból utrzymujący się >24h po treningu.",
        "Obrzęk lub zaczerwienienie w okolicy kontuzji.",
        "Ograniczenie zakresu ruchu.",
        "Uczucie sztywności.",
        "Pogorszenie wyników treningowych.",
        "Nawracające kontuzje."
      ],
      action: "Zmniejszyć intensywność i objętość treningu, skonsultować się z fizjoterapeutą.",
      physioRole: "Ocena stanu, identyfikacja przyczyn, dostosowanie planu rehabilitacji. Regularne konsultacje ważne, szczególnie na początku powrotu i przy niepokojących objawach."
    }
  },
  summary: {
    mainMessage: "Wdrożenie ćwiczeń korekcyjnych to nieodłączny element skutecznego powrotu do biegania po kontuzji. Kluczowy jest indywidualnie dostosowany program (wzmocnienie, stabilizacja, mobilność, elastyczność, autorelaksacja) dla bezpiecznego powrotu i minimalizacji ryzyka nawrotów. Monitorowanie organizmu, adaptacja planu i konsultacje z fizjoterapeutą są istotne."
  }
};

// Aby użyć tej bazy:
// const kb = correctiveExercisesKnowledgeBase;
// console.log(kb.exerciseSections.strengthAndActivation.areas.hipsAndGlutes.exercises[0].name);
