const fs = require('fs');
const path = require('path');

console.log('🏗️  Building LegalEase AI for deployment...');

// Ensure public directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('✅ Created public directory');
}

// Copy static files to public directory if they don't exist there
const staticFiles = ['index.html', 'script.js', 'styles.css'];

staticFiles.forEach(file => {
  const srcPath = path.join(__dirname, file);
  const destPath = path.join(publicDir, file);
  
  if (fs.existsSync(srcPath) && !fs.existsSync(destPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied ${file} to public directory`);
  } else if (fs.existsSync(destPath)) {
    console.log(`✅ ${file} already exists in public directory`);
  }
});

// Copy any PNG files (screenshots, etc.)
const files = fs.readdirSync(__dirname);
files.forEach(file => {
  if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.svg')) {
    const srcPath = path.join(__dirname, file);
    const destPath = path.join(publicDir, file);
    
    if (!fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copied ${file} to public directory`);
    }
  }
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

console.log('🎉 Build completed successfully!');
console.log('📁 Public directory ready for Vercel deployment');