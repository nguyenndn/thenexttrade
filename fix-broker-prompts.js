const fs = require('fs');
const data = JSON.parse(fs.readFileSync('c:/laragon/www/gsn-crm/featured-images-to-generate.json', 'utf8'));
let updated = 0;

const oldText = 'a visual comparison table showing actual broker names (e.g., Exness, IC Markets, Vantage) and realistic data (e.g., Spread: 0.0 pips, Commission: $6.00 - $7.00). DO NOT use generic placeholders like "Broker A" or "Broker B" — the text and data must look like a real, specific broker comparison';
const newText = 'a visual comparison table containing EXACTLY AND ONLY these 3 brokers: Exness, IC Markets, and Vantage. DO NOT include any other brokers (no Pepperstone, no FXTM). Display their realistic data (Spread: 0.0 pips, Commission: $6.00 - $7.00). DO NOT use generic placeholders like "Broker A"';

data.forEach(item => {
    if (item.prompt.includes(oldText)) {
        item.prompt = item.prompt.replace(oldText, newText);
        updated++;
    }
});

fs.writeFileSync('c:/laragon/www/gsn-crm/featured-images-to-generate.json', JSON.stringify(data, null, 2));
console.log('Updated ' + updated + ' broker prompts.');

const promptsTxt = data.map(i => i.prompt.replace(/\n/g, ' ').trim()).join('\n\n');
fs.writeFileSync('c:/laragon/www/gsn-crm/featured-images-prompts.txt', promptsTxt);
console.log('Updated featured-images-prompts.txt');
