const TrainingPlan = require('../models/training-plan.model');
const User = require('../models/user.model');
const GeminiService = require('./gemini.service');
const PlanModificationService = require('./planModification.service');
const SubscriptionService = require('./subscription.service');
const KnowledgeBase = require('../knowledge/running-knowledge-base');
const AppError = require('../utils/app-error');
const subscriptionConfig = require('../config/subscription.config');

// Założenie, że instancje serwisów są tworzone lub wstrzykiwane
// W rzeczywistej aplikacji rozważ wstrzykiwanie zależności (np. przez konstruktor)
// const geminiService = new GeminiService(KnowledgeBase.getInstance()); // Zakładając, że KB ma metodę getInstance lub jest singletonem
// const planModificationService = new PlanModificationService(KnowledgeBase.getInstance());
// const subscriptionService = new SubscriptionService(); // Należy dostosować do faktycznej implementacji

class TrainingPlanService {
  constructor() {
    // Można wstrzykiwać zależności tutaj, jeśli preferowane
    // Poprawione inicjalizacje serwisów, przekazując bezpośrednio obiekt KnowledgeBase
    this.geminiService = new GeminiService(KnowledgeBase);
    this.planModificationService = new PlanModificationService(KnowledgeBase);
    this.subscriptionService = new SubscriptionService(); // Instantiate here
  }

  async generatePlan(userId, userFormData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('Użytkownik nie znaleziony.', 404);
    }

    // Sprawdzenie, czy użytkownik może wygenerować nowy plan (np. w planie Premium może mieć kilka)
    const userTierConfig = subscriptionConfig.getTierConfig(user.subscriptionTier);
    if (!userTierConfig) {
        throw new AppError('Nieprawidłowy tier subskrypcji użytkownika.', 500);
    }

    if (!userTierConfig.canGenerateMultiplePlans) {
        const existingPlans = await TrainingPlan.find({ userId: userId, isActive: true }); // Założenie pola isActive
        if (existingPlans.length > 0) {
            throw new AppError('Osiągnięto limit aktywnych planów dla Twojej subskrypcji.', 403);
        }
    }

    // Przygotowanie danych dla GeminiService, uwzględnienie tieru użytkownika
    let effectiveUserData = { ...user.toObject(), ...userFormData }; 

    if (user.subscriptionTier === 'free') {
      // Dla Freemium, ogranicz dane wejściowe lub dostosuj logikę generowania
      // Np. geminiService może mieć specjalną logikę dla 'free'
      // Tutaj można też nadpisać `maxPlanDurationWeeks` z konfiguracji
      effectiveUserData.planContext = 'freemium_basic_generation';
    } else {
      effectiveUserData.planContext = 'paid_detailed_generation';
    }
    // Ustalenie maksymalnej długości planu na podstawie tieru
    effectiveUserData.maxPlanDurationWeeks = userTierConfig.maxPlanDurationWeeks;


    const generatedPlanData = await this.geminiService.generateTrainingPlan(effectiveUserData);

    if (!generatedPlanData) {
      throw new AppError('Nie udało się wygenerować planu treningowego.', 500);
    }

    // Zapisz plan w bazie danych
    const newPlan = new TrainingPlan({
      userId: userId,
      supaUserId: user.supabaseId, // Założenie, że to pole istnieje i jest potrzebne
      title: generatedPlanData.metadata.description || `Plan dla ${user.name}`,
      description: generatedPlanData.metadata.description,
      level: generatedPlanData.metadata.level_hint,
      durationWeeks: generatedPlanData.metadata.duration_weeks,
      daysPerWeek: parseInt(generatedPlanData.metadata.days_per_week) || null,
      targetGoal: generatedPlanData.metadata.target_goal,
      plan_weeks: generatedPlanData.plan_weeks,
      corrective_exercises: generatedPlanData.corrective_exercises,
      pain_monitoring: generatedPlanData.pain_monitoring,
      notes: generatedPlanData.notes,
      generatedBy: 'AI_MODEL_V1', // Można dodać wersję modelu
      isActive: true, // Domyślnie nowy plan jest aktywny
      generatedForTier: user.subscriptionTier // Zapisz tier, dla którego plan został wygenerowany
    });

    await newPlan.save();
    return newPlan;
  }

  async getPlanById(planId, userId) {
    const plan = await TrainingPlan.findById(planId);
    if (!plan) {
      throw new AppError('Plan treningowy nie znaleziony.', 404);
    }

    // Sprawdzenie, czy użytkownik ma dostęp do tego planu
    if (plan.userId.toString() !== userId) {
      // TODO: Dodać logikę dla coachów/adminów, jeśli mają mieć dostęp
      throw new AppError('Brak dostępu do tego planu treningowego.', 403);
    }
    
    const user = await User.findById(userId);
    if (!user) throw new AppError('Użytkownik nie znaleziony.', 404); // Powinno być już obsłużone

    // Jeśli plan był generowany dla 'free', ogranicz widoczność
    if (plan.generatedForTier === 'free' && user.subscriptionTier === 'free') {
        const freeTierConfig = subscriptionConfig.getTierConfig('free');
        const visibleWeeks = Math.ceil(freeTierConfig.visiblePlanDays / 7);
        
        // Zwróć tylko widoczną część planu
        const planObject = plan.toObject();
        planObject.plan_weeks = planObject.plan_weeks.slice(0, visibleWeeks);
        // Można dodać informację, że plan jest ograniczony
        planObject.isLimitedView = true;
        planObject.totalDurationWeeksOriginal = plan.durationWeeks; 
        planObject.durationWeeks = visibleWeeks;
        return planObject;
    }

    return plan;
  }

  async getUserPlans(userId, page = 1, limit = 10) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('Użytkownik nie znaleziony', 404);

    const userTierConfig = subscriptionConfig.getTierConfig(user.subscriptionTier);
    if (!userTierConfig) throw new AppError('Nieprawidłowy tier subskrypcji', 500);

    let queryLimit = userTierConfig.historyLimit;
    if (queryLimit === Infinity) {
        // Jeśli Infinity, nie limituj w zapytaniu, ale paginacja nadal działa
        queryLimit = 0; // 0 lub null dla braku limitu w Mongoose, ale chcemy paginację
    }

    const plansQuery = TrainingPlan.find({ userId: userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit);

    if (queryLimit !== Infinity && queryLimit > 0) {
        // Limit historii stosujemy do paginacji
        // Jeśli limit historii jest mniejszy niż 'limit' na stronę, użyj limitu historii
        plansQuery.limit(Math.min(limit, queryLimit - (page - 1) * limit ));
    } else if (queryLimit !== Infinity) { // Dla Infinity i 0 (free)
        plansQuery.limit(limit); 
    }

    const plans = await plansQuery.exec();
    const totalPlansForUser = await TrainingPlan.countDocuments({ userId: userId });
    
    // Ograniczanie historii na podstawie tieru, jeśli paginacja nie pokrywa
    let effectivePlans = plans;
    if (userTierConfig.historyLimit !== Infinity && totalPlansForUser > userTierConfig.historyLimit) {
        // Ta logika może być skomplikowana z paginacją. 
        // Prostsze jest pozwolić na paginację, a UI może wyświetlić info o limicie.
        // Alternatywnie, jeśli userTierConfig.historyLimit < page * limit, zwróć tylko tyle, ile można.
        effectivePlans = plans.slice(0, Math.max(0, userTierConfig.historyLimit - (page - 1) * limit));
    }
    
    // Dla planów 'free' zawsze pokazuj tylko ograniczoną wersję, nawet w historii
    const processedPlans = effectivePlans.map(plan => {
        if (plan.generatedForTier === 'free') {
            const freeTierConfig = subscriptionConfig.getTierConfig('free');
            const visibleWeeks = Math.ceil(freeTierConfig.visiblePlanDays / 7);
            const planObject = plan.toObject();
            planObject.plan_weeks = planObject.plan_weeks.slice(0, visibleWeeks);
            planObject.isLimitedView = true;
            planObject.totalDurationWeeksOriginal = plan.durationWeeks;
            planObject.durationWeeks = visibleWeeks;
            return planObject;
        }
        return plan.toObject();
    });

    return {
        plans: processedPlans,
        totalPages: queryLimit === Infinity ? Math.ceil(totalPlansForUser / limit) : Math.ceil(Math.min(totalPlansForUser, queryLimit) / limit),
        currentPage: page,
        totalPlans: queryLimit === Infinity ? totalPlansForUser : Math.min(totalPlansForUser, queryLimit)
    };
  }

  async requestDayModification(userId, planId, weekIndex, dayIndex, modificationReason) {
    const user = await User.findOne({ supabaseId: userId });
    if (!user) throw new AppError('Użytkownik nie znaleziony.', 404);

    const trainingPlan = await TrainingPlan.findById(planId);
    if (!trainingPlan || trainingPlan.userId.toString() !== userId) {
      throw new AppError('Plan treningowy nie znaleziony lub brak dostępu.', 404);
    }

    await this.subscriptionService.checkAndRecordModification(userId, 'daily');

    const modifiedDayObject = await this.planModificationService.modifyDayInPlan(
      trainingPlan.toObject(),
      weekIndex,
      dayIndex,
      user.toObject(),
      modificationReason
    );

    if (trainingPlan.plan_weeks && trainingPlan.plan_weeks[weekIndex] && trainingPlan.plan_weeks[weekIndex].days[dayIndex]) {
      trainingPlan.plan_weeks[weekIndex].days[dayIndex] = modifiedDayObject;
      trainingPlan.markModified('plan_weeks'); 
      await trainingPlan.save();
    } else {
      throw new AppError('Nie udało się zaktualizować dnia w planie - nieprawidłowa struktura lub indeksy.', 500);
    }
    
    return trainingPlan;
  }

  async requestWeekModification(userId, planId, weekIndex, modificationReason) {
    const user = await User.findOne({ supabaseId: userId });
    if (!user) throw new AppError('Użytkownik nie znaleziony.', 404);

    const trainingPlan = await TrainingPlan.findById(planId);
    if (!trainingPlan || trainingPlan.userId.toString() !== userId) {
      throw new AppError('Plan treningowy nie znaleziony lub brak dostępu.', 404);
    }

    await this.subscriptionService.checkAndRecordModification(userId, 'weekly');

    const modifiedWeekObject = await this.planModificationService.modifyWeekInPlan(
      trainingPlan.toObject(),
      weekIndex,
      user.toObject(),
      modificationReason
    );
    
    if (trainingPlan.plan_weeks && trainingPlan.plan_weeks[weekIndex]) {
      trainingPlan.plan_weeks[weekIndex] = modifiedWeekObject;
      trainingPlan.markModified('plan_weeks');
      await trainingPlan.save();
    } else {
      throw new AppError('Nie udało się zaktualizować tygodnia w planie - nieprawidłowa struktura lub indeks.', 500);
    }

    return trainingPlan;
  }
  
  async deletePlan(userId, planId) {
    const plan = await TrainingPlan.findOneAndDelete({ _id: planId, userId: userId });
    if (!plan) {
        throw new AppError('Nie znaleziono planu lub brak uprawnień do usunięcia.', 404);
    }
    // Można dodać logikę np. archiwizacji zamiast twardego usuwania
    return { message: 'Plan został pomyślnie usunięty.' };
  }

  async updatePlanMetadata(userId, planId, metadataUpdates) {
    const plan = await TrainingPlan.findById(planId);
    if (!plan || plan.userId.toString() !== userId) {
        throw new AppError('Nie znaleziono planu lub brak uprawnień.', 404);
    }

    // Aktualizuj tylko dozwolone pola metadanych
    if (metadataUpdates.title) plan.title = metadataUpdates.title;
    if (metadataUpdates.description) plan.description = metadataUpdates.description;
    if (typeof metadataUpdates.isActive === 'boolean') plan.isActive = metadataUpdates.isActive;
    // Dodaj inne pola metadanych, które użytkownik może modyfikować

    await plan.save();
    return plan;
  }

}

module.exports = new TrainingPlanService(); // Eksport instancji serwisu 