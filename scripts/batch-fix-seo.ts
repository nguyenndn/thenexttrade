// ============================================================================
// BATCH FIX SEO — Finds all articles with SEO issues and auto-applies fixes
// Run: npx tsx scripts/batch-fix-seo.ts
// ============================================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function cleanHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
}

function trimToWordBoundary(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const trimmed = text.substring(0, maxLength);
  const lastSpace = trimmed.lastIndexOf(" ");
  return lastSpace > 0 ? trimmed.substring(0, lastSpace) : trimmed;
}

function generateFocusKeyword(title: string): string {
  const STOP_WORDS = new Set([
    "the", "a", "an", "how", "to", "guide", "complete", "best", "and", "or",
    "for", "in", "of", "with", "is", "are", "what", "why", "when",
  ]);
  const words = title
    .toLowerCase()
    .replace(/[^\w\s]/gi, "")
    .split(" ")
    .filter((w) => w.trim() !== "" && !STOP_WORDS.has(w));
  return words.slice(0, 5).join(" ");
}

function detectSchemaType(title: string, content: string): string {
  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();
  if (titleLower.startsWith("how to") || contentLower.includes("step 1")) return "HOWTO";
  if ((contentLower.match(/<h[2-3][^>]*>.*\?<\/h[2-3]>/gi) || []).length >= 2) return "FAQ";
  if (titleLower.includes("review") || titleLower.includes("broker")) return "REVIEW";
  return "ARTICLE";
}

async function main() {
  console.log("🔍 Finding articles with SEO issues...\n");

  const articles = await prisma.article.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      metaTitle: true,
      metaDescription: true,
      focusKeyword: true,
      schemaType: true,
      thumbnail: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  // Filter to articles with SEO issues
  const needsSeo = articles.filter((a) => {
    const noMeta = !a.metaDescription || a.metaDescription.trim().length === 0;
    const longMeta = a.metaDescription ? a.metaDescription.length > 160 : false;
    const noKeyword = !a.focusKeyword || a.focusKeyword.trim().length === 0;
    const noSchema = !a.schemaType;
    return noMeta || longMeta || noKeyword || noSchema;
  });

  console.log(`📋 Total articles: ${articles.length}`);
  console.log(`⚠️  Articles needing SEO fix: ${needsSeo.length}\n`);

  if (needsSeo.length === 0) {
    console.log("✅ All articles have clean SEO. Nothing to fix.");
    return;
  }

  let fixed = 0;
  let failed = 0;

  for (const article of needsSeo) {
    try {
      // Generate suggestions
      let metaTitle = article.metaTitle || article.title;
      if (metaTitle.length < 30 || metaTitle.length > 60) {
        metaTitle = trimToWordBoundary(article.title, 60);
      }

      let focusKeyword = article.focusKeyword;
      if (!focusKeyword || focusKeyword.trim() === "") {
        focusKeyword = generateFocusKeyword(article.title);
      }

      let metaDescription = article.metaDescription;
      if (!metaDescription || metaDescription.length < 120 || metaDescription.length > 160) {
        const sourceText = article.excerpt || cleanHtml(article.content);
        metaDescription = trimToWordBoundary(sourceText, 155);
      }

      let schemaType = article.schemaType || detectSchemaType(article.title, article.content);

      let excerpt = article.excerpt;
      if (!excerpt || excerpt.length < 80 || excerpt.length > 220) {
        const cleanContent = cleanHtml(article.content);
        excerpt = trimToWordBoundary(cleanContent, 160);
      }

      // Apply fix
      await prisma.article.update({
        where: { id: article.id },
        data: {
          metaTitle,
          metaDescription,
          focusKeyword,
          schemaType,
          excerpt,
        },
      });

      fixed++;
      console.log(`  ✅ Fixed: "${article.title.substring(0, 60)}..."`);
    } catch (err) {
      failed++;
      console.error(`  ❌ Failed: "${article.title}" — ${err}`);
    }
  }

  console.log(`\n🏁 Done! Fixed: ${fixed}, Failed: ${failed}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
