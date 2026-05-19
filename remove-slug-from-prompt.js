const fs = require('fs');

const jsonPath = 'c:/laragon/www/gsn-crm/featured-images-to-generate.json';
const rawData = fs.readFileSync(jsonPath, 'utf8');
let data = JSON.parse(rawData);

let updated = 0;

data.forEach(item => {
    // The exact string we added previously
    const slugReq = `\n\n**File Naming Requirement:** When providing the generated image, ensure the file is named EXACTLY as "${item.slug}.png" so it downloads with this name.`;
    
    if (item.prompt.includes(slugReq)) {
        item.prompt = item.prompt.replace(slugReq, '');
        updated++;
    }
});

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));

// Regenerate the txt file
const promptsTxt = data.map(i => i.prompt.replace(/\n/g, ' ').trim()).join('\n\n');
fs.writeFileSync('c:/laragon/www/gsn-crm/featured-images-prompts.txt', promptsTxt);

console.log(`Removed naming requirement from ${updated} prompts.`);
