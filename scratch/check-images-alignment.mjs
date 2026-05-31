import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const dataPath = path.join(process.cwd(), 'scratch', 'articles-content-summary.json');
const articles = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

console.log(`🔍 Total articles loaded for QA: ${articles.length}`);

const publicDir = path.join(process.cwd(), 'public');

// Track stats
let missingFeaturedCount = 0;
let missingInlineCount = 0;
let mismatchFeaturedCount = 0; // thumbnail points to a different slug/article
let duplicateFeaturedCount = 0; // multiple articles sharing the same image file

const featuredFileToArticles = new Map(); // path -> Array of articles
const inlineFileToArticles = new Map(); // path -> Array of articles

const results = [];

// Helper to calculate file md5 hash (if exists)
function getFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('md5');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch {
    return null;
  }
}

for (const a of articles) {
  const articleResult = {
    title: a.title,
    slug: a.slug,
    category: a.category,
    thumbnail: a.thumbnail,
    thumbnailStatus: 'UNKNOWN',
    thumbnailError: null,
    inlineImages: [],
    issues: []
  };

  // 1. Featured Image QA
  if (!a.thumbnail || a.thumbnail.trim() === '') {
    articleResult.thumbnailStatus = 'MISSING';
    articleResult.issues.push('Featured image path is null or empty');
    missingFeaturedCount++;
  } else {
    // Check if it is local or remote
    const isRemote = a.thumbnail.startsWith('http://') || a.thumbnail.startsWith('https://');
    if (isRemote) {
      articleResult.thumbnailStatus = 'REMOTE';
      // For remote, we just assume it exists for now, or flags as remote
    } else {
      const cleanPath = a.thumbnail.split('?')[0].split('#')[0];
      const absolutePath = path.join(publicDir, cleanPath.replace(/^\//, ''));
      
      const fileExists = fs.existsSync(absolutePath);
      
      // Check for mismatch: name of the featured image should match the article slug
      const fileBasename = path.basename(cleanPath, path.extname(cleanPath));
      if (fileBasename !== a.slug && fileBasename !== 'default' && fileBasename !== 'placeholder') {
        mismatchFeaturedCount++;
        articleResult.issues.push(`Featured image filename (${fileBasename}) does not match article slug (${a.slug})`);
      }

      if (!fileExists) {
        articleResult.thumbnailStatus = 'FILE_NOT_FOUND';
        articleResult.issues.push(`Featured image file does not exist on disk: ${a.thumbnail}`);
        missingFeaturedCount++;
      } else {
        const stats = fs.statSync(absolutePath);
        if (stats.size === 0) {
          articleResult.thumbnailStatus = 'EMPTY_FILE';
          articleResult.issues.push(`Featured image file is empty (0 bytes): ${a.thumbnail}`);
          missingFeaturedCount++;
        } else {
          articleResult.thumbnailStatus = 'OK';
          // Record path for duplication check
          if (!featuredFileToArticles.has(absolutePath)) {
            featuredFileToArticles.set(absolutePath, []);
          }
          featuredFileToArticles.get(absolutePath).push(a);
        }
      }
    }
  }

  // 2. Inline Images QA
  for (const img of a.inlineImages) {
    const inlineResult = {
      tag: img.tag,
      url: img.url,
      type: img.type,
      status: 'UNKNOWN',
      issue: null
    };

    if (!img.url || img.url.trim() === '') {
      inlineResult.status = 'MISSING';
      inlineResult.issue = 'Inline image URL is empty';
      missingInlineCount++;
    } else {
      const isRemote = img.url.startsWith('http://') || img.url.startsWith('https://');
      if (isRemote) {
        inlineResult.status = 'REMOTE';
      } else {
        const cleanPath = img.url.split('?')[0].split('#')[0];
        const absolutePath = path.join(publicDir, cleanPath.replace(/^\//, ''));
        const fileExists = fs.existsSync(absolutePath);

        // Check for mismatch: inline image should contain the slug
        const fileBasename = path.basename(cleanPath);
        if (!fileBasename.includes(a.slug) && !fileBasename.startsWith('inline-') && fileBasename !== 'default.png') {
          inlineResult.issue = `Inline image filename (${fileBasename}) does not contain article slug (${a.slug})`;
          articleResult.issues.push(`Inline image mismatch: ${img.url}`);
        }

        if (!fileExists) {
          inlineResult.status = 'FILE_NOT_FOUND';
          inlineResult.issue = `Inline image file not found: ${img.url}`;
          missingInlineCount++;
          articleResult.issues.push(`Missing inline image: ${img.url}`);
        } else {
          const stats = fs.statSync(absolutePath);
          if (stats.size === 0) {
            inlineResult.status = 'EMPTY_FILE';
            inlineResult.issue = `Inline image file is empty: ${img.url}`;
            missingInlineCount++;
            articleResult.issues.push(`Empty inline image: ${img.url}`);
          } else {
            inlineResult.status = 'OK';
            // Record path for duplication check
            if (!inlineFileToArticles.has(absolutePath)) {
              inlineFileToArticles.set(absolutePath, []);
            }
            inlineFileToArticles.get(absolutePath).push(a);
          }
        }
      }
    }
    articleResult.inlineImages.push(inlineResult);
  }

  results.push(articleResult);
}

// 3. Post-processing: Check for Duplications (different articles sharing the exact same featured image file)
const duplicatesList = [];
for (const [filePath, arts] of featuredFileToArticles.entries()) {
  if (arts.length > 1) {
    duplicateFeaturedCount += (arts.length - 1);
    const relativePath = path.relative(publicDir, filePath).replace(/\\/g, '/');
    duplicatesList.push({
      image: '/' + relativePath,
      articlesCount: arts.length,
      articles: arts.map(art => ({ title: art.title, slug: art.slug }))
    });
    
    // Add issue to articles
    for (const art of arts) {
      const found = results.find(r => r.slug === art.slug);
      if (found) {
        found.issues.push(`Featured image is SHARED with ${arts.length - 1} other article(s): /${relativePath}`);
      }
    }
  }
}

// Write the reports
const reportsDir = path.join(process.cwd(), 'scratch');
const jsonReportPath = path.join(reportsDir, 'images-qa-results.json');
fs.writeFileSync(jsonReportPath, JSON.stringify({
  summary: {
    totalArticles: articles.length,
    missingFeaturedCount,
    missingInlineCount,
    mismatchFeaturedCount,
    duplicateFeaturedCount,
  },
  duplicatesList,
  results
}, null, 2), 'utf-8');

console.log('\n📊 ====== QA AUDIT SUMMARY ======');
console.log(`📦 Total PUBLISHED Articles:  ${articles.length}`);
console.log(`❌ Articles with Missing Featured Image:  ${missingFeaturedCount}`);
console.log(`❌ Missing Inline Images total:          ${missingInlineCount}`);
console.log(`⚠️ Mismatch Featured Slug Filenames:     ${mismatchFeaturedCount}`);
console.log(`⚠️ Duplicate Shared Featured Images:      ${duplicateFeaturedCount}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ Saved detailed QA report to: ${jsonReportPath}\n`);

// Display some key mismatch cases
const mismatchCases = results.filter(r => r.issues.length > 0);
console.log(`🔍 Total articles with image alignment or existence issues: ${mismatchCases.length}`);
console.log('Listing top 5 issue cases:\n');
mismatchCases.slice(0, 5).forEach((mc, i) => {
  console.log(`Case #${i+1}: "${mc.title}" (${mc.category})`);
  console.log(`  Slug: ${mc.slug}`);
  console.log(`  Thumbnail: ${mc.thumbnail}`);
  console.log(`  Issues:`);
  mc.issues.forEach(issue => console.log(`    - ${issue}`));
  console.log('---');
});
