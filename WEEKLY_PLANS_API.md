# 📅 API Planów Tygodniowych - Dokumentacja dla Front-end

## 🎯 Przegląd

System planów tygodniowych automatycznie generuje i dostarcza spersonalizowane plany treningowe co tydzień. Użytkownicy mogą również ręcznie wygenerować nowe plany i przeglądać historię.

---

## 🔐 Autoryzacja

**Wszystkie endpointy wymagają tokenu Bearer w nagłówku:**
```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

---

## 📡 Główne Endpointy

### 1. 🆕 **Wygeneruj nowy plan tygodniowy**

```http
POST /api/weekly-schedule/manual-delivery
```

**Użycie:** Generuje nowy plan tygodniowy dla użytkownika (poza harmonogramem)

**Przykład żądania:**
```javascript
const generateWeeklyPlan = async () => {
  try {
    const response = await fetch('/api/weekly-schedule/manual-delivery', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      const plan = data.data.plan;
      console.log('Nowy plan:', plan);
      return plan;
    }
  } catch (error) {
    console.error('Błąd generowania planu:', error);
  }
};
```

**Odpowiedź (sukces):**
```json
{
  "status": "success",
  "data": {
    "plan": {
      "id": "weekly_5_1698765432",
      "planType": "weekly",
      "weekNumber": 5,
      "metadata": {
        "discipline": "bieganie",
        "target_goal": "zaczac_biegac",
        "level_hint": "początkujący",
        "days_per_week": "3",
        "duration_weeks": 1,
        "phase": "base"
      },
      "plan_weeks": [
        {
          "week_num": 5,
          "focus": "Budowanie podstawowej wytrzymałości",
          "days": [
            {
              "day_of_week": "Poniedziałek",
              "type": "bieg",
              "description": "Trening biegowo-marszowy",
              "duration_minutes": 28,
              "distance_km": 2.0,
              "intensity_zone": "Łatwa (strefa 2)",
              "notes": "Rozgrzewka: 5 min marszu..."
            }
          ]
        }
      ],
      "corrective_exercises": {
        "frequency": "daily",
        "list": [
          {
            "name": "Plank (deska)",
            "description": "Wzmacnia mięśnie głębokie brzucha",
            "sets": 3,
            "duration": 30
          }
        ]
      },
      "notes": [
        "Słuchaj swojego ciała...",
        "Konsekwencja jest kluczem..."
      ]
    },
    "message": "Plan został wygenerowany ręcznie"
  }
}
```

---

### 2. 📚 **Historia planów tygodniowych**

```http
GET /api/weekly-schedule/history?limit=10&offset=0
```

**Parametry query:**
- `limit` (opcjonalny): Liczba planów do pobrania (domyślnie: 10)
- `offset` (opcjonalny): Przesunięcie dla paginacji (domyślnie: 0)

**Przykład żądania:**
```javascript
const getWeeklyPlansHistory = async (limit = 10, offset = 0) => {
  try {
    const response = await fetch(
      `/api/weekly-schedule/history?limit=${limit}&offset=${offset}`, 
      {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    
    if (data.status === 'success') {
      return data.data.history;
    }
  } catch (error) {
    console.error('Błąd pobierania historii:', error);
  }
};
```

**Odpowiedź:**
```json
{
  "status": "success",
  "data": {
    "history": [
      {
        "id": "weekly_4_1698765000",
        "weekNumber": 4,
        "planType": "weekly",
        "createdAt": "2023-10-31T10:00:00.000Z",
        "metadata": { ... },
        "plan_weeks": [ ... ]
      },
      {
        "id": "weekly_3_1698651600",
        "weekNumber": 3,
        "planType": "weekly",
        "createdAt": "2023-10-24T10:00:00.000Z",
        "metadata": { ... },
        "plan_weeks": [ ... ]
      }
    ],
    "pagination": {
      "limit": 10,
      "offset": 0,
      "total": 2
    }
  }
}
```

---

### 3. ⚙️ **Harmonogram dostarczania**

```http
GET /api/weekly-schedule
```

**Użycie:** Pobiera informacje o harmonogramie dostarczania planów (zawiera dane o aktualnym tygodniu)

**Przykład żądania:**
```javascript
const getWeeklySchedule = async () => {
  try {
    const response = await fetch('/api/weekly-schedule', {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      const schedule = data.data.schedule;
      console.log('Aktualny tydzień:', schedule.currentWeek);
      console.log('Następna dostawa:', schedule.nextDeliveryDate);
      return schedule;
    }
  } catch (error) {
    console.error('Błąd pobierania harmonogramu:', error);
  }
};
```

---

### 4. 📊 **Aktualizacja postępu**

```http
POST /api/weekly-schedule/progress
```

**Użycie:** Aktualizuje postęp wykonania planu tygodniowego

**Przykład żądania:**
```javascript
const updateWeeklyProgress = async (weekNumber, progressData) => {
  try {
    const response = await fetch('/api/weekly-schedule/progress', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        weekNumber: weekNumber,
        progressData: {
          completed: true,
          completionRate: 0.85,
          completedDistance: 22.5,
          feedback: "Tydzień przebiegł bardzo dobrze"
        }
      })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Błąd aktualizacji postępu:', error);
  }
};
```

---

## 🏗️ **Komponenty React - Przykłady implementacji**

### Hook do zarządzania planami tygodniowymi

```javascript
// useWeeklyPlans.js
import { useState, useEffect } from 'react';

export const useWeeklyPlans = (userToken) => {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [planHistory, setPlanHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateNewPlan = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/weekly-schedule/manual-delivery', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setCurrentPlan(data.data.plan);
        return data.data.plan;
      } else {
        throw new Error(data.error || 'Błąd generowania planu');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlanHistory = async (limit = 10, offset = 0) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(
        `/api/weekly-schedule/history?limit=${limit}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setPlanHistory(data.data.history);
        return data.data.history;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentPlan,
    planHistory,
    isLoading,
    error,
    generateNewPlan,
    loadPlanHistory
  };
};
```

### Komponent wyświetlający plan tygodniowy

```javascript
// WeeklyPlanCard.jsx
import React from 'react';

const WeeklyPlanCard = ({ plan }) => {
  if (!plan) return null;

  return (
    <div className="weekly-plan-card">
      <div className="plan-header">
        <h2>Plan Tygodniowy - Tydzień {plan.weekNumber}</h2>
        <span className="plan-phase">{plan.metadata.phase}</span>
      </div>

      {plan.plan_weeks.map((week) => (
        <div key={week.week_num} className="week-content">
          <h3>Focus: {week.focus}</h3>
          
          <div className="training-days">
            {week.days.map((day, index) => (
              <div key={index} className="training-day">
                <div className="day-header">
                  <h4>{day.day_of_week}</h4>
                  <span className="intensity">{day.intensity_zone}</span>
                </div>
                
                <div className="day-details">
                  <p><strong>Opis:</strong> {day.description}</p>
                  <p><strong>Czas:</strong> {day.duration_minutes} min</p>
                  {day.distance_km && (
                    <p><strong>Dystans:</strong> {day.distance_km} km</p>
                  )}
                  {day.notes && (
                    <div className="notes">
                      <strong>Uwagi:</strong>
                      <p>{day.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {plan.corrective_exercises && plan.corrective_exercises.list.length > 0 && (
        <div className="corrective-exercises">
          <h3>Ćwiczenia korekcyjne ({plan.corrective_exercises.frequency})</h3>
          <ul>
            {plan.corrective_exercises.list.map((exercise, index) => (
              <li key={index}>
                <strong>{exercise.name}:</strong> {exercise.description}
                <br />
                <small>
                  {exercise.sets} serie
                  {exercise.reps && ` × ${exercise.reps} powtórzeń`}
                  {exercise.duration && ` × ${exercise.duration}s`}
                </small>
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.notes && plan.notes.length > 0 && (
        <div className="plan-notes">
          <h3>Uwagi i wskazówki</h3>
          <ul>
            {plan.notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WeeklyPlanCard;
```

### Główny komponent aplikacji

```javascript
// WeeklyPlanView.jsx
import React, { useState, useEffect } from 'react';
import { useWeeklyPlans } from './useWeeklyPlans';
import WeeklyPlanCard from './WeeklyPlanCard';

const WeeklyPlanView = ({ userToken }) => {
  const {
    currentPlan,
    planHistory,
    isLoading,
    error,
    generateNewPlan,
    loadPlanHistory
  } = useWeeklyPlans(userToken);

  const [activeTab, setActiveTab] = useState('current');

  useEffect(() => {
    loadPlanHistory();
  }, []);

  const handleGenerateNewPlan = async () => {
    try {
      await generateNewPlan();
      // Opcjonalnie: pokaż notyfikację o sukcesie
    } catch (error) {
      // Opcjonalnie: pokaż notyfikację o błędzie
    }
  };

  return (
    <div className="weekly-plan-view">
      <div className="plan-tabs">
        <button 
          className={activeTab === 'current' ? 'active' : ''}
          onClick={() => setActiveTab('current')}
        >
          Aktualny Plan
        </button>
        <button 
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          Historia Planów
        </button>
      </div>

      {error && (
        <div className="error-message">
          Błąd: {error}
        </div>
      )}

      {isLoading && (
        <div className="loading">
          Ładowanie...
        </div>
      )}

      {activeTab === 'current' && (
        <div className="current-plan-tab">
          <div className="plan-actions">
            <button 
              onClick={handleGenerateNewPlan}
              disabled={isLoading}
            >
              Wygeneruj Nowy Plan
            </button>
          </div>
          
          {currentPlan ? (
            <WeeklyPlanCard plan={currentPlan} />
          ) : (
            <p>Brak aktualnego planu. Wygeneruj nowy plan aby rozpocząć.</p>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="history-tab">
          {planHistory.length > 0 ? (
            planHistory.map((plan) => (
              <WeeklyPlanCard key={plan.id} plan={plan} />
            ))
          ) : (
            <p>Brak historii planów.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default WeeklyPlanView;
```

---

## 🚨 **Obsługa błędów**

### Typowe kody odpowiedzi:
- **200** - Sukces
- **400** - Błędne dane wejściowe
- **401** - Brak autoryzacji / nieprawidłowy token
- **404** - Nie znaleziono harmonogramu
- **500** - Błąd serwera

### Przykład obsługi błędów:
```javascript
const handleApiCall = async (apiCall) => {
  try {
    const response = await apiCall();
    return response;
  } catch (error) {
    if (error.status === 401) {
      // Przekieruj do logowania
      window.location.href = '/login';
    } else if (error.status === 404) {
      // Pokaż komunikat o braku danych
      console.log('Brak danych do wyświetlenia');
    } else {
      // Ogólny błąd
      console.error('Wystąpił błąd:', error.message);
    }
  }
};
```

---

## 💡 **Best Practices**

1. **Cache'owanie**: Przechowuj plany w state/context aby uniknąć niepotrzebnych zapytań
2. **Loading states**: Zawsze pokazuj użytkownikowi stan ładowania
3. **Error handling**: Obsługuj wszystkie możliwe błędy gracefully
4. **Pagination**: Używaj paginacji dla historii planów
5. **Offline support**: Rozważ zapisywanie planów lokalnie dla dostępu offline

---

## 🔗 **Powiązane endpointy**

- `GET /api/weekly-schedule` - Harmonogram dostarczania
- `PUT /api/weekly-schedule` - Aktualizacja harmonogramu  
- `POST /api/weekly-schedule/pause` - Wstrzymanie harmonogramu
- `POST /api/weekly-schedule/resume` - Wznowienie harmonogramu

---

**Ostatnia aktualizacja:** `{current_date}`  
**Wersja API:** `v1` 