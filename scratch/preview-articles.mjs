import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'scratch', 'articles-content-summary.json');
const articles = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

console.log(`Loaded ${articles.length} articles.`);
console.log('--- Printing first 3 articles ---');
for (let i = 0; i < Math.min(3, articles.length); i++) {
  console.log(`Article #${i+1}:`);
  console.log(`  Title: ${articles[i].title}`);
  console.log(`  Slug: ${articles[i].slug}`);
  console.log(`  Category: ${articles[i].category}`);
  console.log(`  Thumbnail: ${articles[i].thumbnail}`);
  console.log(`  Word Count: ${articles[i].wordCount}`);
  console.log(`  Headings:`, articles[i].headings.map(h => `${'#'.repeat(h.level)} ${h.text}`));
  console.log(`  Inline Images:`, articles[i].inlineImages.map(img => img.url));
  console.log('--------------------------------');
}
