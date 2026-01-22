import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconDir = path.join(__dirname, 'public', 'icons');
const logoPath = path.join(iconDir, 'SA-Department-of-Health-Logo.jpg');

// Ensure directory exists
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Create icons from actual Department of Health logo
async function generateIcons() {
  try {
    console.log('🎨 Converting SA Department of Health logo to PWA icons...');

    // Check if source logo exists
    if (!fs.existsSync(logoPath)) {
      console.error('❌ Error: SA-Department-of-Health-Logo.jpg not found in public/icons/');
      process.exit(1);
    }

    for (const size of sizes) {
      const filename = size === 512 ? 'icon-512.png' : size === 192 ? 'icon-192.png' : `icon-${size}.png`;
      const filepath = path.join(iconDir, filename);

      // Convert logo to required size with square format
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toFile(filepath);

      console.log(`✓ Created ${filename} (${size}x${size})`);
    }

    console.log('\n✨ All PWA icons generated from Department of Health logo!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
