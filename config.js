require('dotenv').config();
// Configuration file for LegalEase AI
module.exports = {
  // Google Gemini API Configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-1.5-flash', // Using the latest Gemini model
    maxTokens: 4000,
    temperature: 0.3
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 3002,
    environment: process.env.NODE_ENV || 'development'
  },

  // File Upload Configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    uploadDir: 'uploads/'
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // requests per window
  },

  // AI Analysis Configuration
  analysis: {
    maxDocumentLength: 50000, // characters
    supportedLanguages: ['en'],
    confidenceThreshold: 0.7
  }
};
