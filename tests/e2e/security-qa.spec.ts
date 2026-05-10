import { test, expect, type Page, type APIResponse } from "@playwright/test";
import { PrismaClient, UserRole } from "@prisma/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const runId = Date.now();
const prefix = `QA-SEC-${runId}`;
const reportPath = path.join(process.cwd(), "docs", "SECURITY_QA_2026-05-09.md");

type Finding = {
    id: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM";
    area: string;
    endpoint: string;
    actor: "anonymous" | "user";
    evidence: string;
    likelySource: string;
    recommendation: string;
};

const findings: Finding[] = [];
let userEmail = `security-user-${runId}@example.test`;
let userPassword = `Sec-${runId}-Password!`;
let userId = "";
let featureFlagKey = `feature_security_probe_${runId}`;
let lessonSlug = `security-lesson-${runId}`;
let categorySlug = `security-category-${runId}`;
let categorySlug2 = `security-category-delete-${runId}`;
let tagSlug = `security-tag-${runId}`;
let tagSlug2 = `security-tag-delete-${runId}`;
let articleSnapshot: { id: string; excerpt: string | null } | null = null;
let eaSettingsSnapshot: { exists: boolean; value: any } | null = null;
let categoryId = "";
let categoryDeleteId = "";
let tagId = "";
let tagDeleteId = "";
let shortcutId = "";

test.describe.configure({ mode: "serial" });
test.setTimeout(6 * 60 * 1000);

function recordFinding(finding: Omit<Finding, "id">) {
    findings.push({
        id: `SEC-${String(findings.length + 1).padStart(3, "0")}`,
        ...finding,
    });
}

async function responseText(response: APIResponse) {
    return (await response.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 500);
}

async function assertDenied(params: {
    response: APIResponse;
    severity: Finding["severity"];
    area: string;
    endpoint: string;
    actor: Finding["actor"];
    likelySource: string;
    recommendation: string;
}) {
    const status = params.response.status();
    if (status !== 401 && status !== 403) {
        recordFinding({
            severity: params.severity,
            area: params.area,
            endpoint: params.endpoint,
            actor: params.actor,
            evidence: `Expected 401/403, got HTTP ${status}. Body: ${await responseText(params.response)}`,
            likelySource: params.likelySource,
            recommendation: params.recommendation,
        });
    }
}

async function createTempUser() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for security QA");
    }

    const admin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await admin.auth.admin.createUser({
        email: userEmail,
        password: userPassword,
        email_confirm: true,
        user_metadata: { full_name: `${prefix} Normal User` },
    });

    if (error || !data.user) {
        throw new Error(`Failed to create temp auth user: ${error?.message || "missing user"}`);
    }

    userId = data.user.id;

    await prisma.user.upsert({
        where: { id: userId },
        update: { email: userEmail, name: `${prefix} Normal User` },
        create: { id: userId, email: userEmail, name: `${prefix} Normal User` },
    });

    await prisma.profile.upsert({
        where: { userId },
        update: { role: UserRole.USER, username: `secuser${String(runId).slice(-8)}` },
        create: { userId, role: UserRole.USER, username: `secuser${String(runId).slice(-8)}` },
    });
}

async function loginAsTempUser(page: Page) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
        throw new Error("Supabase env vars are required for security QA login");
    }

    const admin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: userEmail });
    const emailOtp = data.properties?.email_otp;
    if (error || !emailOtp) throw new Error(`Magic-link auth failed: ${error?.message || "missing OTP"}`);

    const anon = createSupabaseClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const verified = await anon.auth.verifyOtp({ email: userEmail, token: emailOtp, type: "magiclink" });
    if (verified.error || !verified.data.session) {
        throw new Error(`Magic-link OTP verify failed: ${verified.error?.message || "missing session"}`);
    }

    const cookiesToSet: { name: string; value: string; options: any }[] = [];
    const server = createServerClient(supabaseUrl, anonKey, {
        cookies: {
            getAll: () => [],
            setAll: (cookies) => {
                cookiesToSet.push(...cookies);
            },
        },
    });
    await server.auth.setSession({
        access_token: verified.data.session.access_token,
        refresh_token: verified.data.session.refresh_token,
    });

    await page.context().addCookies(cookiesToSet.map(({ name, value, options }) => ({
        name,
        value,
        url: "http://localhost:3000",
        httpOnly: options?.httpOnly ?? false,
        secure: false,
        sameSite: "Lax" as const,
    })));
}

async function snapshotMutableData() {
    const eaSetting = await prisma.systemSetting.findUnique({ where: { key: "ea_settings" } });
    eaSettingsSnapshot = { exists: !!eaSetting, value: eaSetting?.value ?? null };

    const article = await prisma.article.findFirst({
        where: { status: "PUBLISHED" },
        select: { id: true, excerpt: true },
        orderBy: { createdAt: "desc" },
    });
    articleSnapshot = article;
}

async function cleanup() {
    await prisma.systemSetting.deleteMany({ where: { key: featureFlagKey } }).catch(() => {});
    await prisma.lesson.deleteMany({ where: { slug: lessonSlug } }).catch(() => {});
    await prisma.category.deleteMany({ where: { slug: { in: [categorySlug, categorySlug2, `${categorySlug}-tampered`] } } }).catch(() => {});
    await prisma.tag.deleteMany({ where: { slug: { in: [tagSlug, tagSlug2, `${tagSlug}-tampered`] } } }).catch(() => {});
    await prisma.contentShortcut.deleteMany({ where: { name: { startsWith: prefix } } }).catch(() => {});

    if (articleSnapshot) {
        await prisma.article.update({
            where: { id: articleSnapshot.id },
            data: { excerpt: articleSnapshot.excerpt },
        }).catch(() => {});
    }

    if (eaSettingsSnapshot) {
        if (eaSettingsSnapshot.exists) {
            await prisma.systemSetting.upsert({
                where: { key: "ea_settings" },
                update: { value: eaSettingsSnapshot.value },
                create: { key: "ea_settings", value: eaSettingsSnapshot.value },
            }).catch(() => {});
        } else {
            await prisma.systemSetting.deleteMany({ where: { key: "ea_settings" } }).catch(() => {});
        }
    }

    if (userId) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && serviceRoleKey) {
            const admin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
                auth: { autoRefreshToken: false, persistSession: false },
            });
            await admin.auth.admin.deleteUser(userId).catch(() => {});
        }
        await prisma.user.deleteMany({ where: { id: userId } }).catch(() => {});
    }
}

function writeReport() {
    const rows = findings.length
        ? findings.map(f => `| ${f.id} | ${f.severity} | ${f.area} | ${f.actor} | ${f.endpoint} | ${f.evidence.replace(/\|/g, "\\|")} | ${f.likelySource} | ${f.recommendation} |`).join("\n")
        : "No confirmed security bugs found in this pass.";

    fs.writeFileSync(reportPath, [
        "# Security QA - 2026-05-09",
        "",
        "Scope: Admin Dashboard, User Dashboard, public APIs/pages, and unauthenticated public surface.",
        "",
        "Report policy: confirmed security bugs only. Passing checks are intentionally omitted.",
        "",
        "Test command:",
        "- `npx dotenv -e .env -- npx playwright test tests/e2e/security-qa.spec.ts --project=chromium --reporter=list`",
        "",
        "## Confirmed Findings",
        "",
        findings.length
            ? "| ID | Severity | Area | Actor | Endpoint | Evidence | Likely Source | Recommendation |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n" + rows
            : rows,
        "",
        "## Notes",
        "",
        "- The spec creates a temporary confirmed Supabase USER account and deletes it after the run.",
        "- Mutating probes use QA-prefixed data and cleanup/restore hooks.",
        "- Passwords and service-role values are never written to this report.",
    ].join("\n"));
}

test.beforeAll(async () => {
    await cleanup();
    await createTempUser();
    await snapshotMutableData();
});

test.afterAll(async () => {
    writeReport();
    await cleanup();
    await prisma.$disconnect();
});

test("security access-control QA", async ({ page, request }) => {
    const module = await prisma.module.findFirst({ select: { id: true } });

    const anonFeaturePost = await request.post("/api/admin/feature-flags", {
        data: { key: featureFlagKey, enabled: true },
    });
    await assertDenied({
        response: anonFeaturePost,
        severity: "CRITICAL",
        area: "Admin Feature Flags",
        endpoint: "POST /api/admin/feature-flags",
        actor: "anonymous",
        likelySource: "src/app/api/admin/feature-flags/route.ts",
        recommendation: "Require DB-backed ADMIN/EDITOR role before reading or mutating feature flags.",
    });

    const anonFeatureGet = await request.get("/api/admin/feature-flags");
    await assertDenied({
        response: anonFeatureGet,
        severity: "HIGH",
        area: "Admin Feature Flags",
        endpoint: "GET /api/admin/feature-flags",
        actor: "anonymous",
        likelySource: "src/app/api/admin/feature-flags/route.ts",
        recommendation: "Require DB-backed ADMIN/EDITOR role for the admin feature flag endpoint.",
    });

    if (module) {
        const anonLessonPost = await request.post("/api/academy/lessons", {
            data: {
                title: `${prefix} lesson`,
                content: "<p>Security probe lesson content.</p>",
                slug: lessonSlug,
                moduleId: module.id,
            },
        });
        await assertDenied({
            response: anonLessonPost,
            severity: "CRITICAL",
            area: "Academy CMS",
            endpoint: "POST /api/academy/lessons",
            actor: "anonymous",
            likelySource: "src/app/api/academy/lessons/route.ts",
            recommendation: "Require ADMIN/EDITOR before creating lessons.",
        });
    }

    await loginAsTempUser(page);

    const adminStats = await page.request.get("/api/admin/dashboard/stats");
    await assertDenied({
        response: adminStats,
        severity: "HIGH",
        area: "Admin Analytics",
        endpoint: "GET /api/admin/dashboard/stats",
        actor: "user",
        likelySource: "src/app/api/admin/dashboard/stats/route.ts",
        recommendation: "Use requireAdmin() instead of only checking that a session exists.",
    });

    const adminComments = await page.request.get("/api/admin/comments");
    await assertDenied({
        response: adminComments,
        severity: "HIGH",
        area: "Admin Comments",
        endpoint: "GET /api/admin/comments",
        actor: "user",
        likelySource: "src/app/api/admin/comments/route.ts",
        recommendation: "Use requireAdmin() before returning comments and user emails.",
    });

    const eaGet = await page.request.get("/api/admin/ea/settings");
    await assertDenied({
        response: eaGet,
        severity: "HIGH",
        area: "EA Admin Settings",
        endpoint: "GET /api/admin/ea/settings",
        actor: "user",
        likelySource: "src/app/api/admin/ea/settings/route.ts",
        recommendation: "Require ADMIN/EDITOR before returning EA settings.",
    });

    const eaPut = await page.request.put("/api/admin/ea/settings", {
        data: {
            maintenanceMode: false,
            autoApproveLicenses: true,
            adminAlertEmail: `security-${runId}@example.test`,
            sendUserWelcomeEmail: false,
            telegramEnabled: false,
            telegramBotToken: "",
            telegramChatId: "",
        },
    });
    await assertDenied({
        response: eaPut,
        severity: "CRITICAL",
        area: "EA Admin Settings",
        endpoint: "PUT /api/admin/ea/settings",
        actor: "user",
        likelySource: "src/app/api/admin/ea/settings/route.ts",
        recommendation: "Require ADMIN/EDITOR before mutating EA settings.",
    });

    const categoryPost = await page.request.post("/api/categories", {
        data: { name: `${prefix} category`, slug: categorySlug },
    });
    await assertDenied({
        response: categoryPost,
        severity: "HIGH",
        area: "CMS Taxonomy",
        endpoint: "POST /api/categories",
        actor: "user",
        likelySource: "src/app/api/categories/route.ts",
        recommendation: "Require ADMIN/EDITOR before category mutations.",
    });

    const category = await prisma.category.create({
        data: { name: `${prefix} category direct`, slug: categorySlug },
    });
    categoryId = category.id;
    const categoryDelete = await prisma.category.create({
        data: { name: `${prefix} category delete direct`, slug: categorySlug2 },
    });
    categoryDeleteId = categoryDelete.id;

    const categoryPut = await page.request.put(`/api/categories/${categoryId}`, {
        data: { name: `${prefix} category tampered`, slug: `${categorySlug}-tampered` },
    });
    await assertDenied({
        response: categoryPut,
        severity: "HIGH",
        area: "CMS Taxonomy",
        endpoint: "PUT /api/categories/[id]",
        actor: "user",
        likelySource: "src/app/api/categories/[id]/route.ts",
        recommendation: "Require ADMIN/EDITOR before category update/delete.",
    });

    const categoryDeleteResponse = await page.request.delete(`/api/categories/${categoryDeleteId}`);
    await assertDenied({
        response: categoryDeleteResponse,
        severity: "HIGH",
        area: "CMS Taxonomy",
        endpoint: "DELETE /api/categories/[id]",
        actor: "user",
        likelySource: "src/app/api/categories/[id]/route.ts",
        recommendation: "Require ADMIN/EDITOR before category update/delete.",
    });

    const tagPost = await page.request.post("/api/tags", {
        data: { name: `${prefix} tag` },
    });
    await assertDenied({
        response: tagPost,
        severity: "HIGH",
        area: "CMS Taxonomy",
        endpoint: "POST /api/tags",
        actor: "user",
        likelySource: "src/app/api/tags/route.ts",
        recommendation: "Require ADMIN/EDITOR before tag mutations.",
    });

    const tag = await prisma.tag.create({
        data: { name: `${prefix} tag direct`, slug: tagSlug },
    });
    tagId = tag.id;
    const tagDelete = await prisma.tag.create({
        data: { name: `${prefix} tag delete direct`, slug: tagSlug2 },
    });
    tagDeleteId = tagDelete.id;

    const tagPut = await page.request.put(`/api/tags/${tagId}`, {
        data: { name: `${prefix} tag tampered`, slug: `${tagSlug}-tampered` },
    });
    await assertDenied({
        response: tagPut,
        severity: "HIGH",
        area: "CMS Taxonomy",
        endpoint: "PUT /api/tags/[id]",
        actor: "user",
        likelySource: "src/app/api/tags/[id]/route.ts",
        recommendation: "Require ADMIN/EDITOR before tag update/delete.",
    });

    const tagDeleteResponse = await page.request.delete(`/api/tags/${tagDeleteId}`);
    await assertDenied({
        response: tagDeleteResponse,
        severity: "HIGH",
        area: "CMS Taxonomy",
        endpoint: "DELETE /api/tags/[id]",
        actor: "user",
        likelySource: "src/app/api/tags/[id]/route.ts",
        recommendation: "Require ADMIN/EDITOR before tag update/delete.",
    });

    const shortcutsGet = await page.request.get("/api/articles/shortcuts");
    await assertDenied({
        response: shortcutsGet,
        severity: "HIGH",
        area: "Article Shortcuts",
        endpoint: "GET /api/articles/shortcuts",
        actor: "user",
        likelySource: "src/app/api/articles/shortcuts/route.ts",
        recommendation: "Require ADMIN/EDITOR before listing article content shortcuts.",
    });

    const shortcutPost = await page.request.post("/api/articles/shortcuts", {
        data: { name: `${prefix} shortcut`, description: "security probe", content: "<p>probe</p>" },
    });
    await assertDenied({
        response: shortcutPost,
        severity: "HIGH",
        area: "Article Shortcuts",
        endpoint: "POST /api/articles/shortcuts",
        actor: "user",
        likelySource: "src/app/api/articles/shortcuts/route.ts",
        recommendation: "Require ADMIN/EDITOR before creating article content shortcuts.",
    });

    const shortcut = await prisma.contentShortcut.create({
        data: {
            name: `${prefix} shortcut direct`,
            description: "security probe",
            content: "<p>probe</p>",
            authorId: userId,
        },
    });
    shortcutId = shortcut.id;

    const shortcutPut = await page.request.put(`/api/articles/shortcuts/${shortcutId}`, {
        data: { name: `${prefix} shortcut tampered`, description: "tampered", content: "<p>tampered</p>" },
    });
    await assertDenied({
        response: shortcutPut,
        severity: "HIGH",
        area: "Article Shortcuts",
        endpoint: "PUT /api/articles/shortcuts/[id]",
        actor: "user",
        likelySource: "src/app/api/articles/shortcuts/[id]/route.ts",
        recommendation: "Require ADMIN/EDITOR before updating/deleting article content shortcuts.",
    });

    const shortcutDelete = await page.request.delete(`/api/articles/shortcuts/${shortcutId}`);
    await assertDenied({
        response: shortcutDelete,
        severity: "HIGH",
        area: "Article Shortcuts",
        endpoint: "DELETE /api/articles/shortcuts/[id]",
        actor: "user",
        likelySource: "src/app/api/articles/shortcuts/[id]/route.ts",
        recommendation: "Require ADMIN/EDITOR before updating/deleting article content shortcuts.",
    });

    if (articleSnapshot) {
        const articlePut = await page.request.put(`/api/articles/${articleSnapshot.id}`, {
            data: { excerpt: `${prefix} normal user tamper probe` },
        });
        await assertDenied({
            response: articlePut,
            severity: "CRITICAL",
            area: "Article CMS",
            endpoint: "PUT /api/articles/[id]",
            actor: "user",
            likelySource: "src/app/api/articles/[id]/route.ts",
            recommendation: "Require ADMIN/EDITOR before article updates/deletes.",
        });
    }

    expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
});
