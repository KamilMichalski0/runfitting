# 📊 Analiza Generowania Planów Treningowych w ZnanyTrener.AI

## 🔍 Przegląd Systemu

System ZnanyTrener.AI wykorzystuje zaawansowany mechanizm generowania planów treningowych oparty na Google Gemini AI z fallback'iem na OpenAI. Cały proces jest sterowany przez dane użytkownika zbierane z formularza oraz dynamicznie aktualizowaną progresję treningową.

---

## 🏗️ Architektura Systemu

### Główne Komponenty:
1. **GeminiService** (`src/services/gemini.service.js`) - Główny silnik AI
2. **WeeklyPlanDeliveryService** (`src/services/weekly-plan-delivery.service.js`) - Logika dostaw
3. **WeeklyPlanSchedule Model** (`src/models/weekly-plan-schedule.model.js`) - Model danych
4. **TrainingPlanController** (`src/controllers/training-plan.controller.js`) - Kontroler formularza
5. **Running Knowledge Base** (`src/knowledge/running-knowledge-base.js`) - Baza wiedzy

---

## 📋 Źródła Danych dla Generowania Planów

### 1. **Główna Metoda Generowania**
- **Plik**: `src/services/gemini.service.js`
- **Metoda**: `generateWeeklyTrainingPlan(weeklyData)`
- **AI Engine**: Google Gemini API (model: gemini-1.5-flash)
- **Fallback**: OpenAI GPT-4 w przypadku problemów z Gemini
- **Retry Logic**: Maksymalnie 3 próby z eksponencjalnym backoff'em

### 2. **Struktura Danych Wejściowych (`weeklyData`)**

#### **A. Profil Użytkownika** (`userProfile`)

**Źródło**: Mapowane z formularza w `mapFormToUserProfile()` (`training-plan.controller.js:1051`)

```javascript
{
  // === DANE PODSTAWOWE ===
  name: String,                    // Z: imieNazwisko || name || 'Biegacz'
  age: Number,                     // Z: wiek || age || 30
  level: String,                   // Z: poziomZaawansowania (mapowane przez mapExperienceLevel())
  goal: String,                    // Z: glownyCel || goal || 'poprawa_kondycji'
  
  // === PARAMETRY TRENINGOWE ===
  daysPerWeek: Number,             // Z: dniTreningowe.length || daysPerWeek || 3
  weeklyDistance: Number,          // Z: aktualnyKilometrTygodniowy || weeklyDistance || 20
  availableTime: Number,           // Z: czasTreningu || 60 (minuty na trening)
  trainingDays: Array,             // Z: dniTreningowe || ['monday', 'wednesday', 'friday']
  preferredTrainingTime: String,   // Z: preferowanyCzasTreningu || 'rano'
  
  // === DANE ZDROWOTNE ===
  hasInjuries: Boolean,            // Z: kontuzje || hasInjuries || false
  restingHeartRate: Number,        // Z: restingHr || heartRate
  maxHeartRate: Number,            // Z: maxHr
  vo2max: Number,                  // Z: vo2max
  
  // === DODATKOWE ===
  targetDistance: String,          // Z: dystansDocelowy
  description: String              // Z: opisCelu || description || ''
}
```

**Mapowanie poziomów zaawansowania** (`mapExperienceLevel()` - linia 1076):
- `'beginner'` → `'początkujący'`
- `'intermediate'` → `'średnio-zaawansowany'`
- `'advanced'` → `'zaawansowany'`

#### **B. Kontekst Progresji** (`progressTracking`)

**Źródło**: Model `WeeklyPlanSchedule` (`weekly-plan-schedule.model.js:100-122`)

```javascript
{
  // === PROGRESJA NUMERYCZNA ===
  weekNumber: Number,              // Aktualny tydzień (auto-increment)
  totalWeeksDelivered: Number,     // Łączna liczba dostarczonych tygodni
  
  // === FAZA TRENINGOWA ===
  currentPhase: String,            // 'base' | 'build' | 'peak' | 'recovery'
  // Zmiana fazy: co 4-6 tygodni (auto-rotation w updateProgress())
  
  // === ADAPTACJA DYSTANSU ===
  lastWeeklyDistance: Number,      // Dystans z ostatniego tygodnia
  progressionRate: Number          // Tempo progresji (domyślnie 1.05 = 5% wzrost)
  // Adaptacja na podstawie realizacji:
  // - >80% realizacji: +0.01 do progressionRate (max 1.1)
  // - <60% realizacji: -0.02 do progressionRate (min 0.95)
}
```

**Ustawianie wartości początkowych**:
- **Nowy harmonogram**: `weekNumber: 1`, `currentPhase: 'base'`, `totalWeeksDelivered: 0`
- **Lokalizacja**: `weekly-schedule.controller.js:707`, `weekly-plan-delivery.service.js:366`

**Automatyczna progresja faz** (`weekly-plan-schedule.model.js:260-264`):
```javascript
// Rotacja faz co określoną liczbę tygodni
if (this.progressTracking.weekNumber % weeksInPhase === 0) {
  const phases = ['base', 'build', 'peak', 'recovery'];
  const currentIndex = phases.indexOf(this.progressTracking.currentPhase);
  this.progressTracking.currentPhase = phases[(currentIndex + 1) % phases.length];
}
```

#### **C. Cel Długoterminowy** (`longTermGoal`)

**Źródło**: Mapowane z formularza w `mapFormToLongTermGoal()` (`training-plan.controller.js:1094`)

```javascript
{
  // === WYDARZENIE DOCELOWE ===
  targetEvent: String,             // Z: "Zawody " + dystansDocelowy (jeśli != 'inny')
  targetDate: Date,                // Z: raceDate || +12 tygodni od dziś
  remainingWeeks: Number,          // Obliczone: różnica w tygodniach do targetDate
  
  // === CEL CZASOWY ===
  targetTime: String               // Mapowane z rekordów osobistych:
  // - dystansDocelowy === '5km' → mapPersonalRecordToTime(rekord5km, '5km')
  // - dystansDocelowy === '10km' → mapPersonalRecordToTime(rekord10km, '10km')
  // - dystansDocelowy === 'polmaraton' → mapPersonalRecordToTime(rekordPolmaraton, 'polmaraton')
  // - dystansDocelowy === 'maraton' → mapPersonalRecordToTime(rekordMaraton, 'maraton')
}
```

**Logika obliczania remainingWeeks** (linia 1119-1128):
```javascript
if (longTermGoal.targetDate) {
  const now = new Date();
  const diffTime = longTermGoal.targetDate - now;
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  longTermGoal.remainingWeeks = diffWeeks > 0 ? diffWeeks : 12;
} else {
  longTermGoal.remainingWeeks = 12; // Domyślnie 12 tygodni
  longTermGoal.targetDate = new Date(Date.now() + (12 * 7 * 24 * 60 * 60 * 1000));
}
```

#### **D. Analiza Wydajności** (`recentPerformance`)

**Źródło**: `analyzeRecentPerformance()` (`weekly-plan-delivery.service.js:517`)

```javascript
{
  averageCompletion: Number,       // Średnia realizacja (0-1)
  trend: String,                   // 'improving' | 'stable' | 'declining'
  recommendation: String           // 'increase' | 'maintain' | 'decrease'
}
```

**Algorytm analizy**:
```javascript
analyzeRecentPerformance(recentPlans) {
  if (!recentPlans || recentPlans.length === 0) {
    return {
      averageCompletion: 0.5,
      trend: 'stable',
      recommendation: 'maintain'
    };
  }

  const completed = recentPlans.filter(plan => plan && plan.wasCompleted);
  const averageCompletion = completed.length / recentPlans.length;
  
  // Logika określania trendu i rekomendacji na podstawie averageCompletion
  // i porównania z poprzednimi okresami
}
```

#### **E. Ustawienia Adaptacji** (`adaptationSettings`)

**Źródło**: Model `WeeklyPlanSchedule` (`weekly-plan-schedule.model.js:133-146`)

```javascript
{
  allowAutoAdjustments: Boolean,   // Domyślnie: true
  maxWeeklyIncrease: Number,       // Domyślnie: 0.1 (10% wzrost maksymalnie)
  minRecoveryWeeks: Number         // Domyślnie: 4 (co 4 tygodnie regeneracja)
}
```

### 3. **Baza Wiedzy** (`running-knowledge-base.js`)

#### **A. Dystanse i Charakterystyki**
```javascript
distances: {
  '5k': {
    description: '5 kilometer race',
    focus: ['speed endurance', 'VO2max', 'lactate threshold'],
    keyTrainingTypes: ['interval training', 'tempo runs', 'easy runs'],
    typicalPlanLength: { beginner: '6-12 weeks', intermediate: '6-10 weeks', advanced: '6-16 weeks' },
    tapering: { duration: '7-10 days', volumeReduction: '20-50%' },
    trainingEmphasis: {
      beginner: ['building base mileage', 'developing running form', 'gradual progression'],
      intermediate: ['speed development', 'lactate threshold improvement', 'race-specific workouts'],
      advanced: ['VO2max optimization', 'race pace simulation', 'advanced interval training']
    }
  },
  // Podobnie dla '10k', 'half-marathon', 'marathon'
}
```

#### **B. Typy Treningów**
```javascript
trainingTypes: {
  easy_run: {
    description: 'Łagodny bieg w tempie konwersacyjnym',
    intensity: 'low',
    heartRateZone: 'Zone 1-2',
    keyBenefits: ['aerobic base building', 'recovery', 'fat burning'],
    // ... więcej szczegółów
  },
  interval_training: {
    description: 'Trening interwałowy z okresami wysiłku i odpoczynku',
    intensity: 'high',
    heartRateZone: 'Zone 4-5',
    // ... szczegóły interwałów
  }
  // ... inne typy treningów
}
```

#### **C. Fazy Treningowe**
```javascript
trainingPhases: {
  base: {
    description: 'Budowanie bazy aerobowej',
    duration: '4-8 weeks',
    focus: ['aerobic development', 'injury prevention', 'gradual volume increase'],
    intensityDistribution: { easy: 80, moderate: 15, hard: 5 }
  },
  build: {
    description: 'Rozwój specjalistyczny',
    duration: '4-6 weeks', 
    focus: ['lactate threshold', 'VO2max improvement', 'race-specific training'],
    intensityDistribution: { easy: 70, moderate: 20, hard: 10 }
  }
  // ... peak, recovery
}
```

---

## 🤖 Proces Generowania Planu

### 1. **Przygotowanie Prompt'u** (`prepareWeeklyPlanPrompt()`)

**Lokalizacja**: `gemini.service.js:1854`

```javascript
prepareWeeklyPlanPrompt(weeklyData) {
  const contextInfo = this.buildWeeklyContext(weeklyData);
  
  return `Wygeneruj plan treningowy na ${weeklyData.deliveryFrequency === 'biweekly' ? '2 tygodnie' : '1 tydzień'} dla biegacza na podstawie poniższych danych:

${contextInfo}

WAŻNE WYMAGANIA:
1. To jest ${weeklyData.weekNumber} tydzień treningowy w ramach długoterminowej progresji
2. Aktualnie znajdujemy się w fazie: ${weeklyData.currentPhase}
3. Poprzednia realizacja planów: ${weeklyData.recentPerformance.averageCompletion * 100}%
4. Trend wydajności: ${weeklyData.recentPerformance.trend}
5. Rekomendacja progresji: ${weeklyData.recentPerformance.recommendation}

DOSTOSOWANIA:
- Jeśli realizacja była niska (<60%), zmniejsz intensywność i objętość
- Jeśli realizacja była wysoka (>80%), można delikatnie zwiększyć wyzwanie
- Uwzględnij fazę treningową: ${weeklyData.currentPhase}
- Tempo progresji: ${((weeklyData.progressionRate - 1) * 100).toFixed(1)}% tygodniowo

🚨🚨🚨 ULTIMATUM - ABSOLUTNY NAKAZ! 🚨🚨🚨
PRZECZYTAJ TO UWAŻNIE PRZED WYGENEROWANIEM PLANU:

1. Każdy dzień treningowy MUSI mieć INNY wzorzec interwałów
2. Każdy dzień treningowy MUSI mieć INNY czas trwania (duration_minutes)
3. Każdy dzień treningowy MUSI mieć INNY opis (description) - minimum 20 słów
4. Każdy dzień treningowy MUSI mieć INNY fokus (focus)
5. Każdy dzień treningowy MUSI mieć INNY typ treningu (type)

// ... przykłady poprawnego planu
`;
}
```

### 2. **Budowanie Kontekstu** (`buildWeeklyContext()`)

**Lokalizacja**: `gemini.service.js:1983`

```javascript
buildWeeklyContext(weeklyData) {
  let context = `PROFIL BIEGACZA:
- Imię: ${weeklyData.name}
- Wiek: ${weeklyData.age} lat
- Poziom: ${weeklyData.level}
- Cel: ${weeklyData.goal}
- Dni treningowe w tygodniu: ${weeklyData.daysPerWeek}
- Aktualny tygodniowy dystans: ${weeklyData.weeklyDistance} km
- Kontuzje: ${weeklyData.hasInjuries ? 'Tak' : 'Nie'}`;

  if (weeklyData.heartRate) {
    context += `\n- Tętno spoczynkowe: ${weeklyData.heartRate} bpm`;
  }

  context += `\n\nKONTEKST PROGRESJI:
- Tydzień numer: ${weeklyData.weekNumber}
- Łącznie dostarczonych tygodni: ${weeklyData.totalWeeksDelivered}
- Aktualna faza: ${weeklyData.currentPhase}
- Ostatni tygodniowy dystans: ${weeklyData.lastWeeklyDistance} km
- Tempo progresji: ${weeklyData.progressionRate}`;

  if (weeklyData.longTermGoal) {
    context += `\n\nCEL DŁUGOTERMINOWY:
- Wydarzenie: ${weeklyData.longTermGoal.targetEvent || 'Nie określono'}
- Data: ${weeklyData.longTermGoal.targetDate || 'Nie określono'}
- Docelowy czas: ${weeklyData.longTermGoal.targetTime || 'Nie określono'}`;
  }

  context += `\n\nWYDAJNOŚĆ Z OSTATNICH TYGODNI:
- Średnia realizacja: ${(weeklyData.recentPerformance.averageCompletion * 100).toFixed(1)}%
- Trend: ${weeklyData.recentPerformance.trend}
- Rekomendacja: ${weeklyData.recentPerformance.recommendation}`;

  return context;
}
```

### 3. **Wywołanie API Gemini**

**Konfiguracja**:
```javascript
// gemini.config.js
module.exports = {
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-1.5-flash',
  apiUrl: 'https://generativelanguage.googleapis.com',
  temperature: 0.7,
  topK: 40,
  topP: 0.9,
  maxTokens: 8192
};

// Request body
const requestBody = {
  contents: [{
    role: 'user',
    parts: [{ text: prompt }]
  }],
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.9,
    maxOutputTokens: 8192,
    responseMimeType: 'application/json'
  },
  safetySettings: [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
  ]
};
```

### 4. **Parsowanie Odpowiedzi** (`parseWeeklyPlanResponse()`)

**Lokalizacja**: `gemini.service.js:2029`

```javascript
parseWeeklyPlanResponse(response, weeklyData) {
  try {
    // Parsuj odpowiedź z Gemini API
    const planData = this._parseResponse(response.data);

    // Sprawdź różnorodność planu PRZED finalizacją
    if (planData.plan_weeks && planData.plan_weeks.length > 0) {
      const diversityResult = checkWeekDiversity(planData.plan_weeks[0]);
      
      if (!diversityResult.isAcceptable) {
        // Rzuć błąd który spowoduje retry całego procesu generowania
        throw new AppError('Generated plan is too monotonous, retrying...', 422);
      }
    }

    // Dodaj metadane specyficzne dla planu tygodniowego
    planData.planType = 'weekly';
    planData.weekNumber = weeklyData.weekNumber;
    planData.deliveryFrequency = weeklyData.deliveryFrequency;
    planData.generatedFor = {
      phase: weeklyData.currentPhase,
      progressionRate: weeklyData.progressionRate,
      recentPerformance: weeklyData.recentPerformance
    };

    return planData;
  } catch (error) {
    // Error handling i fallback logic
  }
}
```

### 5. **Kontrola Jakości** (`checkWeekDiversity()`)

**Lokalizacja**: `utils/plan-diversity-checker.js`

**Kryteria walidacji**:
- Różnorodność typów treningów
- Różne czasy trwania (duration_minutes)
- Różne opisy (minimum 20 słów każdy)
- Różne fokus dla każdego dnia
- Unikalne wzorce interwałów

### 6. **Personalizacja Stref Tętna** (`_applyPersonalizedHeartRateZones()`)

**Algorytm**:
- Formuła Karvonen: `HRR = MaxHR - RestingHR`
- Strefy tętna: Zone 1-5 na podstawie HRR
- Dostosowania do poziomu zaawansowania
- Uwzględnienie wieku i kondycji

### 7. **Retry Logic i Fallback**

```javascript
// Maksymalnie 3 próby z eksponencjalnym backoff'em
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    // Próba generowania przez Gemini
    const response = await this.axiosClient.post(requestUrl, requestBody, {
      timeout: 30000
    });
    
    const plan = await this.parseWeeklyPlanResponse(response, weeklyData);
    return this._applyPersonalizedHeartRateZones(plan, weeklyData.userData);
    
  } catch (geminiError) {
    if (attempt < maxRetries && this._isRetryableError(geminiError)) {
      const delay = baseDelay * Math.pow(2, attempt - 1); // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    
    // Jeśli wszystkie próby Gemini zawiodą, rzuć błąd
    throw new AppError(`Nie udało się wygenerować planu po ${maxRetries} próbach`, 500);
  }
}
```

---

## 🔄 Przepływ Danych

### Sekwencja Generowania Nowego Planu:

1. **Formularz użytkownika** → `saveForm()` (`training-plan.controller.js:248`)
   - `mapFormToUserProfile(formData)` → `userProfile`
   - `mapFormToLongTermGoal(formData)` → `longTermGoal`

2. **Utworzenie harmonogramu** → `createSchedule()` (`weekly-plan-delivery.service.js:27`)
   - Zapisanie `WeeklyPlanSchedule` z `userProfile`, `longTermGoal`, `adaptationSettings`
   - Ustawienie początkowych wartości `progressTracking`

3. **Generowanie pierwszego planu** → `generateManualPlan()` (`weekly-plan-delivery.service.js:140`)
   - `prepareWeeklyPlanDataWithWeek(schedule, 1)` → `weeklyData`
   - `analyzeRecentPerformance(schedule.recentPlans)` → `recentPerformance`

4. **Przekazanie do Gemini** → `generateWeeklyTrainingPlan(weeklyData)` (`gemini.service.js:1758`)
   - `buildWeeklyContext(weeklyData)` → kontekst dla AI
   - `prepareWeeklyPlanPrompt(weeklyData)` → pełny prompt

5. **Generowanie przez AI** → Gemini API call
   - JSON response z planem treningowym

6. **Walidacja i personalizacja**:
   - `checkWeekDiversity()` → kontrola różnorodności
   - `_applyPersonalizedHeartRateZones()` → personalizacja

7. **Zapisanie planu** → `TrainingPlan.save()`
   - Dodanie do `schedule.recentPlans`
   - Aktualizacja `progressTracking`

### Sekwencja Progresji (kolejne tygodnie):

1. **Cron job** → `deliverWeeklyPlans()` (co tydzień)
2. **Progresja numeru tygodnia** → `targetWeekNumber = currentWeek + 1`
3. **Aktualizacja progresji** → `updateProgress()` w modelu:
   - Adaptacja `progressionRate` na podstawie realizacji
   - Rotacja `currentPhase` co 4-6 tygodni
   - Aktualizacja `lastWeeklyDistance`
4. **Generowanie nowego planu** → z uwzględnieniem progresji
5. **Analiza wydajności** → na podstawie `recentPlans`

---

## 🎯 Kluczowe Mechanizmy Adaptacji

### 1. **Progresja Dystansu**
```javascript
// Bazowy dystans * progressionRate^(weekNumber-1)
const progressedDistance = weeklyData.weeklyDistance * Math.pow(weeklyData.progressionRate, weeklyData.weekNumber - 1);
```

### 2. **Adaptacja na Podstawie Realizacji**
```javascript
// W updateProgress() model
if (weeklyData.completionRate > 0.8) {
  // Wysoka realizacja - zwiększ tempo
  this.progressTracking.progressionRate = Math.min(1.1, this.progressTracking.progressionRate + 0.01);
} else if (weeklyData.completionRate < 0.6) {
  // Niska realizacja - zmniejsz tempo  
  this.progressTracking.progressionRate = Math.max(0.95, this.progressTracking.progressionRate - 0.02);
}
```

### 3. **Rotacja Faz Treningowych**
```javascript
// Co 4-6 tygodni zmiana fazy
const phases = ['base', 'build', 'peak', 'recovery'];
if (weekNumber % 4 === 0) {
  currentPhase = phases[(currentIndex + 1) % phases.length];
}
```

### 4. **Tygodnie Regeneracyjne**
```javascript
// Co minRecoveryWeeks (domyślnie 4) tydzień regeneracyjny
if (weekNumber % adaptationSettings.minRecoveryWeeks === 0) {
  // Zmniejszona intensywność i objętość
}
```

---

## 📊 Przykład Pełnego Przepływu Danych

### Dane Wejściowe (z formularza):
```javascript
const formData = {
  imieNazwisko: "Jan Kowalski",
  wiek: 35,
  poziomZaawansowania: "intermediate", 
  glownyCel: "poprawa_kondycji",
  dniTreningowe: ["monday", "wednesday", "friday"],
  aktualnyKilometrTygodniowy: 25,
  dystansDocelowy: "10km",
  restingHr: 60,
  maxHr: 185,
  kontuzje: false
};
```

### Przekształcenie w userProfile:
```javascript
const userProfile = {
  name: "Jan Kowalski",
  age: 35,
  level: "średnio-zaawansowany",
  goal: "poprawa_kondycji", 
  daysPerWeek: 3,
  weeklyDistance: 25,
  hasInjuries: false,
  restingHeartRate: 60,
  maxHeartRate: 185,
  targetDistance: "10km",
  trainingDays: ["monday", "wednesday", "friday"]
};
```

### Dane kontekstu dla AI (tydzień 3):
```javascript
const weeklyData = {
  // Z userProfile
  name: "Jan Kowalski",
  age: 35,
  level: "średnio-zaawansowany",
  // ... inne pola userProfile
  
  // Progresja (tydzień 3)
  weekNumber: 3,
  currentPhase: "base",
  totalWeeksDelivered: 2,
  lastWeeklyDistance: 26.25, // 25 * 1.05^2
  progressionRate: 1.05,
  
  // Cel długoterminowy
  longTermGoal: {
    targetEvent: "Zawody 10km",
    targetDate: "2024-06-15",
    remainingWeeks: 8
  },
  
  // Wydajność (na podstawie poprzednich planów)
  recentPerformance: {
    averageCompletion: 0.85,
    trend: "improving", 
    recommendation: "increase"
  }
};
```

### Prompt dla Gemini AI:
```
Wygeneruj plan treningowy na 1 tydzień dla biegacza na podstawie poniższych danych:

PROFIL BIEGACZA:
- Imię: Jan Kowalski
- Wiek: 35 lat
- Poziom: średnio-zaawansowany
- Cel: poprawa_kondycji
- Dni treningowe w tygodniu: 3
- Aktualny tygodniowy dystans: 25 km
- Kontuzje: Nie
- Tętno spoczynkowe: 60 bpm

KONTEKST PROGRESJI:
- Tydzień numer: 3
- Łącznie dostarczonych tygodni: 2
- Aktualna faza: base
- Ostatni tygodniowy dystans: 26.25 km
- Tempo progresji: 1.05

CEL DŁUGOTERMINOWY:
- Wydarzenie: Zawody 10km
- Data: 2024-06-15
- Docelowy czas: Nie określono

WYDAJNOŚĆ Z OSTATNICH TYGODNI:
- Średnia realizacja: 85.0%
- Trend: improving
- Rekomendacja: increase

WAŻNE WYMAGANIA:
1. To jest 3 tydzień treningowy w ramach długoterminowej progresji
2. Aktualnie znajdujemy się w fazie: base
3. Poprzednia realizacja planów: 85%
4. Trend wydajności: improving
5. Rekomendacja progresji: increase

DOSTOSOWANIA:
- Jeśli realizacja była niska (<60%), zmniejsz intensywność i objętość
- Jeśli realizacja była wysoka (>80%), można delikatnie zwiększyć wyzwanie
- Uwzględnij fazę treningową: base
- Tempo progresji: 5.0% tygodniowo

[... szczegółowe wymagania dotyczące różnorodności planu ...]
```

### Oczekiwana odpowiedź JSON:
```javascript
{
  "meta": {
    "target_goal": "poprawa_kondycji",
    "level_hint": "średnio-zaawansowany",
    "days_per_week": "3",
    "duration_weeks": 1
  },
  "plan_weeks": [{
    "week_number": 3,
    "focus": "Budowanie bazy aerobowej z wprowadzeniem tempa",
    "days": [
      {
        "day_name": "poniedziałek",
        "workout": {
          "type": "bieg interwałowy z krótkim wysiłkiem",
          "distance": 8,
          "duration_minutes": 35,
          "main_workout": "5x (2min bieg tempo/1min marsz)",
          "focus": "Adaptacja do rytmu i poprawa VO2",
          "description": "Krótkie interwały tempo przeplatane aktywnym odpoczynkiem...",
          "target_heart_rate": {
            "min": 150,
            "max": 165,
            "zone": "Zone 3"
          }
        }
      },
      // ... środa i piątek z różnymi treningami
    ]
  }],
  "notes": ["Pamiętaj o rozgrzewce", "Dostosuj tempo do samopoczucia"],
  "corrective_exercises": {
    "frequency": "2-3 razy w tygodniu",
    "list": [
      {
        "name": "Plank",
        "sets": 3,
        "duration": 45,
        "description": "Wzmacnia core i stabilizatory..."
      }
    ]
  }
}
```

---

## 🛠️ Pliki Konfiguracyjne i Środowisko

### Konfiguracja Gemini (`src/config/gemini.config.js`):
```javascript
module.exports = {
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  apiUrl: process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com',
  temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
  topK: parseInt(process.env.GEMINI_TOP_K) || 40,
  topP: parseFloat(process.env.GEMINI_TOP_P) || 0.9,
  maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 8192
};
```

### Zmienne Środowiskowe (.env):
```bash
# AI Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
GEMINI_TEMPERATURE=0.7
GEMINI_TOP_K=40
GEMINI_TOP_P=0.9
GEMINI_MAX_TOKENS=8192

# OpenAI Fallback
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.7

# Database
MONGODB_URI=mongodb://localhost:27017/runfitting

# Background Jobs
REDIS_URL=redis://localhost:6379
```

---

## 🧪 Testy i Walidacja

### Pliki testowe:
- `src/__tests__/services/gemini.service.test.js` - Testy serwisu Gemini
- `src/__tests__/services/weekly-plan-progression.test.js` - Testy progresji
- `src/__tests__/integration/weekly-plan-flow.test.js` - Testy integracyjne

### Przykład testu progresji:
```javascript
describe('Weekly Plan Progression', () => {
  test('should increment week number correctly', async () => {
    const schedule = await WeeklyPlanSchedule.create({
      userId: 'test-user',
      userProfile: mockUserProfile,
      progressTracking: { weekNumber: 1, currentPhase: 'base' }
    });
    
    await deliveryService.generateManualPlan(schedule._id);
    const updatedSchedule = await WeeklyPlanSchedule.findById(schedule._id);
    
    expect(updatedSchedule.progressTracking.weekNumber).toBe(2);
  });
});
```

---

## 📈 Metryki i Monitoring

### Logi systemu:
- Generowanie planów: `gemini.service.js` - szczegółowe logi każdego kroku
- Progresja: `weekly-plan-delivery.service.js` - tracking dostaw i progresji  
- Błędy: Centralne logowanie z `utils/logger.js`

### Kluczowe metryki:
- Czas generowania planu (średnio ~5-15 sekund)
- Sukces/porażka wywołań Gemini API  
- Różnorodność generowanych planów (diversity score)
- Realizacja planów przez użytkowników (completion rate)

---

## 🚀 Podsumowanie

System ZnanyTrener.AI implementuje zaawansowany mechanizm generowania planów treningowych, który:

1. **Zbiera dane** z szczegółowego formularza użytkownika
2. **Mapuje dane** na struktury zrozumiałe dla AI
3. **Śledzi progresję** użytkownika w czasie rzeczywistym
4. **Adaptuje plany** na podstawie realizacji i wydajności
5. **Wykorzystuje AI** (Gemini/OpenAI) do inteligentnego generowania
6. **Waliduje jakość** generowanych planów
7. **Personalizuje** strefy tętna i intensywność
8. **Dostarcza plany** automatycznie według harmonogramu

Całość jest wsparta rozbudowaną bazą wiedzy o bieganiu, systemem retry/fallback oraz mechanizmami zapewniającymi różnorodność i progresję treningową.

---

**Autor**: Analiza systemu ZnanyTrener.AI  
**Data**: $(date)  
**Wersja**: 1.0