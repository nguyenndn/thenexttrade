import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'featured-images-to-generate.json');
if (!fs.existsSync(filePath)) {
  console.log(`File not found: ${filePath}`);
} else {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`Loaded ${content.length || Object.keys(content).length} items from featured-images-to-generate.json`);
  if (Array.isArray(content)) {
    console.log('--- First 3 items ---');
    console.log(JSON.stringify(content.slice(0, 3), null, 2));
  } else {
    console.log('--- First 3 keys ---');
    const keys = Object.keys(content);
    for (let i = 0; i < Math.min(3, keys.length); i++) {
      console.log(`Key: ${keys[i]}`);
      console.log(JSON.stringify(content[keys[i]], null, 2));
      console.log('----------------');
    }
  }
}
