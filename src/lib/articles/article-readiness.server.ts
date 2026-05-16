import "server-only";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import {
  type ArticleReadinessIssue,
  type ArticleReadiness,
  type ArticleOpsFilter,
  type ArticleOpsRow,
  type ArticleOpsSummary,
  type ArticleImagePrompts,
} from "./article-readiness.shared";

// ============================================================================
// ARTICLE READINESS SCORING SERVICE (SERVER)
// Scores articles from 0-100 based on image, SEO, and content completeness.
// ============================================================================

// ── Helpers ──

function extractInlineImages(content: string): string[] {
  const images: string[] = [];

  // HTML <img src="...">
  const imgTagRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = imgTagRegex.exec(content)) !== null) {
    const src = match[1];
    if (src && !src.startsWith("data:") && src.length > 5) {
      images.push(src);
    }
  }

  // Markdown ![alt](url)
  const mdRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
  while ((match = mdRegex.exec(content)) !== null) {
    const src = match[1];
    if (src && !src.startsWith("data:") && src.length > 5) {
      images.push(src);
    }
  }

  return [...new Set(images)];
}

function countWords(content: string): number {
  // Strip HTML tags, then count words
  const text = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(" ").length : 0;
}

function isRemoteUrl(src: string) {
  return src.startsWith("http://") || src.startsWith("https://");
}

function isLocalPublicPath(src: string) {
  return src.startsWith("/images/") || src.startsWith("/uploads/");
}

function localPublicFileExists(src: string): boolean {
  if (!isLocalPublicPath(src)) return false;
  const cleanPath = src.split("?")[0].split("#")[0];
  const absolutePath = path.join(process.cwd(), "public", cleanPath.replace(/^\//, ""));
  return fs.existsSync(absolutePath);
}

function imageExistsForReadiness(src: string): boolean {
  if (isRemoteUrl(src)) return true;
  return localPublicFileExists(src);
}

// ── Main Scoring ──

export function scoreArticle(article: {
  id: string;
  thumbnail: string | null;
  content: string;
  metaDescription: string | null;
  focusKeyword: string | null;
  schemaType: string | null;
}): ArticleReadiness {
  const issues: ArticleReadinessIssue[] = [];
  let score = 100;

  // Featured image
  const featuredImagePath = article.thumbnail || null;
  let featuredImageExists = false;

  if (!featuredImagePath) {
    issues.push("MISSING_FEATURED_IMAGE");
    score -= 20;
  } else {
    featuredImageExists = imageExistsForReadiness(featuredImagePath);
    if (!featuredImageExists) {
      issues.push("FEATURED_IMAGE_FILE_MISSING");
      score -= 20;
    }
  }

  // Inline images
  const inlineImages = extractInlineImages(article.content);
  const missingInlineImages: string[] = [];

  if (inlineImages.length === 0) {
    issues.push("NO_INLINE_IMAGES");
    score -= 15;
  } else {
    let missingCount = 0;
    for (const img of inlineImages) {
      if (!imageExistsForReadiness(img)) {
        missingInlineImages.push(img);
        missingCount++;
      }
    }
    if (missingCount > 0) {
      issues.push("INLINE_IMAGE_FILE_MISSING");
      score -= Math.min(missingCount * 10, 30);
    }
  }

  // Meta description
  if (!article.metaDescription || article.metaDescription.trim().length === 0) {
    issues.push("MISSING_META_DESCRIPTION");
    score -= 15;
  } else if (article.metaDescription.length > 160) {
    issues.push("META_DESCRIPTION_TOO_LONG");
    score -= 10;
  }

  // Focus keyword
  if (!article.focusKeyword || article.focusKeyword.trim().length === 0) {
    issues.push("MISSING_FOCUS_KEYWORD");
    score -= 10;
  }

  // Content length
  if (countWords(article.content) < 800) {
    issues.push("CONTENT_TOO_SHORT");
    score -= 10;
  }

  // Schema type
  if (!article.schemaType) {
    issues.push("MISSING_SCHEMA_TYPE");
    score -= 5;
  }

  return {
    articleId: article.id,
    score: Math.max(0, score),
    issues,
    inlineImageCount: inlineImages.length,
    missingInlineImages,
    featuredImagePath,
    featuredImageExists,
  };
}

// ── Batch scoring ──

export async function getArticleOpsData(filter: ArticleOpsFilter = "all") {
  const where: Record<string, unknown> = {};

  if (filter === "published") where.status = "PUBLISHED";
  if (filter === "draft") where.status = "DRAFT";

  const articles = await prisma.article.findMany({
    where,
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      thumbnail: true,
      content: true,
      metaDescription: true,
      focusKeyword: true,
      schemaType: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const rows: ArticleOpsRow[] = articles.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    status: a.status,
    updatedAt: a.updatedAt,
    readiness: scoreArticle(a),
  }));

  // Apply post-score filters
  let filtered = rows;
  if (filter === "needs_featured_image") {
    filtered = rows.filter((r) =>
      r.readiness.issues.includes("MISSING_FEATURED_IMAGE") ||
      r.readiness.issues.includes("FEATURED_IMAGE_FILE_MISSING")
    );
  } else if (filter === "needs_inline_images") {
    filtered = rows.filter((r) =>
      r.readiness.issues.includes("NO_INLINE_IMAGES") ||
      r.readiness.issues.includes("INLINE_IMAGE_FILE_MISSING")
    );
  } else if (filter === "needs_seo") {
    filtered = rows.filter((r) =>
      r.readiness.issues.includes("MISSING_META_DESCRIPTION") ||
      r.readiness.issues.includes("MISSING_FOCUS_KEYWORD") ||
      r.readiness.issues.includes("META_DESCRIPTION_TOO_LONG")
    );
  }

  const summary: ArticleOpsSummary = {
    total: rows.length,
    ready: rows.filter((r) => r.readiness.score >= 80).length,
    needsImages: rows.filter((r) =>
      r.readiness.issues.some((i) =>
        i.includes("IMAGE") || i === "NO_INLINE_IMAGES"
      )
    ).length,
    needsSeo: rows.filter((r) =>
      r.readiness.issues.some((i) =>
        i.includes("META") || i.includes("KEYWORD") || i.includes("SCHEMA")
      )
    ).length,
    missingFiles: rows.filter((r) =>
      r.readiness.issues.some((i) => i.includes("FILE_MISSING"))
    ).length,
  };

  return { rows: filtered, summary };
}

// ── Image Prompt Generator ──

export async function generateImagePrompts(
  articleId: string
): Promise<ArticleImagePrompts | null> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      focusKeyword: true,
      category: { select: { name: true } },
    },
  });

  if (!article) return null;

  const wordCount = countWords(article.content);
  const inlineCount = wordCount < 900 ? 2 : 3;

  // Extract headings for context
  const headings: string[] = [];
  const headingRegex = /<h[2-3][^>]*>([^<]+)<\/h[2-3]>/gi;
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(article.content)) !== null) {
    headings.push(match[1].trim());
  }
  const headingContext = headings.slice(0, 4).join(", ");

  const baseContext = [
    `Article: "${article.title}"`,
    article.focusKeyword ? `Focus keyword: ${article.focusKeyword}` : "",
    article.category?.name ? `Category: ${article.category.name}` : "",
    headingContext ? `Key sections: ${headingContext}` : "",
    article.excerpt ? `Summary: ${article.excerpt.slice(0, 150)}` : "",
  ]
    .filter(Boolean)
    .join(". ");

  const featuredPrompt = `Create a professional 16:9 landscape featured image for a trading/finance blog post. ${baseContext}. Style: clean, modern, fintech aesthetic with subtle gold and dark teal accents. No readable text, no broker logos, no stock ticker overlays. Focus on abstract visualization of the concept.`;

  const inlinePrompts: { prompt: string; suggestedPath: string }[] = [];
  for (let i = 1; i <= inlineCount; i++) {
    const sectionHint = headings[i - 1]
      ? `This image illustrates the section: "${headings[i - 1]}".`
      : `This is inline image ${i} of ${inlineCount}.`;

    inlinePrompts.push({
      prompt: `Create a clean 16:9 landscape illustration for a trading article. ${baseContext}. ${sectionHint} Style: minimal, informative, no readable text, no logos. Use soft gradients with gold/amber tones.`,
      suggestedPath: `/images/articles/${article.slug}-inline-${i}.png`,
    });
  }

  return {
    articleId: article.id,
    title: article.title,
    slug: article.slug,
    featured: {
      prompt: featuredPrompt,
      suggestedPath: `/images/featured/${article.slug}.png`,
    },
    inline: inlinePrompts,
  };
}
