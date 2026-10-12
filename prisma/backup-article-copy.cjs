/**
 * prisma/backup-article-copy.cjs
 * Backup and restore script for the 8 target articles before copy modifications.
 * Usage:
 *   Backup:  node prisma/backup-article-copy.cjs
 *   Restore: node prisma/backup-article-copy.cjs --restore <backup-file.json>
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const TARGET_SLUGS = [
    'best-broker-for-gold-trading-xau-usd',
    'best-regulated-brokers-in-asia',
    'bollinger-bands-trading-strategy',
    'how-to-avoid-impulse-trades',
    'how-to-use-moving-averages-forex',
    'journaling-for-traders-why-and-how',
    'lowest-spread-forex-brokers-ranked',
    'stochastic-oscillator-explained',
];

async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--restore')) {
        const fileIndex = args.indexOf('--restore') + 1;
        const targetFile = args[fileIndex];
        if (!targetFile || !fs.existsSync(targetFile)) {
            console.error(`❌ Please provide a valid backup JSON file path to restore.`);
            process.exit(1);
        }

        const data = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
        console.log(`🔄 Restoring ${data.length} articles from ${targetFile}...`);
        for (const item of data) {
            await prisma.article.update({
                where: { slug: item.slug },
                data: { content: item.content },
            });
            console.log(`   ✓ Restored article [${item.slug}]`);
        }
        console.log(`✅ Successfully restored ${data.length} articles.`);
        return;
    }

    // Default: Backup
    console.log(`📦 Fetching 8 target articles from database...`);
    const articles = await prisma.article.findMany({
        where: {
            slug: { in: TARGET_SLUGS },
        },
        select: {
            id: true,
            slug: true,
            title: true,
            content: true,
            updatedAt: true,
        },
    });

    if (articles.length !== TARGET_SLUGS.length) {
        console.warn(`⚠️ Warning: Expected ${TARGET_SLUGS.length} articles, found ${articles.length} in DB.`);
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const backupFileName = `_backup-article-copy-${timestamp}.json`;
    const backupPath = path.join(__dirname, backupFileName);

    fs.writeFileSync(backupPath, JSON.stringify(articles, null, 2), 'utf8');
    console.log(`Backed up ${articles.length} articles to ${backupPath}`);
}

main()
    .catch(async (e) => {
        console.error('❌ Error during backup/restore:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
