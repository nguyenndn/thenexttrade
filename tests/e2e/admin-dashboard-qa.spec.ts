import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

type QaIssue = {
    severity: "Critical" | "High" | "Medium" | "Low";
    area: string;
    route?: string;
    title: string;
    details: string;
    evidence?: string;
    screenshot?: string;
};

type RouteCheck = {
    label: string;
    path: string;
    kind: "menu" | "subroute" | "dynamic";
};

const adminEmail = process.env.ADMIN_QA_EMAIL;
const adminPassword = process.env.ADMIN_QA_PASSWORD;
const prisma = new PrismaClient();

const outputDir = path.join(process.cwd(), "test-results", "admin-dashboard-qa");
const reportPath = path.join(process.cwd(), "docs", "ADMIN_DASHBOARD_QA_2026-05-08.md");

const menuRoutes: RouteCheck[] = [
    { label: "Overview", path: "/admin", kind: "menu" },
    { label: "Analytics", path: "/admin/analytics", kind: "menu" },
    { label: "Articles", path: "/admin/articles", kind: "menu" },
    { label: "Shortcuts", path: "/admin/articles/shortcuts", kind: "menu" },
    { label: "Comments", path: "/admin/comments", kind: "menu" },
    { label: "Taxonomy", path: "/admin/taxonomy", kind: "menu" },
    { label: "Quotes", path: "/admin/quotes", kind: "menu" },
    { label: "Academy", path: "/admin/academy", kind: "menu" },
    { label: "VIP Requests", path: "/admin/community", kind: "menu" },
    { label: "Copy Trading", path: "/admin/copy-trading", kind: "menu" },
    { label: "Funded Challenge", path: "/admin/funded-challenge", kind: "menu" },
    { label: "EA Management", path: "/admin/ea", kind: "menu" },
    { label: "Users", path: "/admin/users", kind: "menu" },
    { label: "Security", path: "/admin/security", kind: "menu" },
    { label: "Feedback", path: "/admin/feedback", kind: "menu" },
    { label: "Settings", path: "/admin/settings", kind: "menu" },
];

const staticSubroutes: RouteCheck[] = [
    { label: "Admin Search", path: "/admin/search?q=Kee", kind: "subroute" },
    { label: "Notifications", path: "/admin/notifications", kind: "subroute" },
    { label: "Create Notification", path: "/admin/notifications/create", kind: "subroute" },
    { label: "Create Article", path: "/admin/articles/create", kind: "subroute" },
    { label: "Create Lesson", path: "/admin/academy/lessons/create", kind: "subroute" },
    { label: "EA Accounts", path: "/admin/ea/accounts", kind: "subroute" },
    { label: "EA Pending Accounts", path: "/admin/ea/accounts/pending", kind: "subroute" },
    { label: "EA Products", path: "/admin/ea/products", kind: "subroute" },
    { label: "Create EA Product", path: "/admin/ea/products/create", kind: "subroute" },
    { label: "EA Brokers", path: "/admin/ea/brokers", kind: "subroute" },
    { label: "Create EA Broker", path: "/admin/ea/brokers/create", kind: "subroute" },
    { label: "EA Settings", path: "/admin/ea/settings", kind: "subroute" },
];

async function getDynamicRoutes(): Promise<RouteCheck[]> {
    const [article, user, level, lesson, quiz, product] = await Promise.all([
        prisma.article.findFirst({ select: { id: true }, orderBy: { createdAt: "desc" } }),
        prisma.user.findFirst({ where: { profile: { role: "ADMIN" } }, select: { id: true } }),
        prisma.level.findFirst({ select: { id: true }, orderBy: { order: "asc" } }),
        prisma.lesson.findFirst({ select: { id: true }, orderBy: { createdAt: "desc" } }),
        prisma.quiz.findFirst({ select: { id: true }, orderBy: { createdAt: "desc" } }),
        prisma.eAProduct.findFirst({ select: { id: true }, orderBy: { createdAt: "desc" } }),
    ]);

    return [
        article && { label: "Edit Article", path: `/admin/articles/${article.id}/edit`, kind: "dynamic" as const },
        user && { label: "User Detail", path: `/admin/users/${user.id}`, kind: "dynamic" as const },
        level && { label: "Academy Level Detail", path: `/admin/academy/${level.id}`, kind: "dynamic" as const },
        lesson && { label: "Edit Lesson", path: `/admin/academy/lessons/${lesson.id}/edit`, kind: "dynamic" as const },
        quiz && { label: "Edit Quiz", path: `/admin/academy/quiz/${quiz.id}`, kind: "dynamic" as const },
        product && { label: "Edit EA Product", path: `/admin/ea/products/${product.id}`, kind: "dynamic" as const },
    ].filter(Boolean) as RouteCheck[];
}

async function loginAsAdmin(page: Page) {
    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 12_000 }).catch(() => {});
    await page.waitForTimeout(1_500);
    await page.locator('input[name="email"]').fill(adminEmail!);
    await page.locator('input[name="password"]').fill(adminPassword!);
    await Promise.all([
        page.waitForURL(/\/admin(?!\/login)/, { timeout: 45_000 }),
        page.getByRole("button", { name: /sign in to admin/i }).click(),
    ]);
    await expect(page).not.toHaveURL(/\/admin\/login/);
}

async function collectVisibleHeading(page: Page) {
    const heading = page.getByRole("heading").first();
    if (await heading.count()) {
        return (await heading.textContent())?.trim() || "";
    }
    return "";
}

async function saveIssueScreenshot(page: Page, slug: string) {
    fs.mkdirSync(outputDir, { recursive: true });
    const file = path.join(outputDir, `${slug}.png`);
    try {
        await page.screenshot({ path: file, fullPage: true });
        return path.relative(process.cwd(), file).replace(/\\/g, "/");
    } catch {
        return "";
    }
}

async function gotoAndCheckRoute(page: Page, route: RouteCheck, issues: QaIssue[]) {
    const slug = route.path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 90);
    const beforeIssueCount = issues.length;
    let status = 0;
    let heading = "";

    try {
        const response = await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 45_000 });
        status = response?.status() || 0;
        await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
        heading = await collectVisibleHeading(page);

        const currentUrl = page.url();
        const bodyText = (await page.locator("body").innerText({ timeout: 10_000 })).slice(0, 10_000);

        if (status >= 400) {
            issues.push({
                severity: status >= 500 ? "High" : "Medium",
                area: "Admin route",
                route: route.path,
                title: `${route.label} returns HTTP ${status}`,
                details: `Route should render for an authenticated admin but returned HTTP ${status}.`,
                evidence: `Heading: ${heading || "(none)"}`,
            });
        }

        if (/\/admin\/login/.test(currentUrl) || /\/auth\/login/.test(currentUrl)) {
            issues.push({
                severity: "High",
                area: "Admin route",
                route: route.path,
                title: `${route.label} redirects to login after authenticated login`,
                details: `Authenticated admin was redirected to ${currentUrl}.`,
                evidence: `Initial route: ${route.path}`,
            });
        }

        if (/application error|runtime error|unhandled runtime|something went wrong/i.test(bodyText)) {
            issues.push({
                severity: "High",
                area: "Client render",
                route: route.path,
                title: `${route.label} shows an app/runtime error`,
                details: "Page body contains an application/runtime error marker.",
                evidence: bodyText.slice(0, 500),
            });
        }

        if (/Page Not Found|404/i.test(bodyText) && route.kind !== "dynamic") {
            issues.push({
                severity: "Medium",
                area: "Admin route",
                route: route.path,
                title: `${route.label} shows not-found content`,
                details: "A known admin route rendered not-found text.",
                evidence: `HTTP status: ${status}; heading: ${heading || "(none)"}`,
            });
        }
    } catch (error) {
        issues.push({
            severity: "High",
            area: "Admin route",
            route: route.path,
            title: `${route.label} failed to load`,
            details: error instanceof Error ? error.message : String(error),
        });
    }

    if (issues.length > beforeIssueCount) {
        const shot = await saveIssueScreenshot(page, slug);
        if (shot) {
            for (const issue of issues.slice(beforeIssueCount)) {
                issue.screenshot = shot;
            }
        }
    }

    return { status, heading };
}

async function clickIfVisible(page: Page, name: RegExp, timeout = 2_000) {
    const target = page.getByRole("button", { name }).first();
    try {
        await target.waitFor({ state: "visible", timeout });
        await target.click();
        return true;
    } catch {
        return false;
    }
}

async function closeAnyModal(page: Page) {
    await page.keyboard.press("Escape").catch(() => {});
    const cancel = page.getByRole("button", { name: /cancel|close/i }).first();
    if (await cancel.count()) {
        await cancel.click().catch(() => {});
    }
}

async function probeSafeInteractions(page: Page, issues: QaIssue[]) {
    const checks: string[] = [];

    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});

    await page.keyboard.press("Control+K");
    const paletteInput = page.getByPlaceholder(/search for anything/i);
    if (await paletteInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        checks.push("Command palette opens with Ctrl+K");
        await paletteInput.fill("Kee");
        await page.keyboard.press("Enter");
        await page.waitForTimeout(1_000);
        if (!/\/admin\/search\?q=Kee/i.test(page.url())) {
            issues.push({
                severity: "Medium",
                area: "Admin header search",
                route: "/admin",
                title: "Admin command palette routes search to the wrong area",
                details: "From the admin shell, Ctrl+K search should use /admin/search, but it navigated outside the admin search flow.",
                evidence: `Actual URL after searching "Kee": ${page.url()}`,
                screenshot: await saveIssueScreenshot(page, "admin-command-palette-wrong-route"),
            });
        }
    } else {
        issues.push({
            severity: "Medium",
            area: "Admin header",
            route: "/admin",
            title: "Command palette did not open",
            details: "Ctrl+K did not reveal the command/search palette.",
        });
    }

    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
    if (await clickIfVisible(page, /search/i)) {
        const inputOpen = await page.getByPlaceholder(/search for anything/i).isVisible({ timeout: 2_000 }).catch(() => false);
        checks.push(inputOpen ? "Header search trigger opens command palette" : "Header search trigger clicked");
        await closeAnyModal(page);
    }

    const notificationButton = page.locator("button").filter({ has: page.locator("svg") }).nth(2);
    await notificationButton.click().catch(() => {});
    if (await page.getByText(/admin alerts/i).isVisible({ timeout: 2_000 }).catch(() => false)) {
        checks.push("Admin notification popover opens");
        await closeAnyModal(page);
    }

    await page.goto("/admin/articles/shortcuts", { waitUntil: "domcontentloaded" });
    if (await clickIfVisible(page, /add new/i)) {
        const opened = await page.getByText(/create shortcut|edit shortcut|shortcut/i).first().isVisible({ timeout: 2_000 }).catch(() => false);
        checks.push(opened ? "Shortcuts create modal opens" : "Shortcuts Add New clicked");
        await closeAnyModal(page);
    }

    await page.goto("/admin/taxonomy", { waitUntil: "domcontentloaded" });
    await clickIfVisible(page, /tags/i);
    if (await clickIfVisible(page, /add new/i)) {
        const opened = await page.getByText(/tag|category/i).first().isVisible({ timeout: 2_000 }).catch(() => false);
        checks.push(opened ? "Taxonomy create modal opens" : "Taxonomy Add New clicked");
        await closeAnyModal(page);
    }

    await page.goto("/admin/academy", { waitUntil: "domcontentloaded" });
    if (await clickIfVisible(page, /create level|add level|add new/i)) {
        const opened = await page.getByText(/create level|new level|level/i).first().isVisible({ timeout: 2_000 }).catch(() => false);
        checks.push(opened ? "Academy create level modal opens" : "Academy create action clicked");
        await closeAnyModal(page);
    }

    await page.goto("/admin/users", { waitUntil: "domcontentloaded" });
    if (await clickIfVisible(page, /add new/i)) {
        const opened = await page.getByText(/add new user/i).isVisible({ timeout: 2_000 }).catch(() => false);
        checks.push(opened ? "Users Add New modal opens" : "Users Add New clicked");
        await closeAnyModal(page);
    }

    await page.goto("/admin/security", { waitUntil: "domcontentloaded" });
    await clickIfVisible(page, /30d/i);
    await clickIfVisible(page, /90d/i);
    if (await clickIfVisible(page, /block ip/i)) {
        const submit = page.getByRole("button", { name: /^block ip$/i }).last();
        const disabled = await submit.isDisabled().catch(() => false);
        checks.push(disabled ? "Security Block IP modal opens with disabled empty submit" : "Security Block IP modal opens");
        await closeAnyModal(page);
    }

    return checks;
}

function formatIssue(issue: QaIssue, index: number) {
    const evidence = redactSensitive(issue.evidence || "");
    return [
        `### BUG-${String(index + 1).padStart(3, "0")} - ${issue.title}`,
        "",
        `- Severity: ${issue.severity}`,
        `- Area: ${issue.area}`,
        issue.route ? `- Route: \`${issue.route}\`` : "",
        issue.screenshot ? `- Screenshot: \`${issue.screenshot}\`` : "",
        "",
        issue.details,
        evidence ? `\nEvidence:\n\n\`\`\`text\n${evidence.replace(/```/g, "'''")}\n\`\`\`` : "",
    ].filter(Boolean).join("\n");
}

function redactSensitive(value: string) {
    let output = value;
    if (adminEmail) output = output.replaceAll(adminEmail, "<admin-email>");
    if (adminPassword) output = output.replaceAll(adminPassword, "<redacted-password>");
    return output;
}

function writeReport(routeResults: Array<RouteCheck & { status: number; heading: string }>, safeChecks: string[], issues: QaIssue[], apiFailures: string[], consoleErrors: string[]) {
    const rows = routeResults
        .map((r) => `| ${r.kind} | ${r.label} | \`${redactSensitive(r.path)}\` | ${r.status || "n/a"} | ${redactSensitive(r.heading || "-")} |`)
        .join("\n");

    const body = [
        "# Admin Dashboard QA Pass - 2026-05-08",
        "",
        "Pham vi: login admin, menu/sidebar, route con, dynamic edit/detail routes, safe buttons, modal open/close, filter/tab/search controls, desktop/mobile smoke.",
        "",
        "Luu y: khong submit cac thao tac nguy hiem nhu delete, approve, reject, save, send, create du lieu that.",
        "",
        "## Route Coverage",
        "",
        "| Type | Label | Path | HTTP | Heading |",
        "| --- | --- | --- | --- | --- |",
        rows,
        "",
        "## Safe Interaction Coverage",
        "",
        safeChecks.length ? safeChecks.map((c) => `- ${c}`).join("\n") : "- Khong ghi nhan duoc interaction check nao.",
        "",
        "## Issues Found",
        "",
        issues.length ? issues.map(formatIssue).join("\n\n") : "Khong phat hien issue moi trong vong QA nay.",
        "",
        "## API/Network Failures",
        "",
        apiFailures.length ? apiFailures.map((f) => `- ${redactSensitive(f)}`).join("\n") : "- Khong ghi nhan API/network failure >= 400 trong browser automation.",
        "",
        "## Console Errors",
        "",
        consoleErrors.length ? consoleErrors.slice(0, 50).map((e) => `- ${redactSensitive(e.replace(/\s+/g, " ").slice(0, 300))}`).join("\n") : "- Khong ghi nhan console error nghiem trong.",
        "",
    ].join("\n");

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, body, "utf8");
}

test.describe("Admin dashboard QA pass", () => {
    test.setTimeout(10 * 60 * 1000);
    test.skip(!adminEmail || !adminPassword, "Set ADMIN_QA_EMAIL and ADMIN_QA_PASSWORD to run admin QA.");

    test.afterAll(async () => {
        await prisma.$disconnect();
    });

    test("admin routes and safe interactions", async ({ page }) => {
        fs.mkdirSync(outputDir, { recursive: true });

        const issues: QaIssue[] = [];
        const apiFailures: string[] = [];
        const consoleErrors: string[] = [];

        page.on("console", (msg) => {
            if (msg.type() === "error") {
                consoleErrors.push(msg.text());
            }
        });
        page.on("pageerror", (err) => {
            consoleErrors.push(`Page error: ${err.message}`);
        });
        page.on("response", (response) => {
            const url = response.url();
            if (url.includes("/api/") && response.status() >= 400) {
                apiFailures.push(`${response.status()} ${url}`);
            }
        });
        page.on("requestfailed", (request) => {
            apiFailures.push(`FAILED ${request.url()} - ${request.failure()?.errorText || "unknown"}`);
        });

        await loginAsAdmin(page);

        const dynamicRoutes = await getDynamicRoutes();
        const routes = [...menuRoutes, ...staticSubroutes, ...dynamicRoutes];
        const routeResults: Array<RouteCheck & { status: number; heading: string }> = [];

        for (const route of routes) {
            const result = await gotoAndCheckRoute(page, route, issues);
            routeResults.push({ ...route, ...result });
            await page.waitForTimeout(300);
        }

        const safeChecks = await probeSafeInteractions(page, issues);

        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto("/admin", { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
        const mobileMenuButton = page.getByRole("button").first();
        await mobileMenuButton.click().catch(() => {});
        const overviewNavLink = page.getByRole("link", { name: /^Overview$/i }).first();
        if (await overviewNavLink.isVisible({ timeout: 2_000 }).catch(() => false)) {
            safeChecks.push("Mobile admin menu opens at 390x844");
        } else {
            issues.push({
                severity: "Medium",
                area: "Responsive admin navigation",
                route: "/admin",
                title: "Mobile admin menu did not open or Overview item was not visible",
                details: "At 390x844 viewport, clicking the first header menu button did not reveal the admin navigation.",
                screenshot: await saveIssueScreenshot(page, "admin-mobile-menu"),
            });
        }

        writeReport(routeResults, safeChecks, issues, Array.from(new Set(apiFailures)), Array.from(new Set(consoleErrors)));
        expect(routeResults.length).toBeGreaterThan(0);
    });
});
