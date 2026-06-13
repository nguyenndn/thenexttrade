import "server-only";
import { prisma } from "@/lib/prisma";
import { scoreArticle } from "./article-readiness.server";
import type {
 ArticleSeoFixPayload,
 ArticleSeoFixSuggestion,
} from "./article-seo-fix.shared";

// --- Helpers for SEO Generation ---

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
 "the", "a", "an", "how", "to", "guide", "complete", "best", "and", "or", "for", "in", "of", "with", "is", "are", "what", "why", "when"
 ]);
 
 const words = title
 .toLowerCase()
 .replace(/[^\w\s]/gi, "")
 .split(" ")
 .filter(w => w.trim() !== "" && !STOP_WORDS.has(w));

 return words.slice(0, 5).join(" ");
}

export async function generateArticleSeoFixSuggestion(
 articleId: string
): Promise<ArticleSeoFixSuggestion | null> {
 const article = await prisma.article.findUnique({
 where: { id: articleId },
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
 });

 if (!article) return null;

 const notes: string[] = [];

 // metaTitle
 let suggestedMetaTitle = article.metaTitle || article.title;
 if (suggestedMetaTitle.length < 30 || suggestedMetaTitle.length > 60) {
 suggestedMetaTitle = trimToWordBoundary(article.title, 60);
 notes.push("Adjusted meta title to be between 30-60 characters.");
 }

 // focusKeyword
 let suggestedFocusKeyword = article.focusKeyword;
 if (!suggestedFocusKeyword || suggestedFocusKeyword.trim() === "") {
 suggestedFocusKeyword = generateFocusKeyword(article.title);
 notes.push("Generated focus keyword from article title.");
 }

 // metaDescription
 let suggestedMetaDescription = article.metaDescription;
 if (
 !suggestedMetaDescription ||
 suggestedMetaDescription.length < 120 ||
 suggestedMetaDescription.length > 160
 ) {
 const sourceText = article.excerpt || cleanHtml(article.content);
 suggestedMetaDescription = trimToWordBoundary(sourceText, 155);
 notes.push("Generated meta description from article content/excerpt.");
 }

 // schemaType
 let suggestedSchemaType = article.schemaType || "ARTICLE";
 const titleLower = article.title.toLowerCase();
 const contentLower = article.content.toLowerCase();
 
 if (titleLower.startsWith("how to") || contentLower.includes("step 1")) {
 suggestedSchemaType = "HOWTO";
 } else if ((contentLower.match(/<h[2-3][^>]*>.*\?<\/h[2-3]>/gi) || []).length >= 2) {
 suggestedSchemaType = "FAQ";
 } else if (titleLower.includes("review") || titleLower.includes("broker")) {
 suggestedSchemaType = "REVIEW";
 }

 // excerpt
 let suggestedExcerpt = article.excerpt;
 if (!suggestedExcerpt || suggestedExcerpt.length < 80 || suggestedExcerpt.length > 220) {
 const cleanContent = cleanHtml(article.content);
 suggestedExcerpt = trimToWordBoundary(cleanContent, 160);
 notes.push("Generated excerpt from clean content.");
 }

 const readiness = scoreArticle(article);

 return {
 articleId: article.id,
 title: article.title,
 slug: article.slug,
 issues: readiness.issues,
 current: {
 metaTitle: article.metaTitle,
 metaDescription: article.metaDescription,
 focusKeyword: article.focusKeyword,
 schemaType: article.schemaType,
 excerpt: article.excerpt,
 },
 suggested: {
 metaTitle: suggestedMetaTitle,
 metaDescription: suggestedMetaDescription,
 focusKeyword: suggestedFocusKeyword,
 schemaType: suggestedSchemaType as any,
 excerpt: suggestedExcerpt,
 },
 notes,
 };
}

export async function applyArticleSeoFix(
 articleId: string,
 payload: ArticleSeoFixPayload
) {
 const updatedArticle = await prisma.article.update({
 where: { id: articleId },
 data: {
 metaTitle: payload.metaTitle,
 metaDescription: payload.metaDescription,
 focusKeyword: payload.focusKeyword,
 schemaType: payload.schemaType,
 excerpt: payload.excerpt,
 },
 select: {
 id: true,
 title: true,
 slug: true,
 content: true,
 thumbnail: true,
 metaDescription: true,
 focusKeyword: true,
 schemaType: true,
 }
 });

 return {
 articleId: updatedArticle.id,
 readiness: scoreArticle(updatedArticle),
 };
}
