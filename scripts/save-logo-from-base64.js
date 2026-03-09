// Save a base64-encoded image to public/icons/provincial-health-logo.(png|jpg)
// Usage examples:
// 1) Pass data URL on the command line:
//    node scripts/save-logo-from-base64.js "data:image/png;base64,iVBORw0KG..."
// 2) Or set environment variable and run:
//    $env:BASE64LOGO = "data:image/png;base64,iVBORw0KG..."; node scripts/save-logo-from-base64.js

const fs = require('fs');
const path = require('path');

const input = process.argv[2] || process.env.BASE64LOGO;
if (!input) {
  console.error('Provide base64 image data as the first argument or set BASE64LOGO env var.');
  process.exit(1);
}

// Allow either a raw base64 string or a data URL like: data:image/png;base64,AAAA...
const matches = input.match(/^data:(image\/(\w+));base64,(.+)$/);
let ext = 'png';
let b64 = input;
if (matches) {
  ext = matches[2] || 'png';
  b64 = matches[3] || '';
}

if (!b64) {
  console.error('No base64 payload detected.');
  process.exit(1);
}

const outDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `provincial-health-logo.${ext}`);
fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
console.log('Saved logo to', outPath);
