require('dotenv').config(); // Upewnij się, że dotenv jest zainstalowany i skonfigurowany na początku aplikacji

const subscriptionConfig = {
  tiers: {
    free: {
      name: 'Start (Freemium)',
      visiblePlanDays: 14, // Ile dni planu jest widoczne
      totalDailyModifications: Infinity, // Łączna liczba modyfikacji dnia na cały plan
      totalWeeklyModifications: Infinity, // Łączna liczba modyfikacji tygodnia na cały plan
      historyLimit: 0, // Brak dostępu do historii
      canGenerateMultiplePlans: false,
      maxPlanDurationWeeks: 8, // Maksymalna długość generowanego planu (ale widoczne tylko visiblePlanDays)
      priceId: null // Darmowy plan nie ma Price ID w Stripe w ten sam sposób
    },
    basic: {
      name: 'Basic',
      monthlyDailyModifications: 10,
      monthlyWeeklyModifications: 2,
      historyLimit: 3, // Dostęp do 3 ostatnich planów
      canGenerateMultiplePlans: false,
      maxPlanDurationWeeks: 12,
      stripePriceId: process.env.STRIPE_BASIC_PLAN_PRICE_ID 
    },
    premium: {
      name: 'Premium',
      monthlyDailyModifications: Infinity, // Nielimitowane
      monthlyWeeklyModifications: Infinity, // Nielimitowane
      historyLimit: Infinity, // Pełny dostęp do historii
      canGenerateMultiplePlans: true, // Możliwość posiadania np. 2-3 aktywnych planów
      maxPlanDurationWeeks: 24,
      stripePriceId: process.env.STRIPE_PREMIUM_PLAN_PRICE_ID
    }
  },
  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET // Do weryfikacji webhooków
  },
  // Funkcja pomocnicza do pobierania konfiguracji dla danego tieru
  getTierConfig: function(tierName) {
    return this.tiers[tierName] || null;
  }
};

module.exports = subscriptionConfig; 