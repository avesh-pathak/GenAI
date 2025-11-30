require('dotenv').config();

module.exports = {

  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-2.5-flash', 
    maxTokens: 4000,
    temperature: 0.3
  },


  server: {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    sessionSecret: process.env.SESSION_SECRET || 'default-dev-secret-change-in-production'
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    uploadDir: process.env.UPLOAD_DIR || 'uploads/'
  },


  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes default
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'production' ? 50 : 100) // Lower limit in production
  },


  analysis: {
    maxDocumentLength: 50000, 
    supportedLanguages: ['en'],
    confidenceThreshold: 0.7
  },

 
  security: {
    trustProxy: process.env.NODE_ENV === 'production',
    healthCheckEnabled: process.env.HEALTH_CHECK_ENABLED === 'true' || false
  },


  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
  }
};
