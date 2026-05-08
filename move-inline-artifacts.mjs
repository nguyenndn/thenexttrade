import fs from 'fs';
import path from 'path';

const brainDir = path.join(process.env.HOME || process.env.USERPROFILE, '.gemini', 'antigravity', 'brain', 'ebc62fbe-c63d-4d25-a073-601160205275');
const targetDir = path.join(process.cwd(), 'public', 'images', 'articles');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const files = fs.readdirSync(brainDir);
let count = 0;

for (const file of files) {
  if (file.endsWith('.png') && file.includes('_inline_')) {
    // Extract base name. Example format:
    // trading_psychology_for_beginners_inline_1_1778208991080.png
    const parts = file.split('_inline_');
    if (parts.length === 2) {
      const slugPart = parts[0]; // trading_psychology_for_beginners
      const rest = parts[1]; // 1_1778208991080.png
      
      const indexMatch = rest.match(/^(\d+)_/);
      if (indexMatch) {
        const index = indexMatch[1];
        // Reconstruct proper name: trading-psychology-for-beginners-inline-1.png
        const properSlug = slugPart.replace(/_/g, '-');
        const finalName = `${properSlug}-inline-${index}.png`;
        
        const srcPath = path.join(brainDir, file);
        const destPath = path.join(targetDir, finalName);
        
        try {
          fs.copyFileSync(srcPath, destPath);
          console.log(`✅ Copied ${file} -> ${finalName}`);
          count++;
        } catch (e) {
          console.error(`❌ Failed to copy ${file}:`, e.message);
        }
      }
    }
  }
}

console.log(`\n🎉 Successfully moved ${count} inline images.`);
