import fs from 'fs';
import path from 'path';

const reportPath = path.join(process.cwd(), 'scratch', 'semantic-alignment-report.json');
const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

console.log('--- Printing top 4 high overlap examples ---');
const reports = reportData.reports;
// Sort by overlapRatio descending
reports.sort((a, b) => b.semanticOverlap.overlapRatio - a.semanticOverlap.overlapRatio);

reports.slice(0, 4).forEach((r, i) => {
  console.log(`Example #${i+1}:`);
  console.log(`  Title: ${r.title}`);
  console.log(`  Slug: ${r.slug}`);
  console.log(`  Category: ${r.category}`);
  console.log(`  Overlap: ${r.semanticOverlap.percentage}%`);
  console.log(`  Title Keywords: ${r.semanticOverlap.keyTitleWords.join(', ')}`);
  console.log(`  Matched in Prompt: ${r.semanticOverlap.matchingWords.join(', ')}`);
  console.log('----------------');
});
