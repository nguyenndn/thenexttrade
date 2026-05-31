import fs from 'fs';
import path from 'path';

const inlinePromptsPath = path.join(process.cwd(), 'inline-images-to-generate.json');
const scratchDir = path.join(process.cwd(), 'scratch');

function tokenize(text) {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()"?]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(w => w.length > 3) // words with length > 3
  );
}

function main() {
  if (!fs.existsSync(inlinePromptsPath)) {
    console.error('❌ inline-images-to-generate.json not found!');
    return;
  }

  const inlinePrompts = JSON.parse(fs.readFileSync(inlinePromptsPath, 'utf-8'));
  console.log(`📋 Total inline image definitions loaded: ${inlinePrompts.length}`);

  const publicDir = path.join(process.cwd(), 'public');

  let missingCount = 0;
  let emptyCount = 0;
  let okCount = 0;

  const results = [];
  const stopWords = new Set(['about', 'their', 'there', 'would', 'should', 'could', 'these', 'those', 'other', 'another']);

  for (const item of inlinePrompts) {
    const cleanPath = item.imagePath.split('?')[0].split('#')[0];
    const absolutePath = path.join(publicDir, cleanPath.replace(/^\//, ''));
    const fileExists = fs.existsSync(absolutePath);

    let status = 'UNKNOWN';
    let size = 0;
    
    if (!fileExists) {
      status = 'MISSING';
      missingCount++;
    } else {
      const stats = fs.statSync(absolutePath);
      size = stats.size;
      if (size === 0) {
        status = 'EMPTY';
        emptyCount++;
      } else {
        status = 'OK';
        okCount++;
      }
    }

    // Semantic alignment between context and article title
    const titleTokens = tokenize(item.articleTitle);
    const contextTokens = tokenize(item.context);

    // Key terms from title
    const keyTitleWords = [...titleTokens].filter(w => !stopWords.has(w));
    // Check how many key title words are in the paragraph context
    const matchingWords = keyTitleWords.filter(w => contextTokens.has(w));
    
    const overlapRatio = keyTitleWords.length > 0 ? (matchingWords.length / keyTitleWords.length) : 0;

    results.push({
      slug: item.slug,
      articleTitle: item.articleTitle,
      imageName: item.imageName,
      imagePath: item.imagePath,
      index: item.index,
      context: item.context,
      status,
      size,
      alignment: {
        percentage: Math.round(overlapRatio * 100),
        matchingWords,
        keyTitleWords
      }
    });
  }

  // Calculate average overlap
  const totalPercentage = results.reduce((acc, r) => acc + r.alignment.percentage, 0);
  const averagePercentage = results.length > 0 ? Math.round(totalPercentage / results.length) : 0;

  const reportPath = path.join(scratchDir, 'inline-images-qa-results.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    summary: {
      total: inlinePrompts.length,
      ok: okCount,
      missing: missingCount,
      empty: emptyCount,
      averageSemanticOverlapPercentage: averagePercentage
    },
    results
  }, null, 2), 'utf-8');

  console.log('\n📊 ====== INLINE IMAGES QA REPORT ======');
  console.log(`📦 Total Inline Images scanned: ${inlinePrompts.length}`);
  console.log(`✅ Files exist and valid (OK):  ${okCount}`);
  console.log(`❌ Files missing:               ${missingCount}`);
  console.log(`❌ Files empty (0 bytes):       ${emptyCount}`);
  console.log(`🧠 Average Semantic Overlap:    ${averagePercentage}%`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📝 Saved full inline report to: ${reportPath}\n`);

  // Print top 3 cases
  console.log('--- Printing top 3 exemplary cases ---');
  results.slice(0, 3).forEach((r, i) => {
    console.log(`Case #${i+1}:`);
    console.log(`  Article: "${r.articleTitle}"`);
    console.log(`  Image:   ${r.imageName}`);
    console.log(`  Overlap: ${r.alignment.percentage}%`);
    console.log(`  Context: "${r.context.trim().replace(/\n/g, ' ')}"`);
    console.log('---');
  });
}

main();
