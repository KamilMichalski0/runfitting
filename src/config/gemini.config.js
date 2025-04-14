const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  apiKey: process.env.GEMINI_API_KEY,
  apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
  model: 'gemini-pro',
  maxTokens: 2048,
  temperature: 0.1,
  topK: 40,
  topP: 0.95
}; 