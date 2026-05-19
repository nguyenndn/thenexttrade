const fs = require('fs');

const rawData = fs.readFileSync('c:/laragon/www/gsn-crm/featured-images-to-generate.json', 'utf8');
let data = JSON.parse(rawData);

let updated = 0;

data.forEach(item => {
    // Determine if it's Gold related based on title or slug
    const isGold = /gold|xau/i.test(item.title) || /gold|xau/i.test(item.slug);

    let newStyle = "";
    if (isGold) {
        newStyle = "Clean, premium fintech aesthetic. Bright, light gradient background transitioning from soft white to pale warm cream. Accent colors: luxurious gold, warm amber, and deep black for a premium metallic feel. Include abstract, modern high-tech motifs like geometric nodes, subtle glowing data lines, and clean modern typography. The feel should be professional, bright, authoritative, and reassuring.";
    } else {
        newStyle = "Clean, premium fintech aesthetic. Bright, light gradient background transitioning from soft white to pale blue-gray. Accent colors: deep navy blue and vibrant emerald green for trust signals. Include abstract, modern high-tech motifs like geometric nodes, subtle glowing data lines, and clean modern typography. The feel should be professional, bright, authoritative, and reassuring.";
    }

    // Check if the prompt already has broker table constraints in its style.
    // If it does, we need to preserve those constraints.
    const hasBrokerConstraint = item.prompt.includes('EXACTLY AND ONLY these 3 brokers');
    const hasComparisonElements = item.prompt.includes('comparison table elements');
    
    let baseTheme = newStyle;

    if (hasBrokerConstraint) {
        // Build the broker specific style based on the light theme
        if (isGold) {
             baseTheme = `Clean, trustworthy fintech aesthetic. Bright, light gradient background transitioning from soft white to pale warm cream. Accent colors: luxurious gold, warm amber, and deep black for a premium metallic feel. Include subtle shield/checkmark motifs, a visual comparison table containing EXACTLY AND ONLY these 3 brokers: Exness, IC Markets, and Vantage. DO NOT include any other brokers (no Pepperstone, no FXTM). Display their realistic data (Spread: 0.0 pips, Commission: $6.00 - $7.00). DO NOT use generic placeholders like "Broker A", and clean typography. The feel should be corporate, authoritative, and reassuring — like a premium financial comparison platform.`;
        } else {
             baseTheme = `Clean, trustworthy fintech aesthetic. Bright, light gradient background transitioning from soft white to pale blue-gray. Accent colors: deep navy blue and vibrant emerald green for trust signals. Include subtle shield/checkmark motifs, a visual comparison table containing EXACTLY AND ONLY these 3 brokers: Exness, IC Markets, and Vantage. DO NOT include any other brokers (no Pepperstone, no FXTM). Display their realistic data (Spread: 0.0 pips, Commission: $6.00 - $7.00). DO NOT use generic placeholders like "Broker A", and clean typography. The feel should be corporate, authoritative, and reassuring — like a premium financial comparison platform.`;
        }
    } else if (hasComparisonElements) {
         if (isGold) {
             baseTheme = `Clean, trustworthy fintech aesthetic. Bright, light gradient background transitioning from soft white to pale warm cream. Accent colors: luxurious gold, warm amber, and deep black for a premium metallic feel. Include subtle shield/checkmark motifs, comparison table elements, and clean typography. The feel should be corporate, authoritative, and reassuring — like a premium financial comparison platform.`;
         } else {
             baseTheme = `Clean, trustworthy fintech aesthetic. Bright, light gradient background transitioning from soft white to pale blue-gray. Accent colors: deep navy blue and vibrant emerald green for trust signals. Include subtle shield/checkmark motifs, comparison table elements, and clean typography. The feel should be corporate, authoritative, and reassuring — like a premium financial comparison platform.`;
         }
    }

    // Replace the Style & Composition block
    const styleRegex = /\*\*Style & Composition:\*\* (.*?)\n\n\*\*Text Requirement:\*\*/s;
    const match = item.prompt.match(styleRegex);
    if (match) {
        const currentStyle = match[1];
        if (currentStyle !== baseTheme) {
            item.prompt = item.prompt.replace(styleRegex, `**Style & Composition:** ${baseTheme}\n\n**Text Requirement:**`);
            updated++;
        }
    }
});

fs.writeFileSync('c:/laragon/www/gsn-crm/featured-images-to-generate.json', JSON.stringify(data, null, 2));

const promptsTxt = data.map(i => i.prompt.replace(/\n/g, ' ').trim()).join('\n\n');
fs.writeFileSync('c:/laragon/www/gsn-crm/featured-images-prompts.txt', promptsTxt);

console.log('Updated ' + updated + ' prompts to light themes.');
console.log('Updated featured-images-prompts.txt');
