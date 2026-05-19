const fs = require('fs');
const path = require('path');

// Load OCR results
const ocr = JSON.parse(fs.readFileSync(path.join(__dirname, 'image-mapping-autoimage.json'), 'utf8'));

// Load JSON data  
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../featured-images-to-generate.json'), 'utf8'));

// Load prompts file to get the EXACT prompt order
const promptsText = fs.readFileSync(path.join(__dirname, '../featured-images-prompts.txt'), 'utf8');
const promptLines = promptsText.split('\n');

// Extract prompt titles in order
const promptTitles = [];
for (const line of promptLines) {
    const match = line.match(/\*\*(.*?)\*\*/);
    if (match) {
        promptTitles.push(match[1]);
    }
}

console.log('Total prompts in file:', promptTitles.length);
console.log('Total images to match:', ocr.length);
console.log('');

// Build prompt -> slug mapping
// Each prompt title should match a JSON entry
const promptToSlug = [];
for (const title of promptTitles) {
    const titleLower = title.toLowerCase().replace(/[^a-z0-9 ]/g, '');
    let bestMatch = null;
    let bestScore = 0;
    
    for (const item of data) {
        const itemTitleLower = item.title.toLowerCase().replace(/[^a-z0-9 ]/g, '');
        // Check word overlap
        const titleWords = titleLower.split(/\s+/).filter(w => w.length > 2);
        let score = 0;
        for (const w of titleWords) {
            if (itemTitleLower.includes(w)) score++;
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = item;
        }
    }
    
    promptToSlug.push({
        promptTitle: title,
        slug: bestMatch ? bestMatch.slug : 'UNKNOWN',
        jsonTitle: bestMatch ? bestMatch.title : 'UNKNOWN'
    });
}

// Now match each image to a prompt using OCR text
// Images were generated in prompt order, so enforce monotonic ordering
const matchScore = (ocrText, promptTitle) => {
    const textLower = ocrText.toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
    const words = promptTitle.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    let score = 0;
    for (const w of words) {
        if (textLower.includes(w)) score += w.length; // weight by word length
    }
    return score;
};

// Greedy sequential matching: for each image, find best prompt from remaining prompts
let lastPromptIdx = -1;
const finalMapping = [];

for (let i = 0; i < ocr.length; i++) {
    const text = ocr[i].detectedText;
    let bestIdx = -1;
    let bestScore = 0;
    
    // Search from lastPromptIdx+1 to end of prompts
    // Allow some lookahead but prefer earlier matches
    for (let j = lastPromptIdx + 1; j < promptToSlug.length; j++) {
        const score = matchScore(text, promptToSlug[j].promptTitle);
        // Prefer matches closer to the expected position
        const distancePenalty = Math.max(0, (j - lastPromptIdx - 5)) * 0.5;
        const adjustedScore = score - distancePenalty;
        
        if (adjustedScore > bestScore) {
            bestScore = adjustedScore;
            bestIdx = j;
        }
    }
    
    if (bestIdx >= 0) {
        finalMapping.push({
            imageIndex: i,
            file: ocr[i].file,
            ocrSnippet: text.substring(0, 50),
            promptIndex: bestIdx,
            promptTitle: promptToSlug[bestIdx].promptTitle,
            slug: promptToSlug[bestIdx].slug,
            score: bestScore
        });
        lastPromptIdx = bestIdx;
    } else {
        finalMapping.push({
            imageIndex: i,
            file: ocr[i].file,
            ocrSnippet: text.substring(0, 50),
            promptIndex: -1,
            promptTitle: 'NO MATCH',
            slug: 'NO_MATCH',
            score: 0
        });
    }
}

// Print results
console.log('=== FINAL MAPPING (OCR-based + sequential) ===\n');
for (const m of finalMapping) {
    const flag = m.score < 5 ? ' ⚠️' : ' ✅';
    console.log(m.imageIndex + ' [P' + m.promptIndex + '] ' + m.slug + flag + ' (score:' + m.score.toFixed(0) + ')');
    console.log('   OCR: ' + m.ocrSnippet);
    console.log('   Title: ' + m.promptTitle.substring(0, 60));
    console.log('');
}

// Save mapping for manual verification
fs.writeFileSync(
    path.join(__dirname, 'pending-mapping.json'), 
    JSON.stringify({ 
        _instruction: "Please verify these mappings manually. Change 'verified' to true when done, then run 'node scripts/apply-mapping.js'",
        verified: false,
        mapping: finalMapping.map(m => ({ 
            file: m.file, 
            slug: m.slug,
            confidence: m.score,
            needsReview: m.score < 5
        })) 
    }, null, 2)
);

// Summary
const lowConf = finalMapping.filter(m => m.score < 5);
console.log('--- SUMMARY ---');
console.log('Total mapped:', finalMapping.length);
console.log('High confidence (>=5):', finalMapping.filter(m => m.score >= 5).length);
console.log('Low confidence (<5):', lowConf.length);
console.log('\nA pending-mapping.json file has been generated.');
console.log('IMPORTANT: Please review pending-mapping.json, set "verified": true, and run scripts/apply-mapping.js to finalize.');

if (lowConf.length > 0) {
    console.log('\nLow confidence images that need visual verification:');
    lowConf.forEach(m => console.log('  Image ' + m.imageIndex + ': ' + m.file));
}
