/**
 * Academy Content Generator — Option A2
 * 
 * Replicates the AI Rewrite Pipeline:
 * 1. Search topic via Serper API
 * 2. Auto-select top 3 quality sources
 * 3. Scrape via Firecrawl (+ YouTube transcript)
 * 4. Rewrite via Gemini with tone per level
 * 5. Save to DB via Prisma
 * 
 * Usage: node prisma/generate-content.js [levelOrder]
 * Example: node prisma/generate-content.js 1
 */

require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { readFile } = require("fs/promises");
const path = require("path");

const prisma = new PrismaClient();

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Tone mapping per level
const TONE_MAP = {
  1: "conversational",
  2: "conversational",
  3: "mentor",
  4: "mentor",
  5: "analytical",
  6: "analytical",
  7: "motivational",
  8: "tactical",
  9: "professional",
  10: "tactical",
  11: "professional",
  12: "mentor",
};

// Domains to skip
const SKIP_DOMAINS = ["reddit.com", "x.com", "twitter.com", "quora.com", "pinterest.com", "tiktok.com"];

// ============================================================================
// SEARCH
// ============================================================================

async function searchTopic(topic) {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      q: `${topic} forex trading explained`,
      num: 10,
    }),
  });
  if (!res.ok) throw new Error(`Serper failed: ${res.status}`);
  const data = await res.json();
  return (data.organic || []).map((item) => ({
    title: item.title || "",
    url: item.link || "",
    snippet: item.snippet || "",
  }));
}

function selectBestSources(results, maxSources = 3) {
  // Filter out junk domains
  const filtered = results.filter((r) => {
    const url = r.url.toLowerCase();
    return !SKIP_DOMAINS.some((d) => url.includes(d));
  });
  return filtered.slice(0, maxSources);
}

// ============================================================================
// SCRAPE (Firecrawl + fallback)
// ============================================================================

async function scrapeUrl(url) {
  // YouTube transcript
  if (url.includes("youtube.com/watch") || url.includes("youtu.be/")) {
    try {
      const { YoutubeTranscript } = require("youtube-transcript");
      const videoId = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
      if (!videoId) throw new Error("Invalid YouTube URL");
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      const text = transcript.map((t) => t.text).join(" ");
      if (text.length < 100) throw new Error("Transcript too short");
      return { content: text.substring(0, 6000), title: `YouTube (${videoId})` };
    } catch (e) {
      console.log(`    ⚠️ YouTube transcript failed: ${e.message}`);
      return null;
    }
  }

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

    // Extract images before stripping
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images = [];
    const skipPatterns = /icon|logo|favicon|avatar|badge|button|banner|ad-|pixel|tracking|sprite|thumb-small|1x1/i;
    let match;
    while ((match = imgRegex.exec(md)) !== null) {
      const alt = match[1].trim();
      const imgUrl = match[2].trim();
      // Skip tiny icons, logos, tracking pixels, ads
      if (skipPatterns.test(imgUrl) || skipPatterns.test(alt)) continue;
      // Skip data URIs and very short URLs
      if (imgUrl.startsWith("data:") || imgUrl.length < 20) continue;
      // Make relative URLs absolute
      let fullUrl = imgUrl;
      if (imgUrl.startsWith("/")) {
        const base = new URL(url);
        fullUrl = `${base.origin}${imgUrl}`;
      }
      images.push({ alt: alt || "Trading chart illustration", url: fullUrl });
    }

    const cleanMd = md.replace(/!\[[^\]]*\]\([^)]+\)/g, "").substring(0, 6000);
    return { content: cleanMd, title, images: images.slice(0, 4) }; // Max 4 images per source
  } catch (e) {
    console.log(`    ⚠️ Firecrawl failed for ${url}: ${e.message}, trying fallback...`);
  }

  // Fallback: simple fetch
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
      .substring(0, 5000);
    if (text.length < 100) throw new Error("Too short");
    return { content: text, title: titleMatch?.[1]?.trim() || "", images: [] };
  } catch (e) {
    console.log(`    ❌ Fallback failed: ${e.message}`);
    return null;
  }
}

async function scrapeMultipleSources(sources) {
  const scraped = [];
  for (const src of sources) {
    const result = await scrapeUrl(src.url);
    if (result) {
      scraped.push({ ...result, url: src.url });
    } else {
      // Use search snippet as last resort
      if (src.snippet && src.snippet.length > 20) {
        scraped.push({ content: src.snippet, title: src.title, url: src.url });
      }
    }
  }
  return scraped;
}

// ============================================================================
// AI REWRITE
// ============================================================================

async function loadFile(filePath) {
  try {
    return await readFile(filePath, "utf-8");
  } catch {
    return "";
  }
}

async function rewriteContent(lessonTitle, scrapedSources, tone, allImages) {
  const [systemPrompt, persona, toneInstructions] = await Promise.all([
    loadFile(path.join(process.cwd(), "content", "rewrite-system-prompt.md")),
    loadFile(path.join(process.cwd(), "content", "writer-persona.md")),
    loadFile(path.join(process.cwd(), "content", "tones", `${tone}.md`)),
  ]);

  // Build merged source content
  const mergedContent = scrapedSources
    .map(
      (s, i) =>
        `--- SOURCE ${i + 1} (${new URL(s.url).hostname}) ---\nTitle: ${s.title}\n\n${s.content}\n--- END SOURCE ${i + 1} ---`
    )
    .join("\n\n");

  // Build image instructions
  const imageInstructions = allImages.length > 0
    ? `\n## AVAILABLE IMAGES (use [IMAGE_1], [IMAGE_2], etc. as placeholders in your content WHERE relevant):\n${allImages.map((img, i) => `[IMAGE_${i + 1}]: "${img.alt}" (from ${new URL(img.url).hostname})`).join("\n")}\n\nRules for images:\n- Place [IMAGE_N] between paragraphs where the image helps illustrate the concept\n- Only use images that are RELEVANT to the surrounding text\n- Don't force images — if none fit a section, skip it\n- Maximum ${allImages.length} image placeholders allowed`
    : "\n## IMAGES: No images available for this lesson. Do NOT include any [IMAGE_N] placeholders.";

  const prompt = `${systemPrompt}

## WRITER PERSONA:
${persona}

${toneInstructions ? `## SELECTED TONE:\n${toneInstructions}` : ""}
${imageInstructions}

## LESSON TITLE (use this as the lesson subject):
${lessonTitle}

## SOURCE CONTENT TO REWRITE:
${mergedContent}

Remember: Output MUST be valid JSON only. No markdown code blocks. No extra text.
Format: {"title": "...", "content": "<h2>...</h2><p>...</p>...", "metaDescription": "..."}`;

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  // Retry with backoff for rate limits
  let text;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      text = result.response.text();
      break;
    } catch (e) {
      const msg = e.message || "";
      if ((msg.includes("429") || msg.includes("503")) && attempt < 3) {
        const wait = attempt * 60;
        console.log(`     ⏳ Rate limited — waiting ${wait}s (attempt ${attempt}/3)...`);
        await new Promise((r) => setTimeout(r, wait * 1000));
      } else {
        throw e;
      }
    }
  }
  if (!text) throw new Error("All retry attempts failed");

  // Parse JSON with robust fallbacks
  let parsed = null;

  // Attempt 1: Direct parse
  try {
    parsed = JSON.parse(text);
  } catch {
    // Attempt 2: Strip markdown code fences
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Attempt 3: Find JSON object boundaries
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
          parsed = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
        } catch {
          // Attempt 4: Regex extraction
          const titleMatch = cleaned.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          const metaMatch = cleaned.match(/"metaDescription"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          // For content, find the value between "content": " and the next unescaped " followed by } or ,
          const contentStart = cleaned.indexOf('"content"');
          let contentValue = "";
          if (contentStart !== -1) {
            const valueStart = cleaned.indexOf('"', contentStart + 9) + 1;
            // Walk through string handling escaped quotes
            let i = valueStart;
            while (i < cleaned.length) {
              if (cleaned[i] === '\\') { i += 2; continue; }
              if (cleaned[i] === '"') break;
              i++;
            }
            contentValue = cleaned.substring(valueStart, i);
          }
          parsed = {
            title: titleMatch?.[1] || lessonTitle,
            content: contentValue.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\") || cleaned,
            metaDescription: metaMatch?.[1] || "",
          };
        }
      } else {
        parsed = { title: lessonTitle, content: cleaned, metaDescription: "" };
      }
    }
  }

  // Clean content: replace image placeholders with real images, strip trailing garbage
  if (parsed && parsed.content) {
    parsed.content = parsed.content
      .replace(/\s*"\s*\}\s*"\s*\}\s*".*$/s, "")      // Remove trailing "}"}"} garbage
      .replace(/["{}\s]+$/g, "")                        // Clean trailing braces/quotes
      .trim();
  }

  return parsed;
}

// ============================================================================
// MAIN
// ============================================================================

async function processLesson(lesson, levelOrder) {
  const tone = TONE_MAP[levelOrder] || "conversational";

  console.log(`\n  📝 Processing: ${lesson.title}`);
  console.log(`     Tone: ${tone} | Slug: ${lesson.slug}`);

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
  const scraped = await scrapeMultipleSources(selected);
  console.log(`     Scraped ${scraped.length}/${selected.length} sources`);

  if (scraped.length === 0) {
    console.log("     ❌ No content scraped — SKIPPING");
    return false;
  }

  // Collect images from all sources (dedupe by URL, max 6 total)
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
  console.log(`     🖼️  Found ${images.length} images from sources`);

  // Step 4: Rewrite
  console.log("     🤖 Rewriting with Gemini...");
  const rewritten = await rewriteContent(lesson.title, scraped, tone, images);

  // Step 4b: Replace [IMAGE_N] placeholders with actual <figure><img> HTML
  if (rewritten.content && images.length > 0) {
    rewritten.content = rewritten.content.replace(/\[IMAGE_(\d+)\]/g, (match, num) => {
      const idx = parseInt(num) - 1;
      if (idx >= 0 && idx < images.length) {
        const img = images[idx];
        const alt = img.alt.replace(/"/g, '&quot;');
        return `<figure class="my-6"><img src="${img.url}" alt="${alt}" loading="lazy" class="rounded-lg w-full" /><figcaption class="text-sm text-gray-500 mt-2 text-center">${img.alt}</figcaption></figure>`;
      }
      return ""; // Remove invalid placeholders
    });
  }
  // Strip any remaining unreplaced placeholders
  rewritten.content = (rewritten.content || "").replace(/\[IMAGE_\d+\]/g, "");

  console.log(`     Generated: "${rewritten.title?.substring(0, 50)}..."`);

  // Step 5: Save to DB
  const sourceUrls = scraped.map((s) => s.url);
  const rawContent = scraped.map((s) => `## Source: ${s.url}\n\n${s.content}`).join("\n\n---\n\n");

  await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      content: rewritten.content || "",
      rawContent: rawContent.substring(0, 50000),
      metaDescription: rewritten.metaDescription || "",
      tone,
      sourceUrls,
      status: "draft",
    },
  });

  console.log(`     💾 Saved to DB (draft) | Sources: ${sourceUrls.length} | Images: ${images.length}`);
  return true;
}

async function main() {
  const targetLevel = parseInt(process.argv[2]) || 1;

  console.log("=".repeat(60));
  console.log(`🚀 Academy Content Generator — Level ${targetLevel}`);
  console.log("=".repeat(60));

  // Verify API keys
  if (!SERPER_API_KEY || !FIRECRAWL_API_KEY || !GEMINI_API_KEY) {
    console.error("❌ Missing API keys in .env.local");
    process.exit(1);
  }

  // Get level with modules and lessons
  const level = await prisma.level.findFirst({
    where: { order: targetLevel },
    include: {
      modules: {
        include: {
          lessons: { orderBy: { order: "asc" } },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!level) {
    console.error(`❌ Level ${targetLevel} not found`);
    process.exit(1);
  }

  console.log(`\n📚 Level ${level.order}: ${level.title}`);
  console.log(`   Tone: ${TONE_MAP[level.order]}`);

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const mod of level.modules) {
    console.log(`\n${"─".repeat(50)}`);
    console.log(`📦 Module ${mod.order}: ${mod.title}`);

    for (const lesson of mod.lessons) {
      // Skip lessons that already have content
      if (lesson.content && lesson.content.length > 100) {
        console.log(`  ⏭️  [HAS CONTENT] ${lesson.title}`);
        skipped++;
        continue;
      }

      try {
        const success = await processLesson(lesson, level.order);
        if (success) processed++;
        else failed++;
      } catch (error) {
        console.error(`  ❌ FAILED: ${lesson.title} — ${error.message}`);
        failed++;
      }

      // Rate limit: wait 5s between lessons to avoid API throttling
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ Level ${targetLevel} complete!`);
  console.log(`   Processed: ${processed}`);
  console.log(`   Skipped (has content): ${skipped}`);
  console.log(`   Failed: ${failed}`);
  console.log("=".repeat(60));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Fatal error:", e);
  prisma.$disconnect();
  process.exit(1);
});
