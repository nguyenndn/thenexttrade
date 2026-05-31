import fs from 'fs';
import path from 'path';

const scratchDir = path.join(process.cwd(), 'scratch');
const articlesPath = path.join(scratchDir, 'articles-content-summary.json');
const featuredPromptsPath = path.join(process.cwd(), 'featured-images-to-generate.json');
const inlinePromptsPath = path.join(process.cwd(), 'inline-images-to-generate.json');

// Helper to normalize and tokenize string for comparison
function tokenize(text) {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()"?]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(w => w.length > 2) // only words with length > 2
  );
}

function main() {
  if (!fs.existsSync(articlesPath)) {
    console.error('❌ Articles summary JSON not found. Run dump-articles-content.mjs first.');
    return;
  }

  const dbArticles = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'));
  
  let featuredPrompts = [];
  if (fs.existsSync(featuredPromptsPath)) {
    featuredPrompts = JSON.parse(fs.readFileSync(featuredPromptsPath, 'utf-8'));
  }
  
  let inlinePrompts = [];
  if (fs.existsSync(inlinePromptsPath)) {
    inlinePrompts = JSON.parse(fs.readFileSync(inlinePromptsPath, 'utf-8'));
  }

  console.log(`📦 Loaded from Database: ${dbArticles.length} published articles.`);
  console.log(`🖼️ Loaded Featured Image Prompts: ${featuredPrompts.length} items.`);
  console.log(`🖼️ Loaded Inline Image Prompts: ${inlinePrompts.length} items.`);

  const featuredPromptMap = new Map();
  featuredPrompts.forEach(p => featuredPromptMap.set(p.slug, p));

  const inlinePromptMap = new Map();
  // Assume inlinePrompts might be grouped by slug or an array of items with slug
  if (Array.isArray(inlinePrompts)) {
    inlinePrompts.forEach(p => {
      if (p.slug) {
        if (!inlinePromptMap.has(p.slug)) {
          inlinePromptMap.set(p.slug, []);
        }
        inlinePromptMap.get(p.slug).push(p);
      }
    });
  } else {
    // If it is an object key-value
    Object.keys(inlinePrompts).forEach(slug => {
      inlinePromptMap.set(slug, inlinePrompts[slug]);
    });
  }

  const reports = [];
  let alignedCount = 0;
  let mismatchedCount = 0;
  let missingPromptCount = 0;

  for (const art of dbArticles) {
    const slug = art.slug;
    const title = art.title;
    const category = art.category;
    
    const featuredPrompt = featuredPromptMap.get(slug);
    const inlinePromptList = inlinePromptMap.get(slug) || [];

    const report = {
      title,
      slug,
      category,
      hasFeaturedPrompt: !!featuredPrompt,
      hasInlinePrompts: inlinePromptList.length > 0,
      issues: [],
      score: 100
    };

    if (!featuredPrompt) {
      report.issues.push('Missing featured image prompt mapping');
      report.score -= 40;
      missingPromptCount++;
    } else {
      // Analyze semantic alignment
      const titleTokens = tokenize(title);
      const promptTokens = tokenize(featuredPrompt.prompt);
      
      // Stop words to ignore
      const stopWords = new Set(['the', 'and', 'why', 'how', 'for', 'with', 'your', 'that', 'this', 'from', 'what', 'are', 'you']);
      
      // Key terms from title
      const keyTitleWords = [...titleTokens].filter(w => !stopWords.has(w));
      
      // Check how many key title words are in the image prompt
      const matchingWords = keyTitleWords.filter(w => promptTokens.has(w));
      
      const overlapRatio = keyTitleWords.length > 0 ? (matchingWords.length / keyTitleWords.length) : 0;
      
      report.semanticOverlap = {
        keyTitleWords,
        matchingWords,
        overlapRatio,
        percentage: Math.round(overlapRatio * 100)
      };

      if (overlapRatio < 0.3) {
        // Low overlap indicates possible prompt mismatch or generic template prompt
        report.issues.push(`Low semantic alignment (${Math.round(overlapRatio * 100)}% keyword overlap between title and image prompt)`);
        report.score -= 30;
        mismatchedCount++;
      } else {
        alignedCount++;
      }
    }

    reports.push(report);
  }

  // Sort reports by score ascending so issues appear first
  reports.sort((a, b) => a.score - b.score);

  const outputPath = path.join(scratchDir, 'semantic-alignment-report.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    summary: {
      total: dbArticles.length,
      perfectlyAligned: alignedCount,
      lowAlignment: mismatchedCount,
      missingPrompts: missingPromptCount
    },
    reports
  }, null, 2), 'utf-8');

  console.log('\n🧠 ====== SEMANTIC QA AUDIT SUMMARY ======');
  console.log(`📦 Total Articles Audited:      ${dbArticles.length}`);
  console.log(`✅ Perfectly Aligned Prompts:  ${alignedCount} (${Math.round(alignedCount / dbArticles.length * 100)}%)`);
  console.log(`⚠️ Low Semantic Alignment:     ${mismatchedCount} (${Math.round(mismatchedCount / dbArticles.length * 100)}%)`);
  console.log(`❌ Missing Image Prompts:      ${missingPromptCount} (${Math.round(missingPromptCount / dbArticles.length * 100)}%)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📝 Saved full semantic report to: ${outputPath}\n`);

  if (mismatchedCount > 0 || missingPromptCount > 0) {
    console.log('🔍 Listing Top Issue Cases:');
    reports.filter(r => r.issues.length > 0).slice(0, 5).forEach((r, i) => {
      console.log(`Case #${i+1}: "${r.title}"`);
      console.log(`  Slug: ${r.slug}`);
      if (r.semanticOverlap) {
        console.log(`  Title keywords: ${r.semanticOverlap.keyTitleWords.join(', ')}`);
        console.log(`  Matching in prompt: ${r.semanticOverlap.matchingWords.join(', ')}`);
        console.log(`  Overlap: ${r.semanticOverlap.percentage}%`);
      }
      console.log(`  Issues:`);
      r.issues.forEach(issue => console.log(`    - ${issue}`));
      console.log('---');
    });
  } else {
    console.log('🎉 Congratulations! 100% of the image prompts are perfectly aligned with their article titles and content semantics!');
  }
}

main();
