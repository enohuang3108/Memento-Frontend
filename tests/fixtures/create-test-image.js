// Create a simple 1x1 pixel PNG for testing
const fs = require('fs');
const path = require('path');

// 1x1 red pixel PNG (base64)
const pngData = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'base64'
);

const outputPath = path.join(__dirname, 'test-image.png');
fs.writeFileSync(outputPath, pngData);
console.log('✓ Created test-image.png');
