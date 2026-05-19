const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');

const imagesDir = path.join(__dirname, '../public/images/featured/autoimage');
const jsonPath = path.join(__dirname, '../featured-images-to-generate.json');

async function main() {
    console.log('Loading JSON data...');
    let files = fs.readdirSync(imagesDir)
        .filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.webp'))
        .filter(f => !f.includes('(1)')) // skip duplicates
        .sort(); 

    console.log('Found ' + files.length + ' images. Starting OCR...');

    const mapping = [];

    // Process files sequentially
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = path.join(imagesDir, file);
        
        console.log('[' + (i+1) + '/' + files.length + '] Scanning ' + file + '...');
        try {
            const { data: { text } } = await Tesseract.recognize(
                filePath,
                'eng',
                { logger: m => {} } 
            );
            
            mapping.push({
                file: file,
                detectedText: text.trim().substring(0, 100).replace(/[\r\n]+/g, ' '),
            });
            
        } catch (err) {
            console.error('   -> Error processing ' + file + ':', err.message);
        }
    }
    
    const proposalPath = path.join(__dirname, 'image-mapping-autoimage.json');
    fs.writeFileSync(proposalPath, JSON.stringify(mapping, null, 2));
    console.log('Proposal saved to ' + proposalPath);
}

main().catch(console.error);
