/**
 * Save ALL lesson content for a module to DB
 * Reads .html (written content) + .md (raw source) for each lesson
 * Saves: content, rawContent, sourceUrls, tone, status
 * 
 * Usage: node prisma/save-module-content.js <module-folder>
 * Example: node prisma/save-module-content.js content/data/level-01-first-steps/module-01-welcome-to-the-market
 */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { readdir, readFile } = require("fs/promises");
const path = require("path");

const prisma = new PrismaClient();

/**
 * Parse frontmatter and source URLs from the .md brief file
 */
function parseMdBrief(mdContent) {
  const result = { tone: "", sourceUrls: [], rawContent: "" };

  // Extract tone from frontmatter
  const toneMatch = mdContent.match(/^tone:\s*"?([^"\n]+)"?/m);
  if (toneMatch) result.tone = toneMatch[1].trim();

  // Extract source URLs
  const urlRegex = /^>\s*URL:\s*(https?:\/\/[^\s]+)/gm;
  let match;
  while ((match = urlRegex.exec(mdContent)) !== null) {
    result.sourceUrls.push(match[1].trim());
  }

  // Extract raw content (everything after "## Source Content")
  const sourceIdx = mdContent.indexOf("## Source Content");
  if (sourceIdx !== -1) {
    result.rawContent = mdContent.substring(sourceIdx).trim();
  } else {
    // Fallback: use the entire md as raw content
    result.rawContent = mdContent;
  }

  return result;
}

async function main() {
  const folder = process.argv[2];
  if (!folder) {
    console.error("Usage: node save-module-content.js <module-folder>");
    process.exit(1);
  }

  const absFolder = path.resolve(folder);
  console.log(`📂 Module folder: ${absFolder}`);

  // Find all .html files (written content)
  const allFiles = await readdir(absFolder);
  const htmlFiles = allFiles.filter(f => f.endsWith(".html"));
  console.log(`📝 Found ${htmlFiles.length} HTML files\n`);

  if (htmlFiles.length === 0) {
    console.log("No .html content files found. Write content first!");
    process.exit(0);
  }

  let saved = 0;
  let failed = 0;

  for (const file of htmlFiles) {
    const slug = file.replace(".html", "");
    const htmlPath = path.join(absFolder, file);
    const mdPath = path.join(absFolder, `${slug}.md`);

    try {
      // Read written HTML content
      const content = await readFile(htmlPath, "utf-8");

      // Read .md brief for rawContent + sourceUrls + tone
      let brief = { tone: "", sourceUrls: [], rawContent: "" };
      try {
        const mdContent = await readFile(mdPath, "utf-8");
        brief = parseMdBrief(mdContent);
      } catch {
        console.log(`  ⚠️  No .md brief found for: ${slug}`);
      }

      // Find lesson in DB
      const lesson = await prisma.lesson.findFirst({ where: { slug } });
      if (!lesson) {
        console.log(`  ⚠️  Slug not found in DB: ${slug}`);
        failed++;
        continue;
      }

      // Save all fields
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: {
          content,
          rawContent: brief.rawContent || null,
          tone: brief.tone || null,
          sourceUrls: brief.sourceUrls,
          status: "published",
        },
      });

      console.log(`  ✅ ${lesson.title}`);
      console.log(`     📦 Content: ${(content.length / 1024).toFixed(1)} KB | Tone: ${brief.tone || "–"} | Sources: ${brief.sourceUrls.length}`);
      saved++;
    } catch (err) {
      console.log(`  ❌ ${slug}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n============================`);
  console.log(`✅ Saved: ${saved} | ❌ Failed: ${failed}`);
  console.log(`============================`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Error:", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
