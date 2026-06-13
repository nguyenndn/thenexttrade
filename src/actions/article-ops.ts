"use server";

import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import {
 getArticleOpsData,
 generateImagePrompts,
} from "@/lib/articles/article-readiness.server";
import type { ArticleOpsFilter } from "@/lib/articles/article-readiness.shared";

// ============================================================================
// ADMIN-ONLY ARTICLE OPS SERVER ACTIONS
// ============================================================================

async function requireAdminUser() {
 const user = await getAuthUser();
 if (!user) throw new Error("Unauthorized");

 const profile = await prisma.profile.findUnique({
 where: { userId: user.id },
 select: { role: true },
 });

 if (!profile || !isAdminRole(profile.role)) {
 throw new Error("Forbidden: Admin access required");
 }

 return user;
}

export async function getArticleOpsDashboard(filter?: ArticleOpsFilter) {
 await requireAdminUser();
 return getArticleOpsData(filter || "all");
}

export async function getArticleImagePrompts(articleId: string) {
 await requireAdminUser();
 return generateImagePrompts(articleId);
}

import {
 generateArticleSeoFixSuggestion,
 applyArticleSeoFix,
} from "@/lib/articles/article-seo-fix.server";
import type { ArticleSeoFixPayload, ArticleSeoFixSuggestion } from "@/lib/articles/article-seo-fix.shared";

export async function getArticleSeoFixSuggestion(articleId: string) {
 await requireAdminUser();
 return generateArticleSeoFixSuggestion(articleId);
}

export async function applyArticleSeoFixAction(articleId: string, payload: ArticleSeoFixPayload) {
 await requireAdminUser();
 return applyArticleSeoFix(articleId, payload);
}

// ============================================================================
// BULK ACTIONS
// ============================================================================

export async function generateBulkArticleSeoFixSuggestions(articleIds: string[]) {
 await requireAdminUser();

 const uniqueIds = [...new Set(articleIds)].slice(0, 25);
 const suggestions: ArticleSeoFixSuggestion[] = [];
 const errors: { articleId: string; message: string }[] = [];

 for (const id of uniqueIds) {
 try {
 const suggestion = await generateArticleSeoFixSuggestion(id);
 if (suggestion) {
 suggestions.push(suggestion);
 } else {
 errors.push({ articleId: id, message: "Article not found" });
 }
 } catch (err) {
 errors.push({ articleId: id, message: String(err) });
 }
 }

 return { suggestions, errors };
}

export async function applyBulkArticleSeoFixes(
 payloads: { articleId: string; payload: ArticleSeoFixPayload }[]
) {
 const adminUser = await requireAdminUser();
 const { randomUUID } = await import("crypto");
 const batchId = randomUUID();

 const limited = payloads.slice(0, 25);
 const updated: { articleId: string; title: string }[] = [];
 const errors: { articleId: string; message: string }[] = [];
 const auditEntries: any[] = [];

 for (const { articleId, payload } of limited) {
 try {
 // Snapshot before
 const before = await prisma.article.findUnique({
 where: { id: articleId },
 select: { id: true, title: true, metaTitle: true, metaDescription: true, focusKeyword: true, schemaType: true, excerpt: true },
 });
 if (!before) {
 errors.push({ articleId, message: "Article not found" });
 continue;
 }

 await applyArticleSeoFix(articleId, payload);
 updated.push({ articleId, title: before.title });
 auditEntries.push({
 articleId,
 title: before.title,
 before: {
 metaTitle: before.metaTitle,
 metaDescription: before.metaDescription,
 focusKeyword: before.focusKeyword,
 schemaType: before.schemaType,
 excerpt: before.excerpt,
 },
 after: payload,
 });
 } catch (err) {
 errors.push({ articleId, message: String(err) });
 }
 }

 // Create audit log
 if (auditEntries.length > 0) {
 await prisma.auditLog.create({
 data: {
 adminId: adminUser.id,
 action: "ARTICLE_OPS_BULK_SEO_APPLIED",
 targetType: "ArticleBulkSeo",
 targetId: batchId,
 details: {
 batchId,
 updated: auditEntries,
 errors,
 selectedCount: limited.length,
 },
 },
 });
 }

 return { batchId, updated, errors };
}

export async function undoBulkArticleSeoFix(batchId: string) {
 const adminUser = await requireAdminUser();

 // Check if already undone
 const undoLog = await prisma.auditLog.findFirst({
 where: { action: "ARTICLE_OPS_BULK_SEO_UNDONE", targetId: batchId },
 });
 if (undoLog) {
 throw new Error("Batch already undone");
 }

 // Find original audit log
 const auditLog = await prisma.auditLog.findFirst({
 where: { action: "ARTICLE_OPS_BULK_SEO_APPLIED", targetId: batchId },
 });
 if (!auditLog || !auditLog.details) {
 throw new Error("Audit log not found for this batch");
 }

 const details = auditLog.details as any;
 const entries = details.updated || [];
 const restored: { articleId: string; title: string }[] = [];
 const skipped: { articleId: string; title?: string; message: string }[] = [];

 for (const entry of entries) {
 try {
 // Safety: compare current fields to audited "after" values
 const current = await prisma.article.findUnique({
 where: { id: entry.articleId },
 select: { metaTitle: true, metaDescription: true, focusKeyword: true, schemaType: true, excerpt: true },
 });
 if (!current) {
 skipped.push({ articleId: entry.articleId, title: entry.title, message: "Article not found" });
 continue;
 }

 const after = entry.after;
 const changed =
 current.metaTitle !== after.metaTitle ||
 current.metaDescription !== after.metaDescription ||
 current.focusKeyword !== after.focusKeyword ||
 current.schemaType !== after.schemaType ||
 current.excerpt !== after.excerpt;

 if (changed) {
 skipped.push({ articleId: entry.articleId, title: entry.title, message: "Article changed after bulk apply; skipped undo." });
 continue;
 }

 // Restore to before values
 await prisma.article.update({
 where: { id: entry.articleId },
 data: {
 metaTitle: entry.before.metaTitle,
 metaDescription: entry.before.metaDescription,
 focusKeyword: entry.before.focusKeyword,
 schemaType: entry.before.schemaType,
 excerpt: entry.before.excerpt,
 },
 });
 restored.push({ articleId: entry.articleId, title: entry.title });
 } catch (err) {
 skipped.push({ articleId: entry.articleId, title: entry.title, message: String(err) });
 }
 }

 // Create undo audit log
 await prisma.auditLog.create({
 data: {
 adminId: adminUser.id,
 action: "ARTICLE_OPS_BULK_SEO_UNDONE",
 targetType: "ArticleBulkSeo",
 targetId: batchId,
 details: {
 batchId,
 restored,
 skipped,
 },
 },
 });

 return { restored, skipped };
}

export async function getBulkArticleImagePrompts(articleIds: string[]) {
 await requireAdminUser();

 const uniqueIds = [...new Set(articleIds)].slice(0, 25);
 const results = [];

 for (const id of uniqueIds) {
 const prompts = await generateImagePrompts(id);
 if (prompts) results.push(prompts);
 }

 return results;
}

