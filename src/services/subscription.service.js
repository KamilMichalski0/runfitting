const User = require('../models/user.model');
const AppError = require('../utils/app-error');
const subscriptionConfig = require('../config/subscription.config');

class SubscriptionService {
  constructor() {
    // W przyszłości można wstrzyknąć np. klienta Stripe
  }

  /**
   * Sprawdza, czy użytkownik ma aktywną subskrypcję wymaganego poziomu.
   * @param {string} userId - ID użytkownika (Supabase ID).
   * @param {string} requiredTier - Minimalny wymagany tier (np. 'basic', 'premium').
   * @returns {Promise<boolean>} True, jeśli użytkownik ma dostęp.
   */
  async hasActiveSubscription(userId, requiredTier) {
    const user = await User.findOne({ supabaseId: userId }).select('+subscriptionTier +subscriptionValidUntil');
    if (!user) {
      throw new AppError('Użytkownik nie znaleziony.', 404);
    }

    const userTier = user.subscriptionTier;
    const validUntil = user.subscriptionValidUntil;

    const tiersOrder = ['free', 'basic', 'premium'];
    const requiredTierIndex = tiersOrder.indexOf(requiredTier);
    const userTierIndex = tiersOrder.indexOf(userTier);

    if (userTierIndex < requiredTierIndex) {
      return false; // Niższy tier niż wymagany
    }

    // Dla tierów płatnych sprawdź ważność subskrypcji
    if (userTier !== 'free') {
      if (!validUntil || new Date(validUntil) < new Date()) {
        // TODO: Logika automatycznego przełączenia na 'free' jeśli subskrypcja wygasła
        // await this.switchToFreeTier(userId);
        // console.log(`Subskrypcja użytkownika ${userId} wygasła. Przełączono na free.`);
        return userTierIndex >= requiredTierIndex && requiredTier === 'free'; // Dostęp tylko jeśli wymagany był free
      }
    }
    return true;
  }

  /**
   * Sprawdza limity modyfikacji i rejestruje użycie.
   * Rzuca błąd, jeśli limit został przekroczony.
   * @param {string} userId - ID użytkownika (Supabase ID).
   * @param {'daily' | 'weekly'} modificationType - Typ modyfikacji.
   */
  async checkAndRecordModification(userId, modificationType) {
    const user = await User.findOne({ supabaseId: userId });
    if (!user) {
      throw new AppError('Użytkownik nie znaleziony.', 404);
    }

    const tier = user.subscriptionTier;
    const tierConfig = subscriptionConfig.getTierConfig(tier);

    if (!tierConfig) {
      throw new AppError('Nieznany tier subskrypcji użytkownika.', 500);
    }

    const now = new Date();
    // Resetowanie miesięcznych liczników dla 'basic' i 'premium' (choć premium ma Infinity)
    // Dla 'premium', Infinity sprawi, że warunki nigdy nie będą prawdziwe
    if (tier === 'basic' || tier === 'premium') {
        const resetDate = user.modificationCountersResetDate ? new Date(user.modificationCountersResetDate) : null;
        if (!resetDate || resetDate.getFullYear() < now.getFullYear() || (resetDate.getFullYear() === now.getFullYear() && resetDate.getMonth() < now.getMonth())) {
            user.monthlyModificationsUsed.daily = 0;
            user.monthlyModificationsUsed.weekly = 0;
            user.modificationCountersResetDate = new Date(now.getFullYear(), now.getMonth(), 1);
            this.log(`Zresetowano miesięczne liczniki modyfikacji dla użytkownika ${userId}`);
        }
    }

    let limit = 0;
    let currentUsage = 0;

    if (tier === 'free') {
      if (modificationType === 'daily') {
        limit = tierConfig.totalDailyModifications;
        currentUsage = user.freemiumModificationUsed ? 1 : 0;
        if (currentUsage >= limit) {
          throw new AppError('Osiągnięto limit modyfikacji dnia dla darmowego planu.', 403);
        }
        user.freemiumModificationUsed = true;
      } else { // 'weekly' modification for 'free' tier
        throw new AppError('Modyfikacje tygodnia nie są dostępne w darmowym planie.', 403);
      }
    } else if (tier === 'basic' || tier === 'premium') { // 'basic' lub 'premium'
      if (modificationType === 'daily') {
        limit = tierConfig.monthlyDailyModifications;
        currentUsage = user.monthlyModificationsUsed.daily;
        if (currentUsage >= limit) {
          throw new AppError('Osiągnięto miesięczny limit modyfikacji dnia.', 403);
        }
        user.monthlyModificationsUsed.daily += 1;
      } else { // weekly modification
        limit = tierConfig.monthlyWeeklyModifications;
        currentUsage = user.monthlyModificationsUsed.weekly;
        if (currentUsage >= limit) {
          throw new AppError('Osiągnięto miesięczny limit modyfikacji tygodnia.', 403);
        }
        user.monthlyModificationsUsed.weekly += 1;
      }
    } else {
      throw new AppError('Nieobsługiwany tier subskrypcji.', 500);
    }

    await user.save();
    this.log(`Zarejestrowano modyfikację (${modificationType}) dla użytkownika ${userId}. Tier: ${tier}. Użycie: ${currentUsage + 1}/${limit}`);
  }
  
  /**
   * Aktualizuje status subskrypcji użytkownika (np. po webhooku od Stripe).
   * @param {string} userId - ID użytkownika w naszej bazie (Supabase ID).
   * @param {string} newTier - Nowy tier subskrypcji ('free', 'basic', 'premium').
   * @param {Date | null} validUntil - Data ważności nowej subskrypcji (null dla 'free').
   * @param {string | null} stripeCustomerId - ID klienta w Stripe.
   * @param {string | null} stripeSubscriptionId - ID subskrypcji w Stripe.
   */
  async updateUserSubscriptionStatus(userId, newTier, validUntil, stripeCustomerId, stripeSubscriptionId) {
    const user = await User.findOne({ supabaseId: userId });
    if (!user) {
      throw new AppError(`Użytkownik o ID ${userId} nie został znaleziony podczas aktualizacji subskrypcji.`, 404);
    }

    const oldTier = user.subscriptionTier;
    user.subscriptionTier = newTier;
    user.subscriptionValidUntil = validUntil;
    
    if (stripeCustomerId) user.stripeCustomerId = stripeCustomerId;
    if (stripeSubscriptionId) user.stripeSubscriptionId = stripeSubscriptionId;

    // Resetuj liczniki, jeśli tier się zmienia lub jest to odnowienie
    // Szczególnie ważne przy przejściu z free na płatny lub między płatnymi
    if (oldTier !== newTier || newTier !== 'free') {
        user.monthlyModificationsUsed.daily = 0;
        user.monthlyModificationsUsed.weekly = 0;
        user.freemiumModificationUsed = false; // Zawsze resetuj przy zmianie na płatny lub odnowieniu
        user.modificationCountersResetDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        this.log(`Zresetowano liczniki modyfikacji dla użytkownika ${userId} z powodu zmiany/odnowienia subskrypcji na ${newTier}.`);
    }

    await user.save();
    this.log(`Zaktualizowano subskrypcję użytkownika ${userId} do tieru: ${newTier}, ważna do: ${validUntil}`);
    return user;
  }

  /**
   * Funkcja pomocnicza do logowania w ramach serwisu.
   */
  log(message, data) {
    console.log(`[SubscriptionService] ${message}`, data !== undefined ? data : '');
  }
}

module.exports = SubscriptionService; 