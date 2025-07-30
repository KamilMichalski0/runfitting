# 🚀 Plan Migracji Front End - Plany Tygodniowe RunFitting

Dokument opisuje wszystkie zmiany jakie muszą zostać wprowadzone na front endzie po zmianie architektury z pełnych planów treningowych na system dostaw tygodniowych.

## 📋 Przegląd Zmian

System przechodzi z generowania **pełnych planów 6-24 tygodniowych** na **dostarczanie planów co tydzień**. 

**BEFORE:** Formularz → Manual Generate → Full Plan (6-24 weeks)
**AFTER:** Formularz → Auto Schedule + First Week → Weekly Delivery

---

## 🎯 Faza 1: KRYTYCZNE ZMIANY (Priorytet #1)

### 1.1 Aktualizacja response'u z `saveRunningForm`

#### ❌ STARY format response:
```json
{
  "status": "success",
  "data": {
    "formId": "507f1f77bcf86cd799439011",
    "message": "Formularz zgłoszeniowy zapisany pomyślnie."
  }
}
```

#### ✅ NOWY format response:
```json
{
  "status": "success",
  "data": {
    "formId": "507f1f77bcf86cd799439011",
    "scheduleId": "507f1f77bcf86cd799439012", 
    "firstPlanId": "507f1f77bcf86cd799439013",
    "message": "Formularz zapisany i system dostaw planów uruchomiony pomyślnie!",
    "schedule": {
      "deliveryFrequency": "weekly",
      "deliveryDay": "sunday",
      "deliveryTime": "18:00", 
      "nextDeliveryDate": "2024-01-14T18:00:00.000Z"
    },
    "firstPlan": {
      "weekNumber": 1,
      "planType": "weekly",
      "metadata": {
        "trainingPhase": "base",
        "description": "Tydzień bazowy - budowanie podstaw"
      }
    }
  }
}
```

#### ⚠️ NOWY status `partial_success`:
```json
{
  "status": "partial_success",
  "data": {
    "formId": "507f1f77bcf86cd799439011",
    "message": "Formularz zapisany, ale wystąpił problem z uruchomieniem automatycznych dostaw planów.",
    "error": "Weekly schedule creation failed"
  }
}
```

### 1.2 Zmiana logiki w komponencie formularza

```vue
<!-- RunningForm.vue -->
<script>
export default {
  methods: {
    async submitForm() {
      this.submitting = true;
      
      try {
        const response = await this.$api.post('/api/plans/form/save', this.formData);
        
        if (response.data.status === 'success') {
          // ✅ Mamy harmonogram + pierwszy plan
          this.$toast.success('Gotowe! Wygenerowany pierwszy plan tygodniowy.');
          
          // Zapisz harmonogram w state
          this.$store.dispatch('weeklySchedule/setSchedule', response.data.schedule);
          this.$store.dispatch('weeklySchedule/setCurrentPlan', response.data.firstPlan);
          
          // Przekieruj do planu tygodniowego (nie do generowania!)
          this.$router.push(`/weekly-plan/${response.data.firstPlanId}`);
          
        } else if (response.data.status === 'partial_success') {
          // ⚠️ Formularz OK, ale problem z harmonogramem
          this.$toast.warn(response.data.message);
          this.showManualSetup = true; // Pokaż manual setup
          
        }
      } catch (error) {
        this.$toast.error('Błąd podczas zapisywania formularza');
      } finally {
        this.submitting = false;
      }
    }
  }
}
</script>
```

### 1.3 Nowy komponent WeeklyPlanViewer

```vue
<!-- components/WeeklyPlanViewer.vue -->
<template>
  <div class="weekly-plan">
    <div class="plan-header">
      <h1>Plan Treningowy - Tydzień {{ plan.weekNumber }}</h1>
      <div class="header-actions">
        <span class="phase-badge" :class="plan.metadata.trainingPhase">
          {{ phaseLabels[plan.metadata.trainingPhase] }}
        </span>
        <button 
          @click="showDeleteModal = true" 
          class="delete-btn"
          :disabled="deleting"
        >
          🗑️ Usuń plan
        </button>
      </div>
    </div>

    <!-- Progress do celu -->
    <div class="goal-progress" v-if="schedule?.longTermGoal">
      <h3>🎯 {{ schedule.longTermGoal.targetEvent }}</h3>
      <div class="progress-bar">
        <div class="fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <p>{{ remainingWeeks }} tygodni do celu</p>
    </div>

    <!-- Training days -->
    <div class="training-days">
      <div 
        v-for="(day, index) in weekDays" 
        :key="index"
        class="day-card"
        :class="{ 'rest-day': day.is_rest_day }"
      >
        <h4>{{ dayNames[index] }}</h4>
        
        <div v-if="day.is_rest_day" class="rest">
          <span>🛌 Dzień odpoczynku</span>
        </div>
        
        <div v-else class="workout">
          <div class="workout-type">{{ day.type }}</div>
          <div class="workout-details">
            <span>📏 {{ day.distance }} km</span>
            <span>⏱️ {{ day.duration }}</span>
            <span>🎯 {{ day.pace }}</span>
          </div>
          <p v-if="day.description">{{ day.description }}</p>
        </div>
      </div>
    </div>

    <!-- Week completion -->
    <div class="week-actions">
      <button 
        @click="completeWeek"
        class="complete-btn"
        :disabled="plan.wasRated"
      >
        <template v-if="plan.wasRated">
          ✅ Tydzień oceniony
        </template>
        <template v-else-if="plan.wasCompleted">
          📝 Oceń tydzień
        </template>
        <template v-else>
          Ukończ tydzień
        </template>
      </button>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal-content" @click.stop>
        <h3>🗑️ Usuń Plan Treningowy</h3>
        <p>Czy na pewno chcesz usunąć ten plan treningowy?</p>
        <p class="warning-text">
          ⚠️ Ta akcja jest nieodwracalna. Wszystkie dane dotyczące tego planu zostaną utracone.
        </p>
        <div class="modal-actions">
          <button 
            @click="showDeleteModal = false" 
            class="cancel-btn"
            :disabled="deleting"
          >
            Anuluj
          </button>
          <button 
            @click="deletePlan" 
            class="confirm-delete-btn"
            :disabled="deleting"
          >
            {{ deleting ? 'Usuwanie...' : 'Usuń plan' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WeeklyPlanViewer',
  props: {
    planId: String
  },
  
  data() {
    return {
      plan: null,
      schedule: null,
      loading: true,
      showDeleteModal: false,
      deleting: false,
      dayNames: ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'],
      phaseLabels: {
        base: 'Baza',
        build: 'Budowanie', 
        peak: 'Szczyt',
        recovery: 'Regeneracja'
      }
    };
  },

  computed: {
    weekDays() {
      return this.plan?.plan_weeks?.[0]?.days || [];
    },
    
    progressPercent() {
      if (!this.schedule?.longTermGoal) return 0;
      const total = this.schedule.longTermGoal.totalWeeks || 12;
      return (this.plan.weekNumber / total) * 100;
    },
    
    remainingWeeks() {
      return this.schedule?.longTermGoal?.remainingWeeks || 0;
    },
    
    canCompleteWeek() {
      return !this.plan.wasRated;
    },
    
    weekStatus() {
      if (this.plan.wasRated) return 'rated';
      if (this.plan.wasCompleted) return 'completed';
      return 'in_progress';
    }
  },

  async mounted() {
    await this.loadData();
  },

  methods: {
    async loadData() {
      try {
        // Load plan
        const planRes = await this.$api.get(`/api/training-plan/details/${this.planId}`);
        this.plan = planRes.data.data.plan;
        
        // Load schedule
        const scheduleRes = await this.$api.get('/api/weekly-schedule');
        this.schedule = scheduleRes.data.data.schedule;
        
      } catch (error) {
        this.$toast.error('Błąd ładowania planu');
      } finally {
        this.loading = false;
      }
    },

    completeWeek() {
      if (this.plan.wasCompleted) {
        // Jeśli plan jest ukończony ale nie oceniony, przekieruj do oceny
        this.$router.push(`/weekly-progress/${this.plan._id}`);
      } else {
        // Jeśli plan nie jest ukończony, najpierw oznacz jako ukończony
        this.$store.dispatch('weeklySchedule/markWeekCompleted', this.plan._id)
          .then(() => {
            this.$router.push(`/weekly-progress/${this.plan._id}`);
          });
      }
    },

    async deletePlan() {
      if (this.deleting) return;
      
      this.deleting = true;
      
      try {
        await this.$api.delete(`/api/plans/${this.planId}`);
        
        // Usuń plan z store
        this.$store.dispatch('weeklySchedule/removePlan', this.planId);
        
        this.$toast.success('Plan treningowy został usunięty');
        
        // Przekieruj do listy planów lub dashboardu
        this.$router.push('/weekly-dashboard');
        
      } catch (error) {
        console.error('Błąd podczas usuwania planu:', error);
        this.$toast.error('Nie udało się usunąć planu treningowego');
      } finally {
        this.deleting = false;
        this.showDeleteModal = false;
      }
    }
  }
};
</script>

<style scoped>
.weekly-plan {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.phase-badge {
  padding: 8px 16px;
  border-radius: 20px;
  color: white;
  font-weight: bold;
}

.delete-btn {
  padding: 8px 16px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s ease;
}

.delete-btn:hover {
  background: #d32f2f;
}

.delete-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.phase-badge.base { background: #4CAF50; }
.phase-badge.build { background: #FF9800; } 
.phase-badge.peak { background: #F44336; }
.phase-badge.recovery { background: #2196F3; }

.goal-progress {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.progress-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin: 10px 0;
}

.fill {
  height: 100%;
  background: #4CAF50;
  transition: width 0.3s ease;
}

.training-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
  margin-bottom: 30px;
}

.day-card {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  transition: all 0.3s ease;
}

.day-card:hover {
  border-color: #4CAF50;
  transform: translateY(-2px);
}

.rest-day {
  background: #f5f5f5;
  opacity: 0.7;
}

.workout-type {
  font-weight: bold;
  color: #2196F3;
  margin-bottom: 8px;
}

.workout-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: #666;
}

.complete-btn {
  width: 100%;
  padding: 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s ease;
}

.complete-btn:hover {
  background: #45a049;
}

.complete-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-content h3 {
  margin: 0 0 16px 0;
  color: #333;
}

.warning-text {
  color: #f44336;
  font-size: 14px;
  margin: 12px 0;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.cancel-btn {
  padding: 8px 16px;
  background: #e0e0e0;
  color: #333;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.cancel-btn:hover {
  background: #d0d0d0;
}

.confirm-delete-btn {
  padding: 8px 16px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.confirm-delete-btn:hover {
  background: #d32f2f;
}

.confirm-delete-btn:disabled,
.cancel-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .training-days {
    grid-template-columns: 1fr;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .modal-content {
    width: 95%;
    padding: 20px;
  }
}
</style>
```

---

## 🎯 Faza 2: WAŻNE KOMPONENTY

### 2.1 Formularz oceny tygodnia

```vue
<!-- components/WeeklyProgressForm.vue -->
<template>
  <div class="progress-form">
    <h2>🏃‍♂️ Oceń swój tydzień treningowy</h2>
    
    <form @submit.prevent="submitProgress">
      <!-- Completion Rate -->
      <div class="form-section">
        <label>Ile % treningów udało Ci się zrealizować?</label>
        <div class="slider-container">
          <input 
            v-model="progress.completionRate"
            type="range"
            min="0" 
            max="100"
            step="5"
            class="completion-slider"
          />
          <div class="slider-value">{{ progress.completionRate }}%</div>
        </div>
      </div>

      <!-- Difficulty Level -->
      <div class="form-section">
        <label>Jak trudne były treningi? (1 = za łatwe, 10 = za trudne)</label>
        <div class="difficulty-scale">
          <button
            v-for="level in 10"
            :key="level"
            type="button"
            @click="progress.difficultyLevel = level"
            class="difficulty-btn"
            :class="{ active: progress.difficultyLevel === level }"
          >
            {{ level }}
          </button>
        </div>
        <div class="difficulty-labels">
          <span>Za łatwe</span>
          <span>Idealne (5-6)</span>
          <span>Za trudne</span>
        </div>
      </div>

      <!-- Injuries -->
      <div class="form-section">
        <label class="checkbox-label">
          <input 
            v-model="progress.injuries" 
            type="checkbox"
          />
          Wystąpiły kontuzje lub dolegliwości
        </label>
        
        <textarea
          v-if="progress.injuries"
          v-model="progress.injuryDescription"
          placeholder="Opisz co się działo..."
          class="injury-textarea"
        ></textarea>
      </div>

      <!-- Feedback -->
      <div class="form-section">
        <label>Jak się czułeś w tym tygodniu?</label>
        <textarea
          v-model="progress.feedback"
          placeholder="Co poszło dobrze? Co było trudne? Jak się czułeś?"
          rows="4"
          class="feedback-textarea"
        ></textarea>
      </div>

      <!-- Next Week Preference -->
      <div class="form-section">
        <label>Jak dostosować następny tydzień?</label>
        <select v-model="progress.nextWeekPreference" class="preference-select">
          <option value="same">Podobny poziom</option>
          <option value="easier">Łatwiejszy - potrzebuję odpocząć</option>
          <option value="harder">Trudniejszy - czuję się mocny!</option>
          <option value="more_speed">Więcej treningów szybkościowych</option>
          <option value="more_endurance">Więcej treningów długich</option>
          <option value="more_recovery">Więcej regeneracji</option>
        </select>
      </div>

      <!-- Submit -->
      <button 
        type="submit" 
        class="submit-btn"
        :disabled="submitting"
      >
        {{ submitting ? 'Zapisywanie...' : '💾 Zapisz ocenę' }}
      </button>
    </form>
  </div>
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
    };
  },

  methods: {
    async submitProgress() {
      this.submitting = true;
      
      try {
        const response = await this.$api.post('/api/weekly-schedule/progress', {
          weekId: this.weekId,
          weeklyData: this.progress
        });

        // Jeśli otrzymaliśmy nowy plan, zaktualizuj store
        if (response.data.data.newPlan) {
          await this.$store.dispatch('weeklySchedule/setCurrentPlan', response.data.data.newPlan);
          this.$toast.success('Ocena zapisana i wygenerowano nowy plan!');
        } else {
          this.$toast.success('Ocena zapisana pomyślnie!');
        }

        // Przekieruj do dashboardu
        this.$router.push('/weekly-dashboard');
      } catch (error) {
        this.$toast.error('Wystąpił błąd podczas zapisywania oceny');
        console.error('Błąd:', error);
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>

<style scoped>
.progress-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.form-section {
  margin-bottom: 30px;
}

.form-section label {
  display: block;
  font-weight: bold;
  margin-bottom: 12px;
  color: #333;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.completion-slider {
  flex: 1;
  height: 8px;
}

.slider-value {
  font-size: 20px;
  font-weight: bold;
  color: #4CAF50;
  min-width: 60px;
  text-align: center;
}

.difficulty-scale {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.difficulty-btn {
  width: 40px;
  height: 40px;
  border: 2px solid #ddd;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
}

.difficulty-btn.active {
  background: #4CAF50;
  border-color: #4CAF50;
  color: white;
}

.difficulty-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.injury-textarea,
.feedback-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-family: inherit;
  resize: vertical;
  margin-top: 8px;
}

.preference-select {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.submit-btn {
  width: 100%;
  padding: 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s ease;
}

.submit-btn:hover {
  background: #45a049;
}

.submit-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
}
</style>
```

### 2.2 API Service dla Weekly Schedule

```javascript
// services/weeklyScheduleApi.js
import api from './api'; // Twój główny API client

export const weeklyScheduleApi = {
  
  // === PODSTAWOWE OPERACJE ===
  
  async getSchedule() {
    const response = await api.get('/api/weekly-schedule');
    return response.data;
  },

  async createSchedule(scheduleData) {
    const response = await api.post('/api/weekly-schedule', scheduleData);
    return response.data;
  },

  async updateSchedule(scheduleData) {
    const response = await api.put('/api/weekly-schedule', scheduleData);
    return response.data;
  },

  // === KONTROLA HARMONOGRAMU ===
  
  async pauseSchedule() {
    const response = await api.post('/api/weekly-schedule/pause');
    return response.data;
  },

  async resumeSchedule() {
    const response = await api.post('/api/weekly-schedule/resume');
    return response.data;
  },

  async deactivateSchedule() {
    const response = await api.post('/api/weekly-schedule/deactivate');
    return response.data;
  },

  // === PROGRES I OCENY ===
  
  async submitWeeklyProgress(weekId, progressData) {
    const response = await api.post('/api/weekly-schedule/progress', {
      weekId,
      weeklyData: progressData
    });
    return response.data;
  },

  // === MANUAL ACTIONS ===
  
  async generateManualDelivery() {
    const response = await api.post('/api/weekly-schedule/manual-delivery');
    return response.data;
  },

  // === HELPER METHODS ===
  
  async getUpcomingDeliveries() {
    const response = await api.get('/api/weekly-schedule/upcoming');
    return response.data;
  },

  async getWeeklyPlansHistory(limit = 10) {
    const response = await api.get(`/api/weekly-schedule/history?limit=${limit}`);
    return response.data;
  },

  // === DELETE OPERATIONS ===
  
  async deletePlan(planId) {
    const response = await api.delete(`/api/plans/${planId}`);
    return response.data;
  }
};

// Error handling wrapper
export const safeWeeklyScheduleApi = {
  async getSchedule() {
    try {
      return await weeklyScheduleApi.getSchedule();
    } catch (error) {
      if (error.response?.status === 404) {
        // Harmonogram nie istnieje
        return { data: { schedule: null } };
      }
      throw error;
    }
  },

  async submitProgress(weekId, progressData) {
    try {
      return await weeklyScheduleApi.submitWeeklyProgress(weekId, progressData);
    } catch (error) {
      console.error('Failed to submit weekly progress:', error);
      throw new Error('Nie udało się zapisać oceny tygodnia');
    }
  }
};
```

### 2.3 Store Module (Vuex/Pinia)

```javascript
// store/modules/weeklySchedule.js
import { weeklyScheduleApi } from '@/services/weeklyScheduleApi';

const state = {
  // Harmonogram
  schedule: {
    isActive: false,
    userId: null,
    deliveryFrequency: 'weekly', // weekly | bi-weekly
    deliveryDay: 'sunday',
    deliveryTime: '18:00',
    timezone: 'Europe/Warsaw',
    nextDeliveryDate: null,
    
    // Progresja
    currentWeekNumber: 1,
    trainingPhase: 'base', // base | build | peak | recovery
    progressionSpeed: 'normal',
    
    // Cel długoterminowy
    longTermGoal: {
      targetEvent: null,
      targetDate: null,
      targetTime: null,
      remainingWeeks: null
    }
  },

  // Aktualny plan
  currentWeeklyPlan: null,
  
  // Historia
  weeklyPlansHistory: [],
  
  // UI State
  pendingProgressReview: null,
  loading: false,
  error: null
};

const mutations = {
  SET_SCHEDULE(state, schedule) {
    state.schedule = { ...state.schedule, ...schedule };
  },
  
  SET_CURRENT_PLAN(state, plan) {
    state.currentWeeklyPlan = plan;
  },
  
  ADD_TO_HISTORY(state, plan) {
    // Dodaj na początek historii
    state.weeklyPlansHistory.unshift(plan);
    
    // Ogranicz historię do 50 elementów
    if (state.weeklyPlansHistory.length > 50) {
      state.weeklyPlansHistory = state.weeklyPlansHistory.slice(0, 50);
    }
  },
  
  SET_PENDING_REVIEW(state, planId) {
    state.pendingProgressReview = planId;
  },
  
  CLEAR_PENDING_REVIEW(state) {
    state.pendingProgressReview = null;
  },
  
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  
  SET_ERROR(state, error) {
    state.error = error;
  },
  
  CLEAR_ERROR(state) {
    state.error = null;
  },

  REMOVE_PLAN_FROM_HISTORY(state, planId) {
    state.weeklyPlansHistory = state.weeklyPlansHistory.filter(
      plan => plan._id !== planId
    );
  },

  CLEAR_CURRENT_PLAN(state) {
    state.currentWeeklyPlan = null;
  }
};

const actions = {
  async fetchSchedule({ commit }) {
    commit('SET_LOADING', true);
    commit('CLEAR_ERROR');
    
    try {
      const response = await weeklyScheduleApi.getSchedule();
      
      if (response.data.schedule) {
        commit('SET_SCHEDULE', response.data.schedule);
      }
      
      if (response.data.currentPlan) {
        commit('SET_CURRENT_PLAN', response.data.currentPlan);
      }
      
      if (response.data.pendingReview) {
        commit('SET_PENDING_REVIEW', response.data.pendingReview);
      }
      
    } catch (error) {
      commit('SET_ERROR', error.message || 'Błąd podczas ładowania harmonogramu');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async updateScheduleSettings({ commit }, scheduleData) {
    try {
      const response = await weeklyScheduleApi.updateSchedule(scheduleData);
      commit('SET_SCHEDULE', response.data.schedule);
      return response;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    }
  },

  async pauseSchedule({ commit }) {
    try {
      await weeklyScheduleApi.pauseSchedule();
      commit('SET_SCHEDULE', { isActive: false });
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    }
  },

  async resumeSchedule({ commit }) {
    try {
      const response = await weeklyScheduleApi.resumeSchedule();
      commit('SET_SCHEDULE', response.data.schedule);
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    }
  },

  async completeWeek({ commit, state }, { weekId, progressData }) {
    try {
      await weeklyScheduleApi.submitWeeklyProgress(weekId, progressData);
      
      // Przenieś aktualny plan do historii
      if (state.currentWeeklyPlan) {
        const completedPlan = {
          ...state.currentWeeklyPlan,
          completedAt: new Date().toISOString(),
          progressData,
          status: 'completed'
        };
        commit('ADD_TO_HISTORY', completedPlan);
      }
      
      // Wyczyść aktualny plan i oczekującą ocenę
      commit('SET_CURRENT_PLAN', null);
      commit('CLEAR_PENDING_REVIEW');
      
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    }
  },

  async generateManualPlan({ commit }) {
    commit('SET_LOADING', true);
    try {
      const response = await weeklyScheduleApi.generateManualDelivery();
      const newPlan = response.data.data.plan;
      await commit('SET_CURRENT_PLAN', newPlan);
      this.$toast.success('Nowy plan został wygenerowany!');
    } catch (error) {
      commit('SET_ERROR', 'Nie udało się wygenerować nowego planu');
      this.$toast.error('Wystąpił błąd podczas generowania planu');
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async deletePlan({ commit, state }, planId) {
    try {
      await weeklyScheduleApi.deletePlan(planId);
      
      // Usuń plan z historii
      commit('REMOVE_PLAN_FROM_HISTORY', planId);
      
      // Jeśli usuwany plan to aktualny plan, wyczyść go
      if (state.currentWeeklyPlan && state.currentWeeklyPlan._id === planId) {
        commit('CLEAR_CURRENT_PLAN');
      }
      
      return true;
    } catch (error) {
      commit('SET_ERROR', 'Nie udało się usunąć planu');
      throw error;
    }
  }
};

const getters = {
  isScheduleActive: state => state.schedule.isActive,
  currentWeekNumber: state => state.schedule.currentWeekNumber,
  nextDeliveryDate: state => state.schedule.nextDeliveryDate,
  hasPendingReview: state => !!state.pendingProgressReview,
  
  recentPlans: state => state.weeklyPlansHistory.slice(0, 5),
  
  scheduleStatus: state => {
    if (!state.schedule.isActive) return 'inactive';
    if (state.currentWeeklyPlan) return 'active';
    if (state.pendingProgressReview) return 'pending_review';
    return 'waiting';
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};
```

---

## 🎯 Faza 3: NICE TO HAVE

### 3.1 Dashboard z harmonogramem

```vue
<!-- views/WeeklyDashboard.vue -->
<template>
  <div class="weekly-dashboard">
    <h1>🏃‍♂️ Twój Plan Biegowy</h1>
    
    <!-- Status Card -->
    <div class="status-card">
      <div class="status-header">
        <h3>Status Harmonogramu</h3>
        <div class="status-indicator" :class="scheduleStatus">
          <span class="dot"></span>
          {{ statusLabels[scheduleStatus] }}
        </div>
      </div>
      
      <div v-if="schedule.isActive" class="schedule-info">
        <p>📅 Następny plan: <strong>{{ formatDate(schedule.nextDeliveryDate) }}</strong></p>
        <p>🕐 Godzina: <strong>{{ schedule.deliveryTime }}</strong></p>
        <p>📊 Częstotliwość: <strong>{{ frequencyLabels[schedule.deliveryFrequency] }}</strong></p>
      </div>
      
      <div class="schedule-actions">
        <button v-if="schedule.isActive" @click="pauseSchedule" class="btn btn-warning">
          ⏸️ Pauzuj
        </button>
        <button v-else @click="resumeSchedule" class="btn btn-success">
          ▶️ Wznów
        </button>
        <button @click="showSettings = true" class="btn btn-secondary">
          ⚙️ Ustawienia
        </button>
      </div>
    </div>

    <!-- Current Plan Card -->
    <div v-if="currentPlan" class="current-plan-card">
      <div class="plan-header">
        <h3>Aktualny Plan - Tydzień {{ currentPlan.weekNumber }}</h3>
        <span class="phase-badge" :class="currentPlan.metadata.trainingPhase">
          {{ phaseLabels[currentPlan.metadata.trainingPhase] }}
        </span>
      </div>
      
      <p class="plan-description">{{ currentPlan.metadata.description }}</p>
      
      <div class="plan-stats">
        <span>🏃 {{ getWorkoutCount(currentPlan) }} treningów</span>
        <span>📏 {{ getTotalDistance(currentPlan) }} km</span>
        <span>⏱️ {{ getTotalTime(currentPlan) }}</span>
      </div>
      
      <div class="plan-actions">
        <router-link 
          :to="`/weekly-plan/${currentPlan._id}`"
          class="btn btn-primary"
        >
          👀 Zobacz szczegóły
        </router-link>
        
        <button 
          v-if="!pendingReview"
          @click="completeWeek"
          class="btn btn-success"
        >
          ✅ Ukończ tydzień
        </button>
      </div>
    </div>

    <!-- Pending Review Card -->
    <div v-if="pendingReview" class="pending-review-card">
      <h3>🎯 Oceń poprzedni tydzień</h3>
      <p>Twoja ocena pomoże dostosować następny plan treningowy</p>
      <router-link 
        :to="`/weekly-progress/${pendingReview}`"
        class="btn btn-primary btn-large"
      >
        📝 Oceń tydzień
      </router-link>
    </div>

    <!-- Recent Plans -->
    <div class="recent-plans">
      <h3>📈 Ostatnie Plany</h3>
      <div class="plans-list">
        <div 
          v-for="plan in recentPlans" 
          :key="plan._id"
          class="plan-item"
        >
          <div class="plan-week">T{{ plan.weekNumber }}</div>
          <div class="plan-info">
            <span class="completion">{{ plan.progressData?.completionRate || 0 }}%</span>
            <span class="date">{{ formatDate(plan.completedAt) }}</span>
          </div>
          <button 
            @click="deletePlanFromHistory(plan._id)"
            class="delete-plan-btn"
            title="Usuń plan"
          >
            🗑️
          </button>
        </div>
      </div>
      
      <router-link to="/plans-history" class="view-all-link">
        Pokaż wszystkie →
      </router-link>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <h3>⚡ Szybkie Akcje</h3>
      <div class="action-buttons">
        <button @click="generateManualPlan" class="action-btn">
          🚀 Wygeneruj następny plan
        </button>
        <button @click="exportData" class="action-btn">
          💾 Eksportuj dane
        </button>
        <button @click="showSettings = true" class="action-btn">
          ⚙️ Zmień harmonogram
        </button>
      </div>
    </div>

    <!-- Settings Modal -->
    <ScheduleSettingsModal 
      v-if="showSettings"
      :schedule="schedule"
      @close="showSettings = false"
      @updated="onScheduleUpdated"
    />
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import ScheduleSettingsModal from '@/components/ScheduleSettingsModal.vue';

export default {
  name: 'WeeklyDashboard',
  components: {
    ScheduleSettingsModal
  },

  data() {
    return {
      showSettings: false,
      
      statusLabels: {
        active: 'Aktywny',
        inactive: 'Nieaktywny',
        pending_review: 'Oczekuje na ocenę',
        waiting: 'Oczekiwanie na plan'
      },
      
      frequencyLabels: {
        weekly: 'Co tydzień',
        'bi-weekly': 'Co 2 tygodnie'
      },
      
      phaseLabels: {
        base: 'Faza Bazowa',
        build: 'Budowanie Formy',
        peak: 'Szczyt Formy', 
        recovery: 'Regeneracja'
      }
    };
  },

  computed: {
    ...mapState('weeklySchedule', [
      'schedule',
      'currentWeeklyPlan', 
      'pendingProgressReview',
      'loading',
      'error'
    ]),
    
    ...mapGetters('weeklySchedule', [
      'scheduleStatus',
      'recentPlans'
    ]),
    
    currentPlan() {
      return this.currentWeeklyPlan;
    },
    
    pendingReview() {
      return this.pendingProgressReview;
    }
  },

  async mounted() {
    await this.fetchSchedule();
  },

  methods: {
    ...mapActions('weeklySchedule', [
      'fetchSchedule',
      'pauseSchedule',
      'resumeSchedule', 
      'generateManualPlan',
      'deletePlan'
    ]),

    async pauseSchedule() {
      try {
        await this.pauseSchedule();
        this.$toast.success('Harmonogram wstrzymany');
      } catch (error) {
        this.$toast.error('Błąd podczas wstrzymywania');
      }
    },

    async resumeSchedule() {
      try {
        await this.resumeSchedule();
        this.$toast.success('Harmonogram wznowiony');
      } catch (error) {
        this.$toast.error('Błąd podczas wznawiania');
      }
    },

    async generateManualPlan() {
      try {
        await this.generateManualPlan();
        this.$toast.success('Nowy plan wygenerowany!');
      } catch (error) {
        this.$toast.error('Błąd podczas generowania planu');
      }
    },

    completeWeek() {
      this.$router.push(`/weekly-progress/${this.currentPlan._id}`);
    },

    onScheduleUpdated() {
      this.showSettings = false;
      this.fetchSchedule();
    },

    exportData() {
      // TODO: Implement data export
      this.$toast.info('Funkcja eksportu będzie dostępna wkrótce');
    },

    getWorkoutCount(plan) {
      if (!plan.plan_weeks?.[0]?.days) return 0;
      return plan.plan_weeks[0].days.filter(day => !day.is_rest_day).length;
    },

    getTotalDistance(plan) {
      if (!plan.plan_weeks?.[0]?.days) return 0;
      return plan.plan_weeks[0].days
        .filter(day => !day.is_rest_day)
        .reduce((total, day) => total + (parseFloat(day.distance) || 0), 0)
        .toFixed(1);
    },

    getTotalTime(plan) {
      // Simplified calculation
      const workouts = this.getWorkoutCount(plan);
      return `~${workouts * 45}min`;
    },

    formatDate(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    async deletePlanFromHistory(planId) {
      if (!confirm('Czy na pewno chcesz usunąć ten plan z historii?')) {
        return;
      }

      try {
        await this.deletePlan(planId);
        this.$toast.success('Plan został usunięty');
      } catch (error) {
        this.$toast.error('Nie udało się usunąć planu');
      }
    }
  }
};
</script>

<style scoped>
.weekly-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-gap: 20px;
}

.status-card,
.current-plan-card,
.pending-review-card,
.recent-plans,
.quick-actions {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status-indicator.active .dot { background: #4CAF50; }
.status-indicator.inactive .dot { background: #F44336; }
.status-indicator.pending_review .dot { background: #FF9800; }
.status-indicator.waiting .dot { background: #2196F3; }

.phase-badge {
  padding: 4px 12px;
  border-radius: 16px;
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.phase-badge.base { background: #4CAF50; }
.phase-badge.build { background: #FF9800; }
.phase-badge.peak { background: #F44336; }
.phase-badge.recovery { background: #2196F3; }

.pending-review-card {
  grid-column: 1 / -1;
  background: linear-gradient(135deg, #FF9800, #F57C00);
  color: white;
  text-align: center;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s ease;
}

.btn-primary { background: #2196F3; color: white; }
.btn-success { background: #4CAF50; color: white; }
.btn-warning { background: #FF9800; color: white; }
.btn-secondary { background: #666; color: white; }

.btn-large {
  padding: 12px 24px;
  font-size: 16px;
}

.plan-stats {
  display: flex;
  gap: 16px;
  margin: 12px 0;
  font-size: 14px;
  color: #666;
}

.plans-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.plan-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  position: relative;
}

.plan-week {
  font-weight: bold;
  color: #4CAF50;
}

.delete-plan-btn {
  background: none;
  border: none;
  color: #f44336;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.3s ease;
  font-size: 16px;
}

.delete-plan-btn:hover {
  background: #ffebee;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  padding: 12px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: background 0.3s ease;
}

.action-btn:hover {
  background: #e9ecef;
}

@media (max-width: 768px) {
  .weekly-dashboard {
    grid-template-columns: 1fr;
  }
}
</style>
```

---

## 📝 CHECKLIST IMPLEMENTACJI

### ✅ **Faza 1 - KRYTYCZNE** (1-2 dni robocze)
- [ ] Zmienić `RunningForm.vue` - nowa logika response
- [ ] Dodać TypeScript interfaces dla API
- [ ] Utworzyć `WeeklyPlanViewer.vue` z funkcją usuwania
- [ ] Przetestować flow: formularz → pierwszy plan

### ✅ **Faza 2 - WAŻNE** (3-5 dni roboczych)
- [ ] Utworzyć `WeeklyProgressForm.vue`
- [ ] Dodać `weeklyScheduleApi.js` service z funkcją usuwania
- [ ] Zaimplementować store module z akcją deletePlan
- [ ] Dodać routing dla nowych komponentów

### ✅ **Faza 3 - NICE TO HAVE** (1-2 tygodnie)
- [ ] `WeeklyDashboard.vue` z pełną funkcjonalnością
- [ ] Historia planów i analizy
- [ ] Ustawienia harmonogramu
- [ ] Notyfikacje i eksport danych

---

## 🚀 PRZYKŁADY TESTOWANIA

### Test formularza:
```javascript
// Wypełnij formularz i wyślij
// Sprawdź czy response zawiera scheduleId i firstPlanId
// Sprawdź czy przekierowuje do /weekly-plan/:id

// Przykładowe dane testowe:
const testFormData = {
  imieNazwisko: 'Jan Kowalski',
  wiek: 30,
  glownyCel: 'przebiegniecie_dystansu',
  dystansDocelowy: '10km',
  poziomZaawansowania: 'sredniozaawansowany',
  dniTreningowe: ['monday', 'wednesday', 'friday'],
  // ... reszta pól
};
```

### Test API endpoints:
```bash
# Test harmonogramu
curl -X GET "http://localhost:3000/api/weekly-schedule" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test oceny tygodnia  
curl -X POST "http://localhost:3000/api/weekly-schedule/progress" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "weekId": "507f1f77bcf86cd799439011",
    "weeklyData": {
      "completionRate": 80,
      "difficultyLevel": 6,
      "feedback": "Świetny tydzień!"
    }
  }'

# Test usuwania planu
curl -X DELETE "http://localhost:3000/api/plans/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test funkcji usuwania:
```javascript
// Test usuwania planu z WeeklyPlanViewer
const deletePlan = async (planId) => {
  try {
    await api.delete(`/api/plans/${planId}`);
    // Sprawdź czy plan został usunięty z UI
    // Sprawdź czy nastąpiło przekierowanie
    // Sprawdź czy pokazano toast z potwierdzeniem
  } catch (error) {
    // Sprawdź obsługę błędów
  }
};

// Test usuwania planu z historii w WeeklyDashboard
const deletePlanFromHistory = async (planId) => {
  const confirmed = confirm('Czy na pewno chcesz usunąć ten plan z historii?');
  if (confirmed) {
    await store.dispatch('weeklySchedule/deletePlan', planId);
    // Sprawdź czy plan został usunięty z listy
  }
};
```

---

## 🗑️ FUNKCJONALNOŚĆ USUWANIA PLANÓW

### Zaimplementowane funkcje:
1. **Usuwanie planu z WeeklyPlanViewer** - przycisk w nagłówku z modalem potwierdzenia
2. **Usuwanie planu z historii** - przycisk 🗑️ przy każdym planie w WeeklyDashboard
3. **API endpoint** - `DELETE /api/plans/:planId` już zaimplementowany w backend
4. **Store action** - `deletePlan` w module weeklySchedule
5. **Bezpieczne usuwanie** - modał potwierdzenia z ostrzeżeniem

### Bezpieczeństwo:
- Confirmation modal z ostrzeżeniem o nieodwracalności
- Sprawdzanie uprawnień użytkownika (middleware authorization)
- Handling błędów z odpowiednimi komunikatami
- Aktualizacja store po usunięciu

### UX/UI:
- Intuicyjne przyciski usuwania
- Loading states podczas usuwania
- Toast notifications z potwierdzeniem/błędem
- Responsive design dla mobile

---

**🎯 Ten plan zawiera wszystkie niezbędne informacje do migracji front endu. Każda sekcja ma kompletne przykłady kodu gotowe do implementacji.**

**💡 Wskazówka:** Zacznij od Fazy 1, przetestuj podstawowy flow, a potem rozbudowuj o kolejne funkcje.

*Ten dokument zawiera wszystkie potrzebne informacje do migracji. W razie pytań lub problemów - skontaktuj się z zespołem backend.* 