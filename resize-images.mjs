import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const FEATURED_DIR = 'public/images/featured';
const TARGET_RATIO = 16 / 9; // 1.778

const files = fs.readdirSync(FEATURED_DIR).filter(f => f.endsWith('.png'));
console.log(`Found ${files.length} images to process\n`);

let processed = 0;
let errors = 0;

for (const file of files) {
  const filePath = path.join(FEATURED_DIR, file);
  try {
    const metadata = await sharp(filePath).metadata();
    const { width, height } = metadata;
    
    const currentRatio = width / height;
    
    // If it's already exactly 16:9 (e.g. 1024x576), skip it
    if (Math.abs(currentRatio - TARGET_RATIO) < 0.01) {
      console.log(`⏩ [Skipped] ${file} is already 16:9 (${width}x${height})`);
      continue;
    }
    
    let cropWidth, cropHeight, left, top;
    
    if (currentRatio < TARGET_RATIO) {
      // Image is taller than 16:9 — crop top/bottom
      cropWidth = width;
      cropHeight = Math.round(width / TARGET_RATIO);
      left = 0;
      top = Math.round((height - cropHeight) / 2);
    } else {
      // Image is wider than 16:9 — crop left/right
      cropHeight = height;
      cropWidth = Math.round(height * TARGET_RATIO);
      left = Math.round((width - cropWidth) / 2);
      top = 0;
    }
    
    // Crop center, DO NOT resize up to avoid blurriness
    await sharp(filePath)
      .extract({ left, top, width: cropWidth, height: cropHeight })
      .png({ quality: 100 })
      .toFile(filePath + '.tmp');
    
    // Replace original
    fs.unlinkSync(filePath);
    fs.renameSync(filePath + '.tmp', filePath);
    
    processed++;
    console.log(`✅ [${processed}/${files.length}] ${file} (${width}x${height} → ${cropWidth}x${cropHeight})`);
  } catch (err) {
    errors++;
    console.error(`❌ ${file}: ${err.message}`);
  }
}

console.log(`\nDone! Processed: ${processed}, Errors: ${errors}`);
