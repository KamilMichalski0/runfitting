const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-2.5-pro-exp-03-25',
  maxTokens: 100000,
  temperature: 0.1,
  topK: 40,
  topP: 0.95
}; 