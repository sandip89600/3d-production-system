import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

// Resolve sharp from backend node_modules since it is installed there
const require = createRequire(import.meta.url);
const sharpPath = path.resolve('../backend/node_modules/sharp');
let sharp;
try {
  sharp = require(sharpPath);
  console.log('Successfully loaded sharp from backend node_modules.');
} catch (err) {
  console.error('Failed to load sharp from backend node_modules. Trying global or standard import...', err);
  try {
    sharp = require('sharp');
  } catch (e2) {
    console.error('Sharp is not available. Please ensure npm dependencies are installed in backend directory.');
    process.exit(1);
  }
}

const galleryDir = path.resolve('public/Gallery');
const thumbsDir = path.resolve('public/GalleryThumbs');

if (!fs.existsSync(thumbsDir)) {
  fs.mkdirSync(thumbsDir, { recursive: true });
}

async function compressAll() {
  try {
    const files = fs.readdirSync(galleryDir).filter(file => /\.(jpe?g|png|webp)$/i.test(file));
    console.log(`Found ${files.length} images to compress.`);

    const concurrencyLimit = 4; // limit parallel tasks to avoid CPU/RAM starvation
    let completed = 0;

    for (let i = 0; i < files.length; i += concurrencyLimit) {
      const chunk = files.slice(i, i + concurrencyLimit);
      await Promise.all(chunk.map(async (file) => {
        const sourcePath = path.join(galleryDir, file);
        const destPath = path.join(thumbsDir, file);

        // Skip if thumbnail already exists and is not empty
        if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
          completed++;
          return;
        }

        try {
          // Resize to max width 600px while maintaining aspect ratio, JPEG quality 75
          await sharp(sourcePath)
            .resize({ width: 600, withoutEnlargement: true })
            .jpeg({ quality: 75, progressive: true })
            .toFile(destPath);
          
          completed++;
          if (completed % 20 === 0 || completed === files.length) {
            console.log(`Progress: ${completed}/${files.length} thumbnails generated.`);
          }
        } catch (err) {
          console.error(`Error compressing ${file}:`, err.message);
        }
      }));
    }

    console.log('Thumbnail generation complete.');
  } catch (err) {
    console.error('Error during compression run:', err);
  }
}

compressAll();
