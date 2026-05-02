#!/usr/bin/env node
/**
 * Generate placeholder icons for the TMT Translator Extension
 * Node.js version using canvas library
 * 
 * Installation: npm install canvas
 */

const fs = require('fs');
const path = require('path');

// Try to use canvas, fall back if not available
let Canvas;
try {
  Canvas = require('canvas').Canvas;
} catch (e) {
  console.error('ERROR: canvas library not found!');
  console.error('\nTo use this script, install the canvas library:');
  console.error('  npm install canvas');
  console.error('\nOr use the Python version instead:');
  console.error('  python setup/generate-icons.py');
  process.exit(1);
}

function createIcon(size, filepath) {
  const canvas = new Canvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Draw green background
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(0, 0, size, size);
  
  // Draw white circle
  ctx.strokeStyle = 'white';
  ctx.lineWidth = Math.max(1, Math.floor(size * 0.1));
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, (size - ctx.lineWidth) / 2, 0, Math.PI * 2);
  ctx.stroke();
  
  // Draw globe emoji or text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${Math.floor(size * 0.6)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  try {
    ctx.fillText('🌐', size / 2, size / 2);
  } catch (e) {
    ctx.fillText('T', size / 2, size / 2);
  }
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filepath, buffer);
  console.log(`✓ Created ${path.basename(filepath)} (${size}x${size})`);
}

function main() {
  const assetDir = path.join(__dirname, '..', 'src', 'assets');
  
  // Create assets directory if it doesn't exist
  if (!fs.existsSync(assetDir)) {
    fs.mkdirSync(assetDir, { recursive: true });
  }
  
  console.log('Generating extension icons...');
  console.log('-'.repeat(40));
  
  const icons = [
    { size: 16, file: 'icon-16.png' },
    { size: 48, file: 'icon-48.png' },
    { size: 128, file: 'icon-128.png' },
  ];
  
  try {
    icons.forEach(({ size, file }) => {
      const filepath = path.join(assetDir, file);
      createIcon(size, filepath);
    });
    
    console.log('-'.repeat(40));
    console.log('✓ All icons generated successfully!\n');
    console.log(`Icons saved to: ${assetDir}/`);
    console.log('\nYou can now load the extension in Chrome:');
    console.log('  1. Go to chrome://extensions/');
    console.log('  2. Enable Developer mode');
    console.log('  3. Click "Load unpacked"');
    console.log('  4. Select the tmt-translator-extension folder');
    
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

main();
