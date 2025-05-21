const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  apiKey: process.env.GEMINI_API_KEY,
  apiUrl: 'https://generativelanguage.googleapis.com',
  model: 'gemini-2.5-pro-preview-03-25',
  maxTokens: 100000,
  temperature: 0.3,
  topK: 40,
  topP: 0.95
}; 