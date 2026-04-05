/**
 * Scrape-to-Files Script
 * 
 * Steps 1-3 of the content pipeline: Search → Select → Scrape
 * Saves results as .md files in /content/data/{level}/{module}/{lesson}.md
 * 
 * Usage: node prisma/scrape-to-files.js [level_number]
 * Example: node prisma/scrape-to-files.js 1
 */

const { PrismaClient } = require("@prisma/client");
const { mkdir, writeFile, readFile } = require("fs/promises");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const prisma = new PrismaClient();

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

const TONE_MAP = {
  1: "conversational", 2: "conversational",
  3: "mentor", 4: "mentor",
  5: "storytelling", 6: "storytelling",
  7: "motivational", 8: "tactical",
  9: "professional", 10: "tactical",
  11: "professional", 12: "mentor",
};

// Slugify helper for folder names
function slugify(text, prefix = "") {
  const slug = text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  return prefix ? `${prefix}-${slug}` : slug;
}

// ============================================================================
// SEARCH
// ============================================================================

async function searchTopic(topic) {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": SERPER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: `${topic} forex trading guide`,
      num: 10,
    }),
  });
  if (!res.ok) throw new Error(`Serper ${res.status}`);
  const data = await res.json();
  return (data.organic || []).map((r) => ({
    title: r.title,
    url: r.link,
    snippet: r.snippet || "",
    position: r.position,
  }));
}

function selectBestSources(results) {
  const dominated = ["youtube.com", "tiktok.com", "facebook.com", "twitter.com", "reddit.com"];
  const preferred = ["babypips.com", "investopedia.com", "ig.com", "forex.com", "dailyfx.com", "fxstreet.com"];

  const filtered = results.filter((r) => {
    try {
      const host = new URL(r.url).hostname;
      return !dominated.some((d) => host.includes(d));
    } catch {
      return false;
    }
  });

  // Sort: preferred first
  filtered.sort((a, b) => {
    const aHost = new URL(a.url).hostname;
    const bHost = new URL(b.url).hostname;
    const aScore = preferred.some((p) => aHost.includes(p)) ? 0 : 1;
    const bScore = preferred.some((p) => bHost.includes(p)) ? 0 : 1;
    return aScore - bScore;
  });

  return filtered.slice(0, 3);
}

// ============================================================================
// SCRAPE
// ============================================================================

async function scrapeUrl(url) {
  // Firecrawl
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
    });
    if (!res.ok) throw new Error(`Firecrawl ${res.status}`);
    const data = await res.json();
    const md = data.data?.markdown || "";
    const title = data.data?.metadata?.title || new URL(url).hostname;
    if (md.length < 100) throw new Error("Too short");

    // Extract images
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images = [];
    const skipPatterns = /icon|logo|favicon|avatar|badge|button|banner|ad-|pixel|tracking|sprite|thumb-small|1x1/i;
    let match;
    while ((match = imgRegex.exec(md)) !== null) {
      const alt = match[1].trim();
      const imgUrl = match[2].trim();
      if (skipPatterns.test(imgUrl) || skipPatterns.test(alt)) continue;
      if (imgUrl.startsWith("data:") || imgUrl.length < 20) continue;
      let fullUrl = imgUrl;
      if (imgUrl.startsWith("/")) {
        const base = new URL(url);
        fullUrl = `${base.origin}${imgUrl}`;
      }
      images.push({ alt: alt || "Illustration", url: fullUrl });
    }

    const cleanMd = md.replace(/!\[[^\]]*\]\([^)]+\)/g, "").substring(0, 8000);
    return { content: cleanMd, title, images: images.slice(0, 4) };
  } catch (e) {
    console.log(`    ⚠️ Firecrawl failed for ${url}: ${e.message}`);
  }

  // Fallback
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Fetch ${res.status}`);
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 6000);
    if (text.length < 100) throw new Error("Too short");
    return { content: text, title: titleMatch?.[1]?.trim() || "", images: [] };
  } catch (e) {
    console.log(`    ❌ Fallback failed: ${e.message}`);
    return null;
  }
}

// ============================================================================
// SAVE TO .MD FILE
// ============================================================================

function buildMarkdown(lesson, module, level, tone, sources, images) {
  const lines = [];

  // Frontmatter
  lines.push("---");
  lines.push(`title: "${lesson.title}"`);
  lines.push(`slug: "${lesson.slug}"`);
  lines.push(`level: ${level.order}`);
  lines.push(`level_title: "${level.title}"`);
  lines.push(`module: "${module.title}"`);
  lines.push(`tone: "${tone}"`);
  lines.push(`status: "scraped"`);
  lines.push(`scraped_at: "${new Date().toISOString()}"`);
  lines.push(`sources_count: ${sources.length}`);
  lines.push(`images_count: ${images.length}`);
  lines.push("---");
  lines.push("");

  // Writing instructions
  lines.push("# Writing Brief");
  lines.push("");
  lines.push(`**Lesson:** ${lesson.title}`);
  lines.push(`**Module:** ${module.title} (Module ${module.order})`);
  lines.push(`**Level:** ${level.order} — ${level.title}`);
  lines.push(`**Tone:** ${tone}`);
  lines.push(`**Target:** ${level.order <= 3 ? "Beginner" : level.order <= 6 ? "Intermediate" : level.order <= 9 ? "Advanced" : "Expert"}`);
  lines.push("");
  lines.push("> Use `/content_academy` workflow to write this lesson.");
  lines.push("> Read all sources below, then apply copywriting + psychology hooks.");
  lines.push("");

  // Images
  if (images.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## Available Images");
    lines.push("");
    images.forEach((img, i) => {
      lines.push(`- **[IMAGE_${i + 1}]:** ${img.alt}`);
      lines.push(`  URL: ${img.url}`);
    });
    lines.push("");
  }

  // Source content
  lines.push("---");
  lines.push("");
  lines.push("## Source Content");
  lines.push("");

  sources.forEach((src, i) => {
    lines.push(`### Source ${i + 1}: ${src.title}`);
    lines.push(`> URL: ${src.url}`);
    lines.push("");
    lines.push(src.content);
    lines.push("");
    if (i < sources.length - 1) lines.push("---");
    lines.push("");
  });

  return lines.join("\n");
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const targetLevel = parseInt(process.argv[2]) || 1;

  console.log("=".repeat(60));
  console.log(`📂 Scrape-to-Files — Level ${targetLevel}`);
  console.log("=".repeat(60));

  if (!SERPER_API_KEY || !FIRECRAWL_API_KEY) {
    console.error("❌ Missing SERPER_API_KEY or FIRECRAWL_API_KEY in .env.local");
    process.exit(1);
  }

  const level = await prisma.level.findFirst({
    where: { order: targetLevel },
    include: {
      modules: {
        include: { lessons: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!level) {
    console.error(`❌ Level ${targetLevel} not found`);
    process.exit(1);
  }

  const tone = TONE_MAP[level.order] || "conversational";
  const levelFolder = `level-${String(level.order).padStart(2, "0")}-${slugify(level.title)}`;
  const baseDir = path.join(process.cwd(), "content", "data", levelFolder);

  console.log(`\n📚 Level ${level.order}: ${level.title}`);
  console.log(`📁 Output: content/data/${levelFolder}/`);
  console.log(`🎯 Tone: ${tone}\n`);

  let total = 0;
  let success = 0;
  let failed = 0;

  for (const mod of level.modules) {
    const modFolder = `module-${String(mod.order).padStart(2, "0")}-${slugify(mod.title)}`;
    const modDir = path.join(baseDir, modFolder);
    await mkdir(modDir, { recursive: true });

    console.log(`\n📦 Module ${mod.order}: ${mod.title}`);

    for (const lesson of mod.lessons) {
      total++;
      console.log(`\n  📝 ${lesson.order}. ${lesson.title}`);

      try {
        // Step 1: Search
        console.log("     🔍 Searching...");
        const searchResults = await searchTopic(lesson.title);
        console.log(`     Found ${searchResults.length} results`);

        // Step 2: Select best sources
        const selected = selectBestSources(searchResults);
        console.log(`     ✅ Selected ${selected.length} sources:`);
        selected.forEach((s) => console.log(`        - ${s.title.substring(0, 60)}...`));

        // Step 3: Scrape
        console.log("     📥 Scraping...");
        const scraped = [];
        for (const src of selected) {
          const result = await scrapeUrl(src.url);
          if (result) {
            scraped.push({ ...result, url: src.url });
          } else if (src.snippet && src.snippet.length > 20) {
            scraped.push({ content: src.snippet, title: src.title, url: src.url, images: [] });
          }
        }
        console.log(`     Scraped ${scraped.length}/${selected.length} sources`);

        if (scraped.length === 0) {
          console.log("     ❌ No content — creating empty file");
          failed++;
          continue;
        }

        // Collect images
        const seenUrls = new Set();
        const allImages = [];
        for (const s of scraped) {
          for (const img of (s.images || [])) {
            if (!seenUrls.has(img.url)) {
              seenUrls.add(img.url);
              allImages.push(img);
            }
          }
        }
        const images = allImages.slice(0, 6);
        console.log(`     🖼️  ${images.length} images found`);

        // Step 4: Save to .md
        const mdContent = buildMarkdown(lesson, mod, level, tone, scraped, images);
        const filePath = path.join(modDir, `${lesson.slug}.md`);
        await writeFile(filePath, mdContent, "utf-8");

        console.log(`     💾 Saved: ${lesson.slug}.md (${(mdContent.length / 1024).toFixed(1)} KB)`);
        success++;

        // Rate limit pause
        await new Promise((r) => setTimeout(r, 2000));

      } catch (e) {
        console.log(`     ❌ Error: ${e.message}`);
        failed++;
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`✅ Done! Total: ${total} | Success: ${success} | Failed: ${failed}`);
  console.log(`📁 Files saved to: content/data/${levelFolder}/`);
  console.log("=".repeat(60));

  await prisma.$disconnect();
}

main().catch(console.error);
