/**
 * prisma/fix-article-copy.cjs
 * Fix AI clichés and markdown leakage in database articles (PHASE F1 + F2).
 * Usage:
 *   Dry run: node prisma/fix-article-copy.cjs
 *   Apply:   node prisma/fix-article-copy.cjs --apply
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// F1: Strict string replacements for game-changer phrases
const CLICHE_REPLACEMENTS = [
    {
        slug: 'best-broker-for-gold-trading-xau-usd',
        find: 'are a game-changer.',
        expected: 1,
        replace: 'remove the waiting time.',
    },
    {
        slug: 'best-regulated-brokers-in-asia',
        find: 'This is a game-changer for Asian scalpers and day traders who need liquidity.',
        expected: 1,
        replace: 'Asian scalpers and day traders get same-day liquidity here.',
    },
    {
        slug: 'best-regulated-brokers-in-asia',
        find: 'is a game-changer for traders who want to start without financial commitment.',
        expected: 1,
        replace: 'lets you start without tying up capital.',
    },
    {
        slug: 'how-to-avoid-impulse-trades',
        find: 'This is the game-changer.',
        expected: 1,
        replace: 'This is the step that removes most impulse entries.',
    },
    {
        slug: 'lowest-spread-forex-brokers-ranked',
        find: 'This is a game-changer for retail traders.',
        expected: 1,
        replace: 'Retail traders cut cost per trade down to the spread alone.',
    },
    {
        slug: 'journaling-for-traders-why-and-how',
        find: 'The Game-Changers (Most Traders Skip These)',
        expected: 1,
        replace: 'The Fields Most Traders Skip',
    },
];

// F2: Target slugs for markdown ** replacement
const MARKDOWN_TARGET_SLUGS = [
    'bollinger-bands-trading-strategy',
    'how-to-use-moving-averages-forex',
    'stochastic-oscillator-explained',
];

const MARKDOWN_REGEX = /\*\*([^*]+)\*\*/g;

// Non-global twin for `.test()`. A /g regex is stateful (lastIndex advances between
// calls), so testing it in a loop can report "no markdown left" while markdown remains.
const MARKDOWN_DETECT = /\*\*[^*]+\*\*/;

async function main() {
    const isApply = process.argv.includes('--apply');
    console.log(`🚀 [Phase F] Running article copy fix (${isApply ? 'APPLY MODE (Writing to DB)' : 'DRY-RUN MODE'})...\n`);

    const allSlugs = Array.from(new Set([
        ...CLICHE_REPLACEMENTS.map((r) => r.slug),
        ...MARKDOWN_TARGET_SLUGS,
    ]));

    const articles = await prisma.article.findMany({
        where: { slug: { in: allSlugs } },
        select: { id: true, slug: true, content: true },
    });

    const articleMap = new Map(articles.map((a) => [a.slug, a]));

    let validationFailed = false;
    const modifiedContents = new Map(); // slug -> newContent

    // --- Check F1 replacements ---
    console.log(`📋 Checking F1: Cliché replacements (6 items)...`);
    for (const rule of CLICHE_REPLACEMENTS) {
        const article = articleMap.get(rule.slug);
        if (!article) {
            console.error(`❌ Article not found in DB: ${rule.slug}`);
            validationFailed = true;
            continue;
        }

        let currentContent = modifiedContents.get(rule.slug) || article.content;
        const occurrences = (currentContent.match(new RegExp(escapeRegExp(rule.find), 'g')) || []).length;

        // Check if already replaced (for idempotency)
        const alreadyReplaced = currentContent.includes(rule.replace);

        if (occurrences === rule.expected) {
            console.log(`   ✓ [${rule.slug}] Found ${occurrences}/${rule.expected} match: "${rule.find.slice(0, 40)}..."`);
            const updated = currentContent.replace(rule.find, rule.replace);
            modifiedContents.set(rule.slug, updated);
        } else if (occurrences === 0 && alreadyReplaced) {
            console.log(`   ℹ [${rule.slug}] Already replaced (idempotent): "${rule.replace.slice(0, 40)}..."`);
        } else {
            console.error(`❌ [${rule.slug}] Expected ${rule.expected} occurrence(s) of "${rule.find}", but found ${occurrences}!`);
            validationFailed = true;
        }
    }

    // --- Check F2 markdown bold replacements ---
    console.log(`\n📋 Checking F2: Markdown bold ** removal (3 articles)...`);
    for (const slug of MARKDOWN_TARGET_SLUGS) {
        const article = articleMap.get(slug);
        if (!article) {
            console.error(`❌ Article not found in DB: ${slug}`);
            validationFailed = true;
            continue;
        }

        let currentContent = modifiedContents.get(slug) || article.content;
        const matches = currentContent.match(MARKDOWN_REGEX);
        const matchCount = matches ? matches.length : 0;

        if (matchCount > 0) {
            console.log(`   ✓ [${slug}] Found ${matchCount} markdown bold tag(s) to convert.`);
            const updated = currentContent.replace(MARKDOWN_REGEX, '<strong>$1</strong>');
            modifiedContents.set(slug, updated);
        } else {
            console.log(`   ℹ [${slug}] No markdown ** found (already clean / converted).`);
        }
    }

    if (validationFailed) {
        console.error(`\n🚨 Validation checks failed! Aborting without modifying the database.`);
        process.exit(1);
    }

    // Count changes
    let slugsToUpdate = 0;
    for (const [slug, newContent] of modifiedContents.entries()) {
        const original = articleMap.get(slug).content;
        if (newContent !== original) {
            slugsToUpdate++;
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Slugs in allowlist: ${allSlugs.length}`);
    console.log(`   Articles pending DB update: ${slugsToUpdate}`);

    if (!isApply) {
        console.log(`\n✨ Dry-run complete! All checks passed.`);
        console.log(`   Run with \`node prisma/fix-article-copy.cjs --apply\` to write changes to DB.`);
        return;
    }

    if (slugsToUpdate === 0) {
        console.log(`\n✅ Database is already up-to-date. 0 rows updated.`);
        return;
    }

    console.log(`\n💾 Applying changes to database...`);
    let rowsUpdated = 0;
    for (const [slug, newContent] of modifiedContents.entries()) {
        const original = articleMap.get(slug).content;
        if (newContent !== original) {
            await prisma.article.update({
                where: { slug },
                data: { content: newContent },
            });
            console.log(`   ✓ Updated [${slug}]`);
            rowsUpdated++;
        }
    }

    // Post-apply check: remaining hits
    const verifyArticles = await prisma.article.findMany({
        where: { slug: { in: allSlugs } },
        select: { slug: true, content: true },
    });

    let remainingCliches = 0;
    let remainingMarkdown = 0;

    for (const a of verifyArticles) {
        if (/game[- ]changer/i.test(a.content)) remainingCliches++;
        if (MARKDOWN_TARGET_SLUGS.includes(a.slug) && MARKDOWN_DETECT.test(a.content)) remainingMarkdown++;
    }

    console.log(`\n🎉 Apply complete:`);
    console.log(`   Rows updated: ${rowsUpdated}`);
    console.log(`   Remaining game-changer hits in target articles: ${remainingCliches}`);
    console.log(`   Remaining markdown ** hits in target articles: ${remainingMarkdown}`);

    if (remainingCliches > 0 || remainingMarkdown > 0) {
        console.error(`🚨 Warning: Found remaining hits after apply!`);
        process.exit(1);
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main()
    .catch(async (e) => {
        console.error('❌ Error during fix execution:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
