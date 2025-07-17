# ZADANIE: Implementacja Frontend Systemu Powiadomień dla RunFitting

## KONTEKST PROJEKTU

Jesteś frontend developerem pracującym nad aplikacją RunFitting - platformą treningową dla biegaczy. Backend API dla systemu powiadomień został już zaimplementowany i zawiera następujące endpointy:

### DOSTĘPNE BACKEND API ENDPOINTS: 

# 🚀 Implementacja Natychmiastowej Generacji Planu po Ocenie

## 📋 Kontekst

W ramach usprawnienia procesu developmentu, potrzebujemy możliwości natychmiastowej generacji nowego planu treningowego po ocenie bieżącego tygodnia. Backend został już zaktualizowany, aby obsługiwać tę funkcjonalność.

## 🎯 Cel

Zmodyfikować frontend tak, aby po ocenie tygodnia automatycznie otrzymywać i wyświetlać nowy plan treningowy, bez czekania na standardowy harmonogram generacji.

## 🔄 Zmiany w API

### Endpoint oceny tygodnia zwraca teraz dodatkowe dane:

```typescript
// POST /api/weekly-schedule/progress
// Response:
{
  status: 'success',
  data: {
    schedule: WeeklySchedule,
    newPlan?: WeeklyPlan, // Nowy plan, jeśli został wygenerowany
    message: string // Informacja o statusie operacji
  }
}
```

## 📦 Wymagane Zmiany w Store (Vuex)

```typescript
// State
interface WeeklyScheduleState {
  currentWeeklyPlan: WeeklyPlan | null;
  weeklyPlansHistory: WeeklyPlan[];
  pendingProgressReview: string | null;
  // ... istniejące pola
}

// Mutations
{
  SET_CURRENT_PLAN(state, plan: WeeklyPlan): void;
  ADD_TO_HISTORY(state, plan: WeeklyPlan): void;
  CLEAR_PENDING_REVIEW(state): void;
}

// Actions
{
  async setCurrentPlan({ commit }, plan: WeeklyPlan): Promise<void>;
}
```

## 🖥️ Komponenty do Modyfikacji

### 1. WeeklyProgressForm

```vue
<template>
  <form @submit.prevent="submitProgress">
    <!-- Istniejące pola formularza -->
    <button 
      type="submit" 
      :disabled="submitting"
    >
      {{ submitting ? 'Zapisywanie...' : '💾 Zapisz ocenę' }}
    </button>
  </form>
</template>

<script>
export default {
  name: 'WeeklyProgressForm',
  props: {
    weekId: String
  },
  data() {
    return {
      submitting: false,
      progress: {
        completionRate: 80,
        difficultyLevel: 5,
        injuries: false,
        injuryDescription: '',
        feedback: '',
        nextWeekPreference: 'same'
      }
    }
  },
  methods: {
    async submitProgress() {
      this.submitting = true;
      try {
        const response = await this.$api.post('/api/weekly-schedule/progress', {
          weekId: this.weekId,
          weeklyData: this.progress
        });

        if (response.data.data.newPlan) {
          await this.$store.dispatch('weeklySchedule/setCurrentPlan', response.data.data.newPlan);
          this.$toast.success('Ocena zapisana i wygenerowano nowy plan!');
        } else {
          this.$toast.success('Ocena zapisana pomyślnie!');
        }

        this.$router.push('/weekly-dashboard');
      } catch (error) {
        this.$toast.error('Wystąpił błąd podczas zapisywania oceny');
        console.error('Błąd:', error);
      } finally {
        this.submitting = false;
      }
    }
  }
}
</script>
```

### 2. WeeklyDashboard

```vue
<template>
  <div class="weekly-dashboard">
    <!-- Current Plan Card -->
    <div v-if="currentPlan" class="current-plan-card">
      <div class="plan-header">
        <h3>Aktualny Plan - Tydzień {{ currentPlan.weekNumber }}</h3>
        <span class="phase-badge" :class="currentPlan.metadata.trainingPhase">
          {{ phaseLabels[currentPlan.metadata.trainingPhase] }}
        </span>
      </div>
      
      <!-- ... reszta template ... -->
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <h3>⚡ Szybkie Akcje</h3>
      <div class="action-buttons">
        <button 
          @click="generateManualPlan" 
          class="action-btn"
          :disabled="loading"
        >
          {{ loading ? 'Generowanie...' : '🚀 Wygeneruj następny plan' }}
        </button>
        <!-- ... inne akcje ... -->
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  name: 'WeeklyDashboard',
  computed: {
    ...mapState('weeklySchedule', [
      'currentWeeklyPlan',
      'loading',
      'error'
    ])
  },
  methods: {
    ...mapActions('weeklySchedule', [
      'generateManualPlan'
    ])
  }
}
</script>
```

## 🎨 Style

```scss
// Dodaj style dla stanu ładowania
.action-btn {
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.loading-spinner {
  display: inline-block;
  margin-right: 8px;
  animation: spin 1s infinite linear;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

## ✅ Kryteria Akceptacji

1. Po ocenie tygodnia, nowy plan jest automatycznie generowany i wyświetlany
2. Użytkownik otrzymuje wyraźne powiadomienie o wygenerowaniu nowego planu
3. Historia planów jest odpowiednio aktualizowana
4. UI pokazuje stany ładowania podczas generacji planu
5. Obsługa błędów jest zaimplementowana i komunikaty są przyjazne dla użytkownika
6. Przyciski są odpowiednio dezaktywowane podczas operacji asynchronicznych

## 🔍 Uwagi Implementacyjne

1. Używaj TypeScript dla lepszej kontroli typów
2. Implementuj obsługę błędów na każdym poziomie (komponent, akcje, API)
3. Dodaj odpowiednie komentarze w kodzie
4. Zachowaj istniejące funkcjonalności i style
5. Testuj edge cases (np. brak połączenia, błędy API)

## 🧪 Scenariusze Testowe

1. Pomyślna ocena i generacja nowego planu
2. Ocena bez generacji nowego planu (przypadek błędu)
3. Ręczna generacja planu z dashboardu
4. Zachowanie podczas problemów z połączeniem
5. Obsługa wielu szybkich kliknięć (debounce/throttle)

## 📚 Przydatne Zasoby

- [Vue.js Documentation](https://vuejs.org/)
- [Vuex Documentation](https://vuex.vuejs.org/)
- [Vue Router Documentation](https://router.vuejs.org/)
- [Vue Toast Notification](https://github.com/ankurk91/vue-toast-notification)

## 🚫 Znane Ograniczenia

1. Generacja nowego planu może zająć kilka sekund
2. Plan może być generowany tylko po pełnej ocenie poprzedniego
3. Należy zachować wszystkie istniejące walidacje i ograniczenia biznesowe 