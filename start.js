#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting LegalEase AI...\n');

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('📦 Installing dependencies...');
  const install = spawn('npm', ['install'], { stdio: 'inherit' });
  
  install.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Dependencies installed successfully!\n');
      startServer();
    } else {
      console.error('❌ Failed to install dependencies');
      process.exit(1);
    }
  });
} else {
  startServer();
}

function startServer() {
  console.log('🔧 Starting server...');
  
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory');
  }
  
  // Start the server
  const server = spawn('node', ['server.js'], { stdio: 'inherit' });
  
  server.on('close', (code) => {
    console.log(`\n🛑 Server stopped with code ${code}`);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.kill('SIGINT');
    process.exit(0);
  });
  
  console.log('✅ LegalEase AI is running!');
  console.log('🌐 Open your browser to: http://localhost:3000');
  console.log('📱 Press Ctrl+C to stop the server\n');
}
