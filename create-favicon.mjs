import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.join(__dirname, 'public', 'icons', 'SA-Department-of-Health-Logo.jpg');
const publicDir = path.join(__dirname, 'public');

async function createFavicon() {
  try {
    console.log('🎨 Creating favicon from Department of Health logo...');
    
    // Create favicon.png (32x32)
    await sharp(logoPath)
      .resize(32, 32, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(publicDir, 'favicon.png'));
    
    console.log('✓ Created favicon.png (32x32)');
    console.log('✨ Favicon setup complete!');
  } catch (error) {
    console.error('Error creating favicon:', error);
    process.exit(1);
  }
}

createFavicon();
