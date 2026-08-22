import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

const userEmail = process.env.USER_QA_EMAIL || "keezimin@gmail.com";
const userPassword = process.env.USER_QA_PASSWORD || "Password123!";
const runId = Date.now();
const prefix = `QA-USER-${runId}`;
const reportPath = path.join(process.cwd(), "docs", "USER_DASHBOARD_QA_2026-05-09.md");
let rateBucket = 1;

type ViewportName = "desktop" | "mobile";
type Result = {
    viewport: ViewportName;
    area: string;
    action: string;
    status: "PASS" | "FAIL" | "SKIP";
    evidence: string;
};

const results: Result[] = [];
const snapshots: {
    user?: any;
    profile?: any;
    notifications?: any[];
} = {};

const created = {
    accountName: (viewport: ViewportName) => `${prefix} ${viewport} Account`,
    strategyName: (viewport: ViewportName) => `${prefix} ${viewport} Strategy`,
    journalSymbol: (viewport: ViewportName) => (viewport === "desktop" ? "QAUD" : "QMOB"),
    feedbackMessage: (viewport: ViewportName) => `${prefix} ${viewport} feedback bug report`,
    copyAccount: (viewport: ViewportName) => `${viewport === "desktop" ? "8" : "9"}${`${runId}`.slice(-5)}`,
    notificationTitle: (viewport: ViewportName) => `${prefix} ${viewport} notification`,
};

test.setTimeout(18 * 60 * 1000);

async function loginAsUser(page: Page) {
    if (!userEmail || !userPassword) {
        throw new Error("USER_QA_EMAIL and USER_QA_PASSWORD are required");
    }

    await page.goto("/auth/login", { waitUntil: "domcontentloaded" });
    await page.locator('input[name="email"]').fill(userEmail);
    await page.locator('input[name="password"]').fill(userPassword);
    await page.getByRole("button", { name: /^login$/i }).click();
    await Promise.race([
        page.waitForURL(/\/dashboard/, { timeout: 12_000 }).catch(() => null),
        page.getByText(/invalid login credentials|verification failed/i).waitFor({ timeout: 12_000 }).catch(() => null),
    ]);

    if (!page.url().includes("/dashboard")) {
        await loginWithMagicLink(page);
    }

    await page.waitForLoadState("networkidle", { timeout: 12_000 }).catch(() => {});
}

async function loginWithMagicLink(page: Page) {
    if (!userEmail) throw new Error("USER_QA_EMAIL is required");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
        throw new Error("Password login failed and Supabase service role fallback is not configured");
    }

    const admin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: userEmail,
        options: {
            redirectTo: "http://localhost:3000/auth/callback?next=/dashboard",
        },
    });

    const emailOtp = data.properties?.email_otp;
    if (error || !emailOtp) {
        throw new Error(`Magic-link auth fallback failed: ${error?.message || "missing OTP"}`);
    }

    const anon = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: verified, error: verifyError } = await anon.auth.verifyOtp({
        email: userEmail,
        token: emailOtp,
        type: "magiclink",
    });

    if (verifyError || !verified.session) {
        throw new Error(`Magic-link OTP verify failed: ${verifyError?.message || "missing session"}`);
    }

    const cookiesToSet: { name: string; value: string; options: any }[] = [];
    const server = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll: () => [],
            setAll: (cookies) => {
                cookiesToSet.push(...cookies);
            },
        },
    });
    await server.auth.setSession({
        access_token: verified.session.access_token,
        refresh_token: verified.session.refresh_token,
    });

    await page.context().addCookies(cookiesToSet.map(({ name, value, options }) => {
        const cookie: any = {
            name,
            value,
            url: "http://localhost:3000",
            httpOnly: options?.httpOnly ?? false,
            secure: false,
            sameSite: (options?.sameSite ? String(options.sameSite).charAt(0).toUpperCase() + String(options.sameSite).slice(1) : "Lax") as "Strict" | "Lax" | "None",
        };
        if (typeof options?.maxAge === "number") {
            cookie.expires = Math.floor(Date.now() / 1000) + options.maxAge;
        }
        return cookie;
    }));

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/dashboard/, { timeout: 45_000 });
}

async function ensureSession(page: Page) {
    if (!page.url().includes("/auth/login")) return;
    await loginAsUser(page);
}

async function recordStep(viewport: ViewportName, area: string, action: string, fn: () => Promise<string | void>) {
    try {
        const evidence = await fn();
        results.push({ viewport, area, action, status: "PASS", evidence: evidence || "Verified in Playwright." });
    } catch (error) {
        results.push({
            viewport,
            area,
            action,
            status: "FAIL",
            evidence: error instanceof Error ? error.message : String(error),
        });
    }
}

async function expectHealthyScreen(page: Page, route: string) {
    await expect(page.locator("body")).not.toContainText(/Application error|Unhandled Runtime Error|Page Not Found|\b404\b/i, { timeout: 2_000 });
    const overflow = await page.evaluate(() => {
        const width = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
        return width - window.innerWidth;
    });
    if (overflow > 12) {
        throw new Error(`${route} has document horizontal overflow of ${overflow}px`);
    }
}

async function dismissBlockingOverlays(page: Page) {
    for (let i = 0; i < 3; i += 1) {
        const gotIt = page.getByRole("button", { name: /got it/i }).last();
        if (await gotIt.isVisible({ timeout: 600 }).catch(() => false)) {
            await gotIt.click({ force: true }).catch(() => {});
            await page.waitForTimeout(250);
            continue;
        }

        const closePanel = page.getByRole("button", { name: /close panel|close menu/i }).last();
        if (await closePanel.isVisible({ timeout: 300 }).catch(() => false)) {
            await closePanel.click({ force: true }).catch(() => {});
            await page.waitForTimeout(250);
            continue;
        }

        break;
    }
}

async function gotoHealthy(page: Page, route: string) {
    await page.setExtraHTTPHeaders({
        "x-forwarded-for": `10.${Math.floor(runId / 1000) % 200}.${Math.floor(runId / 10) % 200}.${rateBucket++}`,
    });
    let response = await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});

    if (page.url().includes("/auth/login")) {
        await loginAsUser(page);
        response = await page.goto(route, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    }

    await dismissBlockingOverlays(page);
    if (response && response.status() >= 400) {
        throw new Error(`${route} returned HTTP ${response.status()}`);
    }
    if (!page.url().includes("/dashboard")) {
        throw new Error(`${route} redirected to ${page.url()}`);
    }
    await expectHealthyScreen(page, route);
}

async function cleanup() {
    await prisma.journalEntry.deleteMany({
        where: {
            OR: [
                { notes: { startsWith: prefix } },
                { entryReason: { startsWith: prefix } },
                { symbol: { in: ["QAUD", "QMOB"] } },
            ],
        },
    }).catch(() => {});
    await prisma.strategy.deleteMany({ where: { name: { startsWith: prefix } } }).catch(() => {});
    await prisma.feedback.deleteMany({ where: { message: { startsWith: prefix } } }).catch(() => {});
    await prisma.notification.deleteMany({ where: { title: { startsWith: prefix } } }).catch(() => {});
    await prisma.tradingAccount.deleteMany({ where: { name: { startsWith: prefix } } }).catch(() => {});

    if (snapshots.user) {
        await prisma.user.update({
            where: { id: snapshots.user.id },
            data: {
                name: snapshots.user.name,
                image: snapshots.user.image,
                streak: snapshots.user.streak,
                lastCheckIn: snapshots.user.lastCheckIn,
                checkInHistory: snapshots.user.checkInHistory,
                xp: snapshots.user.xp,
                level: snapshots.user.level,
                syncApiKey: snapshots.user.syncApiKey,
                syncApiKeyCreatedAt: snapshots.user.syncApiKeyCreatedAt,
            },
        }).catch(() => {});
    }

    if (snapshots.profile) {
        await prisma.profile.update({
            where: { id: snapshots.profile.id },
            data: {
                bio: snapshots.profile.bio,
                isPublicProfile: snapshots.profile.isPublicProfile,
                showTradeScore: snapshots.profile.showTradeScore,
                showBadges: snapshots.profile.showBadges,
                showPairStats: snapshots.profile.showPairStats,
                showSessionStats: snapshots.profile.showSessionStats,
                profileHeadline: snapshots.profile.profileHeadline,
            },
        }).catch(() => {});
    }

    if (snapshots.notifications && snapshots.user) {
        await prisma.notification.deleteMany({ where: { userId: snapshots.user.id } }).catch(() => {});
        if (snapshots.notifications.length > 0) {
            await prisma.notification.createMany({ data: snapshots.notifications }).catch(() => {});
        }
    }
}

function writeReport() {
    const strip = (value: string) => value.replace(/\u001b\[[0-9;]*m/g, "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
    const failures = results.filter((r) => r.status === "FAIL");
    const rows = failures
        .map((r) => `| ${r.viewport} | ${r.area} | ${r.action} | ${strip(r.evidence)} |`)
        .join("\n");

    fs.writeFileSync(
        reportPath,
        [
            "# User Dashboard QA - 2026-05-09",
            "",
            "Scope: Headless Playwright QA for User Dashboard across desktop and mobile.",
            "Report policy: bug-only. Passing functions are intentionally omitted.",
            "Local QA data used a unique QA-USER prefix and cleanup was attempted after the run.",
            "Each deep-QA step re-authenticates when the app redirects to login, so auth timeout cascades are filtered out.",
            "",
            failures.length ? `Bugs found: ${failures.length}.` : "Bugs found: 0.",
            "",
            failures.length
                ? ["| Viewport | Area | Action | Evidence |", "| --- | --- | --- | --- |", rows].join("\n")
                : "No User Dashboard bug was found in this run.",
            "",
        ].join("\n"),
        "utf8",
    );
}

async function snapshotUserState() {
    if (!userEmail) throw new Error("USER_QA_EMAIL is required");
    const user = await prisma.user.findFirst({
        where: { email: userEmail },
        select: {
            id: true,
            name: true,
            image: true,
            streak: true,
            lastCheckIn: true,
            checkInHistory: true,
            xp: true,
            level: true,
            syncApiKey: true,
            syncApiKeyCreatedAt: true,
        },
    });
    if (!user) throw new Error(`User ${userEmail} was not found in database`);
    snapshots.user = user;
    snapshots.profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    snapshots.notifications = await prisma.notification.findMany({ where: { userId: user.id } });
}

async function routeSmoke(page: Page, viewport: ViewportName) {
    const lesson = await prisma.lesson.findFirst({ where: { status: "published" }, select: { slug: true } });
    const quiz = await prisma.quiz.findFirst({ select: { id: true } });
    const routes = [
        "/dashboard",
        "/dashboard/accounts",
        "/dashboard/journal",
        "/dashboard/sessions",
        "/dashboard/strategies",
        "/dashboard/analytics",
        "/dashboard/reports",
        "/dashboard/reports/weekly",
        "/dashboard/reports/monthly",
        "/dashboard/mistakes",
        "/dashboard/intelligence",
        "/dashboard/psychology",
        "/dashboard/academy",
        "/dashboard/academy/certificates",
        lesson ? `/dashboard/academy/lessons/${lesson.slug}` : null,
        quiz ? `/dashboard/academy/quiz/${quiz.id}` : null,
        "/dashboard/leaderboard",
        "/dashboard/trading-systems",
        "/dashboard/notifications",
        "/dashboard/search?q=trade",
        "/dashboard/settings",
        "/dashboard/settings/account",
        "/dashboard/settings/profile",
        "/dashboard/settings/referrals",
        "/dashboard/settings/security",
        "/dashboard/settings/streak",
        "/dashboard/settings/sync-settings",
        "/dashboard/settings/feedback",
    ].filter(Boolean) as string[];

    for (const route of routes) {
        await recordStep(viewport, "Routes & Screens", `Open ${route}`, async () => {
            await gotoHealthy(page, route);
            return `${route} rendered without HTTP/app error or page-level overflow.`;
        });
    }
}

async function desktopNavigation(page: Page) {
    const items = [
        { label: "Dashboard", href: "/dashboard", url: /\/dashboard/ },
        { label: "Accounts & Props", href: "/dashboard/accounts", url: /\/dashboard\/accounts/ },
        { label: "Trading Journal", href: "/dashboard/journal", url: /\/dashboard\/journal/ },
        { label: "Strategies", href: "/dashboard/strategies", url: /\/dashboard\/strategies/ },
        { label: "Analytics Hub", href: "/dashboard/analytics", url: /\/dashboard\/analytics/ },
        { label: "Psychology", href: "/dashboard/psychology", url: /\/dashboard\/psychology/ },
        { label: "Academy", href: "/dashboard/academy", url: /\/dashboard\/academy/ },
        { label: "Leaderboard", href: "/dashboard/leaderboard", url: /\/dashboard\/leaderboard/ },
        { label: "Trading System", href: "/dashboard/trading-systems", url: /\/dashboard\/trading-systems/ },
    ];
    for (const item of items) {
        await recordStep("desktop", "Desktop Navigation", `Click sidebar item: ${item.label}`, async () => {
            await gotoHealthy(page, "/dashboard");
            await dismissBlockingOverlays(page);
            await page.locator(`#onborda-sidebar a[href="${item.href}"]`).click({ force: true });
            await expect(page).toHaveURL(item.url, { timeout: 12_000 });
            await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
            await dismissBlockingOverlays(page);
            await expectHealthyScreen(page, item.label);
        });
    }
}

async function mobileNavigation(page: Page) {
    const groups = [
        { label: "Dashboard", item: "Accounts & Props", url: /\/dashboard\/accounts/ },
        { label: "Journal", item: "Strategies", url: /\/dashboard\/strategies/ },
        { label: "Analytics", item: "Psychology", url: /\/dashboard\/psychology/ },
        { label: "More", item: "Trading System", url: /\/dashboard\/trading-systems/ },
    ];

    for (const group of groups) {
        await recordStep("mobile", "Mobile Navigation", `Open ${group.label} sheet and click ${group.item}`, async () => {
            await gotoHealthy(page, "/dashboard");
            await dismissBlockingOverlays(page);
            await page.locator(`nav.fixed button[aria-label="${group.label}"]`).evaluate((el: HTMLElement) => el.click());
            const sheetLink = page.getByRole("link", { name: group.item }).last();
            await expect(sheetLink).toBeVisible();
            await sheetLink.click();
            await expect(page).toHaveURL(group.url, { timeout: 12_000 });
            await dismissBlockingOverlays(page);
            await expectHealthyScreen(page, group.item);
        });
    }
}

async function accountFlow(page: Page, viewport: ViewportName) {
    await recordStep(viewport, "Accounts", "Create trading account and show setup instructions", async () => {
        await gotoHealthy(page, "/dashboard/accounts");
        await page.getByRole("button", { name: /add account/i }).last().click();
        // The rebuilt Add Account modal opens a chooser step first.
        const chooser = page.getByText("Add Trading Account", { exact: true });
        await chooser.waitFor({ state: "visible", timeout: 4_000 }).catch(() => {});
        if (await chooser.isVisible()) {
            await page.getByText("Free Account", { exact: true }).click();
        }
        await expect(page.getByText("Account Details")).toBeVisible();
        await page.getByPlaceholder(/My MT5 Growth/i).fill(created.accountName(viewport));
        await dismissBlockingOverlays(page);
        await page.getByRole("button", { name: /^create account$/i }).click({ force: true });
        await expect.poll(
            () => prisma.tradingAccount.count({ where: { name: created.accountName(viewport) } }),
            { timeout: 15_000 },
        ).toBe(1);
        await expect(page.getByText("Your Sync API Key")).toBeVisible({ timeout: 5_000 });
        return "Account record created and setup-instructions step remained visible.";
    });
}

async function strategyFlow(page: Page, viewport: ViewportName) {
    await recordStep(viewport, "Strategies", "Create, search, edit, delete strategy", async () => {
        await gotoHealthy(page, "/dashboard/strategies");
        await page.getByRole("button", { name: /new strategy/i }).first().click();
        await page.locator("#name").fill(created.strategyName(viewport));
        await page.locator("#description").fill(`${prefix} strategy description`);
        await page.locator("#rules").fill("- Wait for setup\n- Manage risk");
        await page.getByRole("button", { name: /save strategy/i }).click();
        await expect.poll(
            () => prisma.strategy.count({ where: { name: created.strategyName(viewport) } }),
            { timeout: 12_000 },
        ).toBe(1);
        await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
        await page.reload({ waitUntil: "domcontentloaded" });
        await dismissBlockingOverlays(page);
        await page.getByPlaceholder(/search strategies/i).fill(created.strategyName(viewport));
        await expect(page.getByText(created.strategyName(viewport))).toBeVisible({ timeout: 10_000 });
        const card = page.locator("#onborda-strategy-list").locator("div", { hasText: created.strategyName(viewport) }).first();
        await card.getByRole("button", { name: /edit strategy/i }).click({ force: true });
        await page.locator("#description").fill(`${prefix} edited description`);
        await page.getByRole("button", { name: /save strategy/i }).click();
        await expect.poll(async () => {
            const strategy = await prisma.strategy.findFirst({ where: { name: created.strategyName(viewport) } });
            return strategy?.description;
        }, { timeout: 12_000 }).toContain("edited");
        await page.reload({ waitUntil: "domcontentloaded" });
        await dismissBlockingOverlays(page);
        await page.getByPlaceholder(/search strategies/i).fill(created.strategyName(viewport));
        const updatedCard = page.locator("#onborda-strategy-list").locator("div", { hasText: created.strategyName(viewport) }).first();
        await updatedCard.getByRole("button", { name: /delete strategy/i }).click({ force: true });
        await page.getByRole("button", { name: /^delete strategy$/i }).last().click({ force: true });
        await expect.poll(
            () => prisma.strategy.count({ where: { name: created.strategyName(viewport) } }),
            { timeout: 12_000 },
        ).toBe(0);
        return "Strategy create/search/edit/delete completed.";
    });
}

async function journalFlow(page: Page, viewport: ViewportName) {
    await recordStep(viewport, "Journal", "Log trade, open details, edit trade", async () => {
        const today = new Date().toISOString().slice(0, 10);
        await gotoHealthy(page, `/dashboard/journal?from=${today}&to=${today}`);
        let journalPostEvidence = "No /api/journal-entries POST response captured.";
        await page.getByRole("button", { name: /log trade|new trade/i }).first().click();
        await page.locator('input[name="symbol"]').fill(created.journalSymbol(viewport));
        await page.locator('input[name="entryDate"]').fill(`${today}T12:00`);
        await page.locator('input[name="entryPrice"]').fill("1.1000");
        await page.locator('input[name="stopLoss"]').fill("1.0900");
        await page.locator('input[name="takeProfit"]').fill("1.1200");
        await page.locator('input[name="lotSize"]').fill("0.10");
        await page.locator('textarea[name="entryReason"]').fill(`${prefix} ${viewport} trade reason`);
        const journalResponsePromise = page.waitForResponse(
            (response) => response.url().includes("/api/journal-entries") && response.request().method() === "POST",
            { timeout: 8_000 },
        ).then(async (response) => `POST /api/journal-entries returned ${response.status()}: ${await response.text().catch(() => "")}`)
            .catch(() => journalPostEvidence);
        await page.getByRole("button", { name: /save trade/i }).click();
        journalPostEvidence = await journalResponsePromise;
        await expect.poll(
            () => prisma.journalEntry.count({ where: { symbol: created.journalSymbol(viewport), entryReason: { startsWith: prefix } } }),
            { timeout: 15_000, message: journalPostEvidence },
        ).toBe(1);
        await gotoHealthy(page, `/dashboard/journal?from=${today}&to=${today}&symbol=${created.journalSymbol(viewport)}`);
        const journalSymbol = page.getByText(created.journalSymbol(viewport));
        await expect(viewport === "desktop" ? journalSymbol.first() : journalSymbol.last()).toBeVisible({ timeout: 12_000 });
        await page.getByRole("button", { name: new RegExp(`view details for ${created.journalSymbol(viewport)}`, "i") }).first().click();
        await expect(page.locator("body")).toContainText(/Trade Details|Entry|Exit/i, { timeout: 8_000 });
        await page.keyboard.press("Escape").catch(() => {});
        if (viewport === "desktop") {
            await page.locator("tr", { hasText: created.journalSymbol(viewport) }).first().locator("button").last().click({ force: true });
        } else {
            await page.getByRole("button", { name: /edit trade/i }).first().click();
        }
        await page.locator('textarea[name="entryReason"]').fill(`${prefix} ${viewport} trade reason edited`);
        await page.getByRole("button", { name: /save trade/i }).click();
        await expect.poll(async () => {
            const entry = await prisma.journalEntry.findFirst({ where: { symbol: created.journalSymbol(viewport) }, orderBy: { createdAt: "desc" } });
            return entry?.entryReason || "";
        }, { timeout: 15_000 }).toContain("edited");
        return "Journal create/detail/edit completed.";
    });
}

async function feedbackFlow(page: Page, viewport: ViewportName) {
    await recordStep(viewport, "Feedback", "Submit feedback from dashboard quick action", async () => {
        await gotoHealthy(page, "/dashboard");
        let feedbackPostEvidence = "No /api/feedback POST response captured.";
        if (viewport === "mobile") {
            await page.locator("nav.fixed").getByRole("button", { name: "More" }).click();
            await page.getByRole("button", { name: /bug report/i }).click();
        } else {
            await page.getByRole("button", { name: /feedback & support/i }).click();
        }
        await expect(page.getByText("Feedback & Support")).toBeVisible({ timeout: 8_000 });
        await page.getByPlaceholder(/describe the bug/i).fill(created.feedbackMessage(viewport));
        const feedbackResponsePromise = page.waitForResponse(
            (response) => response.url().includes("/api/feedback") && response.request().method() === "POST",
            { timeout: 8_000 },
        ).then(async (response) => `POST /api/feedback returned ${response.status()}: ${await response.text().catch(() => "")}`)
            .catch(() => feedbackPostEvidence);
        await page.getByRole("button", { name: /submit bug report/i }).click();
        feedbackPostEvidence = await feedbackResponsePromise;
        await expect(page.getByText("Thank you!"), feedbackPostEvidence).toBeVisible({ timeout: 10_000 });
        await expect.poll(
            () => prisma.feedback.count({ where: { message: created.feedbackMessage(viewport) } }),
            { timeout: 12_000 },
        ).toBe(1);
        return "Feedback panel submitted a bug report.";
    });
}

async function settingsFlow(page: Page, viewport: ViewportName) {
    await recordStep(viewport, "Settings", "Save account settings and profile visibility controls", async () => {
        await gotoHealthy(page, "/dashboard/settings");
        let profilePutEvidence = "No /api/profile PUT response captured.";
        const bio = `${prefix} ${viewport} bio`;
        const nameInput = page.getByPlaceholder("Your full name");
        if ((await nameInput.inputValue()).trim().length < 2) {
            await nameInput.fill("Kee QA");
        }
        await page.locator("textarea").first().fill(bio);
        const profileResponsePromise = page.waitForResponse(
            (response) => response.url().includes("/api/profile") && response.request().method() === "PUT",
            { timeout: 8_000 },
        ).then(async (response) => `PUT /api/profile returned ${response.status()}: ${await response.text().catch(() => "")}`)
            .catch(() => profilePutEvidence);
        await page.getByRole("button", { name: /save changes/i }).click();
        profilePutEvidence = await profileResponsePromise;
        await expect(page.locator("body"), profilePutEvidence).toContainText(/Profile updated successfully/i, { timeout: 12_000 });

        await gotoHealthy(page, "/dashboard/settings/profile");
        const save = page.getByRole("button", { name: /save changes/i }).last();
        if (await save.isEnabled().catch(() => false)) {
            await save.click();
            await page.waitForTimeout(800);
        }
        return "Account settings saved and public-profile controls rendered.";
    });

    await recordStep(viewport, "Settings", "Sync API key buttons", async () => {
        await gotoHealthy(page, "/dashboard/settings/sync-settings");
        await expect(page.getByRole("button", { name: /generate api key|regenerate/i }).first()).toBeVisible();
        await expect(page.getByRole("link", { name: /Download Trade Manager EA/i })).toBeVisible();
        return "Sync settings screen and download actions rendered.";
    });
}

async function notificationsFlow(page: Page, viewport: ViewportName) {
    await recordStep(viewport, "Notifications", "Clear notification list", async () => {
        if (!snapshots.user) throw new Error("User snapshot missing");
        await prisma.notification.create({
            data: {
                userId: snapshots.user.id,
                type: "ANNOUNCEMENT",
                title: created.notificationTitle(viewport),
                message: `${prefix} ${viewport} notification message`,
            },
        });
        await gotoHealthy(page, "/dashboard/notifications");
        await expect(page.getByRole("heading", { name: new RegExp(created.notificationTitle(viewport)) })).toBeVisible({ timeout: 10_000 });
        await page.getByRole("button", { name: /clear all/i }).click();
        await expect.poll(
            () => prisma.notification.count({ where: { title: created.notificationTitle(viewport) } }),
            { timeout: 12_000 },
        ).toBe(0);
        return "Clear All button removed the QA notification from the UI; original notifications are restored in cleanup.";
    });
}

async function streakFlow(page: Page, viewport: ViewportName) {
    await recordStep(viewport, "Streak", "Check-in button state/action", async () => {
        await gotoHealthy(page, "/dashboard/settings/streak");
        const button = page.getByRole("button", { name: /check-in now|streak extended/i });
        await expect(button).toBeVisible({ timeout: 10_000 });
        if (await button.isEnabled()) {
            await button.click();
            await expect(page.locator("body")).toContainText(/Streak Extended|XP|days in a row/i, { timeout: 15_000 });
        }
        return "Streak page check-in control rendered and responded when enabled.";
    });
}

test.afterAll(async () => {
    await cleanup();
    writeReport();
    await prisma.$disconnect();
});

test("user dashboard complete QA across desktop and mobile", async ({ page }) => {
    page.setDefaultTimeout(8_000);
    page.setDefaultNavigationTimeout(35_000);
    await cleanup();
    await snapshotUserState();
    await loginAsUser(page);

    for (const viewport of ["desktop", "mobile"] as ViewportName[]) {
        await page.setViewportSize(viewport === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 900 });
        await routeSmoke(page, viewport);
        if (viewport === "desktop") {
            await desktopNavigation(page);
        } else {
            await mobileNavigation(page);
        }
        await accountFlow(page, viewport);
        await strategyFlow(page, viewport);
        await journalFlow(page, viewport);
        await feedbackFlow(page, viewport);
        await settingsFlow(page, viewport);
        await notificationsFlow(page, viewport);
        await streakFlow(page, viewport);
    }

    const failures = results.filter((r) => r.status === "FAIL");
    expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
});
