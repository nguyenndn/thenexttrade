/**
 * scripts/lint-ai-copy.cjs
 * Lint script to prevent AI marketing clichés and banned phrases (§15.1) from re-entering the codebase.
 * Usage: node scripts/lint-ai-copy.cjs
 */

const fs = require('fs');
const path = require('path');

const BANNED_PATTERNS = [
    { pattern: /\bunlock your potential\b/i, name: 'Unlock your potential' },
    { pattern: /\belevate your trading\b/i, name: 'Elevate your trading' },
    { pattern: /\byour next move\b/i, name: 'Your next move' },
    { pattern: /\bempowering traders\b/i, name: 'Empowering traders' },
    { pattern: /\bseamlessly integrate\b/i, name: 'Seamlessly integrate' },
    { pattern: /\bdeep[- ]dive\b/i, name: 'Deep-dive / Deep dive' },
    { pattern: /\bdelve into\b/i, name: 'Delve into' },
    { pattern: /\bmaster the art of\b/i, name: 'Master the art of' },
    { pattern: /\ba testament to\b/i, name: 'A testament to' },
    { pattern: /\bin today's fast-paced\b/i, name: 'In today\'s fast-paced' },
    { pattern: /\bbeacon of hope\b/i, name: 'Beacon of hope' },
    { pattern: /\bgame[- ]changer\b/i, name: 'Game-changer' },
    { pattern: /\brevolutionize\b/i, name: 'Revolutionize' },
    { pattern: /\bsupercharge\b/i, name: 'Supercharge' },
    { pattern: /\bmaster the craft\b/i, name: 'Master the craft' },
    { pattern: /\bmaster the markets\b/i, name: 'Master the markets' },
    { pattern: /\bhigh-win signals\b/i, name: 'High-win signals' },
    { pattern: /\bThat Actually Work\b/i, name: 'That Actually Work' },
    { pattern: /\bEverything you need to know\b/i, name: 'Everything you need to know' },
    { pattern: /\bReady to build your trading edge\b/i, name: 'Ready to build your trading edge' },
    { pattern: /\bReady to Join the Community\b/i, name: 'Ready to Join the Community' },
    { pattern: /TheNextTrade[a-z]/, name: 'TheNextTrade missing space (TheNextTrade[a-z])' },
];

const SCAN_DIRS = ['src', 'content'];

const ALLOWED_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.html']);
const IGNORED_PATHS = [
    'node_modules',
    '.next',
    'dist',
    'build',
    '.git',
    'scripts/lint-ai-copy.cjs',
    'content/data/level-', // academy tạm ẩn — owner chưa muốn sửa; xem docs/AI-SMELL-FIX-PLAN.md mục PHẠM VI HIỆN TẠI
];

let totalHits = 0;

function walkDir(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');

        if (IGNORED_PATHS.some((ignored) => relativePath.startsWith(ignored))) {
            continue;
        }

        if (entry.isDirectory()) {
            walkDir(fullPath);
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            const isTestFile = entry.name.includes('.test.') || entry.name.includes('.spec.');
            if (ALLOWED_EXTS.has(ext) && !isTestFile) {
                checkFile(fullPath, relativePath);
            }
        }
    }
}

function checkFile(fullPath, relativePath) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip comments if desired, or scan all string literals
        for (const { pattern, name } of BANNED_PATTERNS) {
            if (pattern.test(line)) {
                console.error(`❌ [${name}] ${relativePath}:${i + 1}`);
                console.error(`   ${line.trim()}`);
                totalHits++;
            }
        }
    }
}

console.log(`🔍 Scanning for AI clichés in: ${SCAN_DIRS.join(', ')}...`);
for (const dir of SCAN_DIRS) {
    walkDir(path.resolve(process.cwd(), dir));
}

if (totalHits > 0) {
    console.error(`\n🚨 Found ${totalHits} AI cliché violation(s) in codebase.`);
    process.exit(1);
} else {
    console.log(`\n✅ Zero AI clichés found in scanned directories. Clean!`);
    process.exit(0);
}
