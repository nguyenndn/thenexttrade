const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const stringSimilarity = require('string-similarity');

const imagesDir = path.join(__dirname, '../public/images/featured/imageauto');
const jsonPath = path.join(__dirname, '../featured-images-to-generate.json');

async function main() {
    console.log("Loading JSON data...");
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    // We only care about entries that are likely to be part of the latest batch
    // Based on user, it's roughly from index 24 to index 73 (50 entries)
    const candidates = data.slice(24, 75).map(item => ({
        slug: item.slug,
        title: item.title.replace(/[^\w\s-]/gi, '').toLowerCase(),
        originalTitle: item.title
    }));

    const titles = candidates.map(c => c.title);

    console.log("Reading image folder...");
    let files = fs.readdirSync(imagesDir)
        .filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.webp'))
        .sort(); // keep alphabetical / time order just in case

    console.log(`Found ${files.length} images. Starting OCR...`);

    const mapping = [];

    // Process files sequentially or batched
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = path.join(imagesDir, file);
        
        console.log(`[${i+1}/${files.length}] Scanning ${file}...`);
        try {
            const { data: { text } } = await Tesseract.recognize(
                filePath,
                'eng',
                { logger: m => {} } // disable verbose logs
            );
            
            const cleanText = text.replace(/[\r\n]+/g, ' ').replace(/[^\w\s-]/gi, '').toLowerCase();
            
            // Find best match in candidates
            const matches = stringSimilarity.findBestMatch(cleanText, titles);
            const bestMatchIndex = matches.bestMatchIndex;
            const bestMatchCandidate = candidates[bestMatchIndex];
            
            mapping.push({
                file: file,
                slug: bestMatchCandidate.slug,
                detectedText: text.trim().substring(0, 50).replace(/[\r\n]+/g, ' '),
                confidence: matches.bestMatch.rating
            });
            
            console.log(`   -> Best match: ${bestMatchCandidate.slug} (confidence: ${(matches.bestMatch.rating * 100).toFixed(1)}%)`);
        } catch (err) {
            console.error(`   -> Error processing ${file}:`, err.message);
        }
    }
    
    // Sort mapping by file name
    console.log("\n=================================");
    console.log("FINAL MAPPING PROPOSAL:");
    console.log("=================================\n");
    mapping.forEach(m => {
        console.log(`${m.file} \n  => ${m.slug}.png`);
        console.log(`  (OCR text snippet: "${m.detectedText}", Conf: ${(m.confidence * 100).toFixed(1)}%)\n`);
    });

    // Write proposal to file for easy review
    const proposalPath = path.join(__dirname, 'image-mapping-proposal.json');
    fs.writeFileSync(proposalPath, JSON.stringify(mapping, null, 2));
    console.log(`Proposal saved to ${proposalPath}`);
}

main().catch(console.error);
