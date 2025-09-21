// Vercel serverless function entry point
const app = require('../server.js');

// Export the app for Vercel serverless functions
module.exports = app;
module.exports.default = app;
