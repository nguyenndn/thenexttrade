/**
 * Fix all figure/figcaption elements - use !important to override Tailwind prose defaults
 */
const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'content', 'data', 'level-01-first-steps');

const moduleDirs = [
  'module-01-welcome-to-the-market',
  'module-02-understanding-margin-orders'
];

let totalFixed = 0;

for (const moduleDir of moduleDirs) {
  const dir = path.join(CONTENT_DIR, moduleDir);
  if (!fs.existsSync(dir)) continue;

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
  
  console.log(`\n📁 ${moduleDir}`);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    let html = fs.readFileSync(filePath, 'utf-8');
    let changes = 0;

    // Fix ANY figure tag (with or without existing style) → centered with !important
    html = html.replace(
      /<figure[^>]*>/g,
      '<figure class="lesson-image" style="text-align: center !important; margin: 2rem auto !important; display: block;">'
    );

    // Fix ANY figcaption tag (with or without existing style) → italic + centered with !important
    html = html.replace(
      /<figcaption[^>]*>/g,
      '<figcaption style="text-align: center !important; font-style: italic !important; font-size: 0.875rem; color: #6b7280; margin-top: 0.75rem;">'
    );

    // Also ensure img inside figure is centered
    html = html.replace(
      /(<figure[^>]*>)\s*(<img )/g,
      '$1\n  $2'
    );

    // Check if any figure exists
    if (html.includes('<figure')) {
      changes++;
    }

    if (changes > 0) {
      fs.writeFileSync(filePath, html, 'utf-8');
      const figCount = (html.match(/<figure/g) || []).length;
      console.log(`  ✅ ${file} — ${figCount} figures updated`);
      totalFixed++;
    } else {
      console.log(`  ⏭️ ${file} — no figures`);
    }
  }
}

console.log(`\n🎉 Done! Updated ${totalFixed} files.`);
