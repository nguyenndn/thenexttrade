const fs = require('fs');
const file = 'featured-images-to-generate.json';
let data = JSON.parse(fs.readFileSync(file, 'utf-8'));
let updated = 0;
let goldCount = 0;

data.forEach(item => {
  let prompt = item.prompt;
  let isGold = /gold|xau/i.test(item.title) || /gold|xau/i.test(item.slug);
  
  if (isGold && !prompt.includes('luxurious gold')) {
    prompt = prompt.replace(/Accent colors: [^.]+./, 'Accent colors: luxurious gold, warm amber, and deep black for a premium metallic feel.');
    goldCount++;
  }
  
  // Remove the old "No text on the image" instruction if it exists
  prompt = prompt.replace(/No text on the image\./gi, '').trim();

  if (!prompt.includes('**Text Requirement:**')) {
    prompt += `\n\n**Text Requirement:** Prominently feature the exact text "${item.title}" in clean, bold, modern typography. Ensure the text is highly readable against the background.`;
  }
  
  if (prompt !== item.prompt) {
    item.prompt = prompt;
    updated++;
  }
});

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
console.log(`Updated ${updated} prompts with Text Requirements.`);
console.log(`Updated ${goldCount} prompts with Gold theme.`);

const lines = data.map(item => item.prompt.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim());
fs.writeFileSync('featured-images-prompts.txt', lines.join('\n\n'), 'utf-8');
console.log('Regenerated featured-images-prompts.txt file.');
