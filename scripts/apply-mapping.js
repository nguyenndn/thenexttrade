const fs = require('fs');
const path = require('path');

const MAPPING_FILE = path.join(__dirname, 'pending-mapping.json');
const SOURCE_DIR = path.join(__dirname, '../public/images/featured/autoimage');
const TARGET_DIR = path.join(__dirname, '../public/images/featured');

if (!fs.existsSync(MAPPING_FILE)) {
    console.error('❌ Error: pending-mapping.json not found. Run smart-match.js first.');
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));

if (!data.verified) {
    console.error('❌ Error: Mappings have not been verified.');
    console.error('Please open scripts/pending-mapping.json, review the mappings, and set "verified": true');
    process.exit(1);
}

console.log('✅ Mappings verified. Starting batch rename and move...');

let successCount = 0;
let failCount = 0;

for (const m of data.mapping) {
    if (!m.file || !m.slug || m.slug === 'UNKNOWN' || m.slug === 'NO_MATCH') {
        console.warn(`⚠️ Skipping invalid mapping for file: ${m.file}`);
        failCount++;
        continue;
    }

    const sourcePath = path.join(SOURCE_DIR, m.file);
    const ext = path.extname(m.file);
    const targetPath = path.join(TARGET_DIR, `${m.slug}${ext}`);

    try {
        if (fs.existsSync(sourcePath)) {
            fs.renameSync(sourcePath, targetPath);
            console.log(`Moved: ${m.file} -> ${m.slug}${ext}`);
            successCount++;
        } else {
            console.warn(`⚠️ File not found (may have been moved already): ${m.file}`);
            failCount++;
        }
    } catch (err) {
        console.error(`❌ Error moving ${m.file}:`, err);
        failCount++;
    }
}

console.log(`\n🎉 Finished applying mappings. Success: ${successCount}, Failed/Skipped: ${failCount}`);

if (successCount > 0 && failCount === 0) {
    // Optionally archive the mapping file
    const archivePath = path.join(__dirname, `mapping-history-${Date.now()}.json`);
    fs.renameSync(MAPPING_FILE, archivePath);
    console.log(`📦 Archived mapping to ${path.basename(archivePath)}`);
    console.log('🧹 You can now safely delete the autoimage folder if it is empty.');
}
