import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'inline-images-to-generate.json');
if (!fs.existsSync(filePath)) {
  console.log(`File not found: ${filePath}`);
} else {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  if (Array.isArray(content)) {
    console.log(`Loaded ${content.length} items from inline-images-to-generate.json (Array type)`);
    console.log('--- First 2 items ---');
    console.log(JSON.stringify(content.slice(0, 2), null, 2));
  } else {
    const keys = Object.keys(content);
    console.log(`Loaded ${keys.length} keys from inline-images-to-generate.json (Object type)`);
    console.log('--- First 2 keys ---');
    for (let i = 0; i < Math.min(2, keys.length); i++) {
      console.log(`Key: ${keys[i]}`);
      console.log(JSON.stringify(content[keys[i]].slice(0, 2), null, 2));
      console.log('----------------');
    }
  }
}
