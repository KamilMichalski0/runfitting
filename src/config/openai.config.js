/**
 * Konfiguracja dla OpenAI API
 * Używana jako fallback gdy Gemini API jest niedostępne
 */
const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  apiUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o', // Domyślny model
  temperature: 0.1, // Niska temperatura dla spójnych wyników
  maxTokens: 4000, // Limit tokenów dla odpowiedzi
  topP: 0.95,
  frequencyPenalty: 0,
  presencePenalty: 0,
  timeout: 60000, // 60 sekund timeout
};

module.exports = openaiConfig;
