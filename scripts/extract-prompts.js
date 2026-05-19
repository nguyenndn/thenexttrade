const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'featured-images-to-generate.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const lines = data.map((item, i) => {
    // Clean up the prompt - remove \n within prompt text for single-line output
    const cleanPrompt = item.prompt.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
    return cleanPrompt;
});

const output = lines.join('\n\n');

const outPath = path.join(__dirname, '..', 'featured-images-prompts.txt');
fs.writeFileSync(outPath, output, 'utf-8');

console.log(`Done! Wrote ${data.length} prompts to featured-images-prompts.txt`);
