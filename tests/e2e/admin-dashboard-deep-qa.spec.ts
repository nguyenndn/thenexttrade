import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

const adminEmail = process.env.ADMIN_QA_EMAIL;
const adminPassword = process.env.ADMIN_QA_PASSWORD;
const viewportName = process.env.ADMIN_QA_VIEWPORT === "mobile" ? "mobile" : "desktop";
const runId = Date.now();
const prefix = `QA-DEEP-${runId}`;
const reportPath = path.join(process.cwd(), "docs", "ADMIN_DASHBOARD_DEEP_QA_2026-05-09.md");

type Result = {
    area: string;
    action: string;
    status: "PASS" | "FAIL" | "SKIP";
    evidence: string;
};

const results: Result[] = [];
const created = {
    userEmail: `qa.deep.${runId}@example.com`,
    userName: `${prefix} User`,
    notificationTitle: `${prefix} Scheduled Broadcast`,
    blockedIp: `203.0.113.${(runId % 200) + 1}`,
    productName: `${prefix} EA Product`,
    brokerName: `${prefix} Broker`,
    quoteText: `${prefix} quote text`,
    categoryName: `${prefix} Category`,
    tagName: `${prefix} Tag`,
    commentText: `${prefix} comment`,
    feedbackText: `${prefix} feedback`,
    vipAccount: `${runId}`.slice(-8),
    copyAccount: `${runId}`.slice(-8).padStart(8, "7"),
};

test.setTimeout(12 * 60 * 1000);

async function loginAsAdmin(page: Page) {
    if (!adminEmail || !adminPassword) {
        throw new Error("ADMIN_QA_EMAIL and ADMIN_QA_PASSWORD are required");
    }

    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 12_000 }).catch(() => {});
    await page.locator('input[name="email"]').fill(adminEmail);
    await page.locator('input[name="password"]').fill(adminPassword);
    await Promise.all([
        page.waitForURL(/\/admin(?!\/login)/, { timeout: 45_000 }),
        page.getByRole("button", { name: /sign in to admin/i }).click(),
    ]);
}

async function recordStep(area: string, action: string, fn: () => Promise<string | void>) {
    try {
        const evidence = await fn();
        results.push({ area, action, status: "PASS", evidence: evidence || "Verified in Playwright." });
    } catch (error) {
        results.push({
            area,
            action,
            status: "FAIL",
            evidence: error instanceof Error ? error.message : String(error),
        });
    }
}

async function expectBody(page: Page, pattern: RegExp, timeout = 6_000) {
    await expect(page.locator("body")).toContainText(pattern, { timeout });
}

async function confirmDanger(page: Page, name = /^Delete$/i) {
    const roleButton = page.getByRole("button", { name }).last();
    if (await roleButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await roleButton.click();
    } else {
        await page.locator("button").filter({ hasText: name }).last().click();
    }
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
    await page.waitForTimeout(800);
}

async function cleanup() {
    await prisma.notification.deleteMany({ where: { title: { startsWith: prefix } } }).catch(() => {});
    await prisma.adminBroadcast.deleteMany({ where: { title: { startsWith: prefix } } }).catch(() => {});
    await prisma.blockedIP.deleteMany({ where: { ip: created.blockedIp } }).catch(() => {});
    await prisma.eAProduct.deleteMany({ where: { name: { startsWith: prefix } } }).catch(() => {});
    await prisma.eABroker.deleteMany({ where: { name: { startsWith: prefix } } }).catch(() => {});
    await prisma.quote.deleteMany({ where: { text: { startsWith: prefix } } }).catch(() => {});
    await prisma.comment.deleteMany({ where: { content: { startsWith: prefix } } }).catch(() => {});
    await prisma.feedback.deleteMany({ where: { message: { startsWith: prefix } } }).catch(() => {});
    await prisma.vipRequest.deleteMany({ where: { accountNumber: created.vipAccount } }).catch(() => {});
    await prisma.tag.deleteMany({ where: { name: { startsWith: prefix } } }).catch(() => {});
    await prisma.category.deleteMany({ where: { name: { startsWith: prefix } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { email: created.userEmail } }).catch(() => {});
}

function writeReport() {
    const stripAnsi = (value: string) => value.replace(/\u001b\[[0-9;]*m/g, "");
    const failures = results.filter((r) => r.status === "FAIL");
    const rows = failures
        .map((r) => `| ${r.area} | ${r.action} | ${r.status} | ${stripAnsi(r.evidence).replace(/\r?\n/g, " ")} |`)
        .join("\n");

    fs.writeFileSync(
        reportPath,
        [
            "# Admin Dashboard Deep QA - 2026-05-09",
            "",
            "Scope: Playwright retest with local test data creation enabled.",
            `Viewport: ${viewportName}.`,
            "",
            "Notes:",
            "- Academy and Articles were validation-only per request. No valid academy lesson/article was submitted.",
            "- Test data used a unique QA-DEEP prefix and cleanup was attempted after the run.",
            "- This report intentionally lists only failures/bugs. Passing functions are omitted.",
            "",
            failures.length ? `Bugs found: ${failures.length}.` : "Bugs found: 0.",
            "",
            failures.length
                ? ["| Area | Action | Status | Evidence |", "| --- | --- | --- | --- |", rows].join("\n")
                : "No Admin Dashboard bug was found in this run.",
            "",
        ].join("\n"),
        "utf8",
    );
}

test.afterAll(async () => {
    await cleanup();
    writeReport();
    await prisma.$disconnect();
});

test("deep admin dashboard functions with local QA data", async ({ page }) => {
    await page.setViewportSize(viewportName === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 900 });
    page.setDefaultTimeout(8_000);
    page.setDefaultNavigationTimeout(35_000);
    await cleanup();
    await loginAsAdmin(page);

    const admin = await prisma.user.findFirst({ where: { email: adminEmail }, select: { id: true, email: true } });
    const article = await prisma.article.findFirst({ select: { id: true, title: true } });
    if (!admin) throw new Error("Admin user not found in database");

    await recordStep("Articles", "Create article validation only", async () => {
        await page.goto("/admin/articles/create", { waitUntil: "domcontentloaded" });
        await page.getByRole("button", { name: /publish/i }).click();
        await expectBody(page, /Missing required fields: Article Title, Category, Content/i);
        await expect(page).toHaveURL(/\/admin\/articles\/create/);
        return "Empty submit stays on create page and shows required field warning.";
    });

    await recordStep("Academy", "Create lesson validation only", async () => {
        await page.goto("/admin/academy/lessons/create", { waitUntil: "domcontentloaded" });
        await page.getByRole("button", { name: /save lesson/i }).click();
        await expectBody(page, /Title is required/i);
        await page.getByPlaceholder("Lesson Title").fill(`${prefix} Lesson`);
        await page.getByRole("button", { name: /save lesson/i }).click();
        await expectBody(page, /Please select a module/i);
        await expect(page).toHaveURL(/\/admin\/academy\/lessons\/create/);
        return "Title and module validations triggered without creating a lesson.";
    });

    await recordStep("Notifications", "Create scheduled broadcast", async () => {
        await page.goto("/admin/notifications/create", { waitUntil: "domcontentloaded" });
        await page.getByPlaceholder("System Maintenance").fill(created.notificationTitle);
        await page.getByPlaceholder(/scheduled maintenance/i).fill(`${prefix} notification message`);
        await page.locator('input[type="datetime-local"]').fill("2099-01-01T09:00");
        await Promise.all([
            page.waitForURL(/\/admin\/notifications$/, { timeout: 20_000 }),
            page.getByRole("button", { name: /send broadcast/i }).click(),
        ]);
        await expectBody(page, new RegExp(created.notificationTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
        await expectBody(page, /Scheduled/i);
        return "Scheduled broadcast created and listed as Scheduled.";
    });

    await recordStep("Security", "Block and unblock IP", async () => {
        await page.goto("/admin/security", { waitUntil: "domcontentloaded" });
        await page.getByRole("button", { name: /Blocked IPs/i }).click();
        await page.getByRole("button", { name: /^Block IP$/i }).last().click();
        await page.getByPlaceholder(/192\.168\.1\.1/i).fill(created.blockedIp);
        await page.getByPlaceholder(/Brute force attempt/i).fill(`${prefix} security QA`);
        await page.getByPlaceholder(/1440/i).fill("5");
        await page.getByRole("button", { name: /^Block IP$/i }).last().click();
        await expectBody(page, new RegExp(created.blockedIp.replace(/\./g, "\\.")), 10_000);
        const row = page.locator("tr", { hasText: created.blockedIp });
        await row.getByRole("button", { name: /unblock/i }).click();
        await expect(row).toHaveCount(0, { timeout: 10_000 });
        return "Temporary IP block appeared in table and was unblocked.";
    });

    await recordStep("EA Products", "Create, search, delete product", async () => {
        await page.goto("/admin/ea/products/create", { waitUntil: "domcontentloaded" });
        await page.getByPlaceholder("TheNextTrade Auto Trader").fill(created.productName);
        const editor = page.locator(".ProseMirror").first();
        await editor.click();
        await editor.pressSequentially(`${prefix} product description`);
        await Promise.all([
            page.waitForURL(/\/admin\/ea\/products$/, { timeout: 25_000 }),
            page.getByRole("button", { name: /create product/i }).click(),
        ]);
        await page.getByPlaceholder("Search products...").fill(created.productName);
        await expectBody(page, new RegExp(created.productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
        await page.getByRole("button", { name: new RegExp(`Delete ${created.productName}`) }).click();
        await confirmDanger(page);
        await expect.poll(
            () => prisma.eAProduct.count({ where: { name: created.productName } }),
            { timeout: 10_000 },
        ).toBe(0);
        return "Product validation, create, search, and delete flow completed.";
    });

    await recordStep("EA Brokers", "Create-form guard, edit seeded broker, delete broker", async () => {
        await page.goto("/admin/ea/brokers/create", { waitUntil: "domcontentloaded" });
        await page.getByRole("button", { name: /create ea broker/i }).click();
        await page.waitForTimeout(800);
        await expect(page).toHaveURL(/\/admin\/ea\/brokers\/create/);
        await prisma.eABroker.create({
            data: {
                name: created.brokerName,
                slug: created.brokerName.toUpperCase().replace(/[^A-Z0-9]+/g, "_"),
                logo: "/images/brokers/exness.png",
                color: "#00C888",
                ibCode: "QA-OLD",
            },
        });
        await page.goto("/admin/ea/brokers", { waitUntil: "domcontentloaded" });
        await expectBody(page, new RegExp(created.brokerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
        await page.getByRole("button", { name: new RegExp(`Edit ${created.brokerName}`) }).click();
        await page.getByPlaceholder(/14647313/i).fill("QA-UPDATED");
        await page.getByRole("button", { name: /save changes/i }).click();
        await expectBody(page, /Broker updated successfully/i);
        await page.getByRole("button", { name: new RegExp(`Edit ${created.brokerName}`) }).click();
        await page.getByRole("button", { name: /delete broker/i }).click();
        await confirmDanger(page);
        await expect(page.locator("body")).not.toContainText(created.brokerName, { timeout: 10_000 });
        return "Broker validation, edit, and delete flow completed.";
    });

    await recordStep("Users", "Validate, create, search, delete user", async () => {
        await page.goto("/admin/users", { waitUntil: "domcontentloaded" });
        await page.getByRole("button", { name: /add new/i }).click();
        await page.getByRole("button", { name: /create user/i }).click();
        await expectBody(page, /Name is required|Invalid email address|Password/i);
        await page.getByPlaceholder("John Doe").fill(created.userName);
        await page.getByPlaceholder("user@example.com").fill(created.userEmail);
        const passwordInputs = page.locator('input[type="password"]');
        await passwordInputs.nth(0).fill("loveyou25");
        await passwordInputs.nth(1).fill("loveyou25");
        await page.getByRole("button", { name: /create user/i }).click();
        await expect(page.getByPlaceholder(/search by name or email/i)).toBeVisible({ timeout: 20_000 });
        await page.getByPlaceholder(/search by name or email/i).fill(created.userEmail);
        await expectBody(page, new RegExp(created.userEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), 15_000);
        const row = page.locator("tr", { hasText: created.userEmail });
        await row.getByRole("button", { name: /user actions/i }).click();
        await page.getByText("Delete User").click();
        await confirmDanger(page);
        await expect(page.locator("body")).not.toContainText(created.userEmail, { timeout: 15_000 });
        return "User validation, create/search, and delete completed.";
    });

    await recordStep("Quotes", "Create, edit, toggle, delete quote", async () => {
        await page.goto("/admin/quotes", { waitUntil: "domcontentloaded" });
        await page.getByRole("button", { name: /add new|create quote/i }).first().click();
        await page.getByPlaceholder("Enter the quote text...").fill(created.quoteText);
        await page.getByPlaceholder(/Warren Buffett/i).fill("QA");
        await page.getByRole("button", { name: /create quote/i }).click();
        await expectBody(page, new RegExp(created.quoteText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), 10_000);
        const row = page.locator("tr", { hasText: created.quoteText });
        await row.getByRole("button", { name: /active|inactive/i }).click();
        await row.getByRole("button", { name: /open actions/i }).click();
        await page.getByText("Edit").last().click();
        await page.getByPlaceholder("Enter the quote text...").fill(`${created.quoteText} edited`);
        await page.getByRole("button", { name: /save changes/i }).click();
        await expectBody(page, new RegExp(`${created.quoteText} edited`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
        await page.locator("tr", { hasText: `${created.quoteText} edited` }).getByRole("button", { name: /open actions/i }).click();
        await page.getByText("Delete").last().click();
        await confirmDanger(page);
        await expect(page.locator("body")).not.toContainText(created.quoteText, { timeout: 10_000 });
        return "Quote create/edit/toggle/delete flow completed.";
    });

    await recordStep("Taxonomy", "Create and delete category and tag", async () => {
        await page.goto("/admin/taxonomy", { waitUntil: "domcontentloaded" });
        await page.getByRole("button", { name: /add new/i }).click();
        await page.getByPlaceholder("Market Analysis").fill(created.categoryName);
        await page.getByPlaceholder("market-analysis").fill(created.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
        await page.getByRole("button", { name: /create category/i }).click();
        await expectBody(page, new RegExp(created.categoryName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
        await page.locator("tr", { hasText: created.categoryName }).getByRole("button", { name: /open actions/i }).click();
        await page.getByText("Delete").last().click();
        await confirmDanger(page, /Delete Category/i);
        await expect(page.locator("body")).not.toContainText(created.categoryName, { timeout: 10_000 });

        await page.getByRole("button", { name: /^Tags$/i }).click();
        await page.getByRole("button", { name: /add new/i }).click();
        await page.locator('input[name="name"]:visible').fill(created.tagName);
        await page.locator('input[name="slug"]:visible').fill(created.tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
        await page.getByRole("button", { name: /create tag/i }).click();
        await expectBody(page, new RegExp(created.tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
        await page.locator("tr", { hasText: created.tagName }).getByRole("button", { name: /open actions/i }).click();
        await page.getByText("Delete").last().click();
        await confirmDanger(page);
        await expect(page.locator("body")).not.toContainText(created.tagName, { timeout: 10_000 });
        return "Category and tag create/delete flows completed.";
    });

    await recordStep("Comments", "Seed and delete comment", async () => {
        const comment = await prisma.comment.create({
            data: {
                content: created.commentText,
                userId: admin.id,
                ...(article ? { articleId: article.id } : {}),
            },
        });
        await page.goto("/admin/comments", { waitUntil: "domcontentloaded" });
        await page.getByPlaceholder("Search comments...").fill(created.commentText);
        await expectBody(page, new RegExp(created.commentText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
        await page.getByRole("button", { name: /delete comment/i }).click();
        await confirmDanger(page);
        await expect(page.locator("body")).not.toContainText(created.commentText, { timeout: 10_000 });
        await prisma.comment.deleteMany({ where: { id: comment.id } }).catch(() => {});
        return "Seeded comment was searchable and deletable from admin.";
    });

    await recordStep("Feedback", "Seed feedback, search, update status/filter", async () => {
        await prisma.feedback.create({
            data: { type: "BUG", message: created.feedbackText, status: "OPEN", userId: admin.id },
        });
        await page.goto("/admin/feedback", { waitUntil: "domcontentloaded" });
        await page.getByPlaceholder("Search feedback...").fill(created.feedbackText);
        await expectBody(page, new RegExp(created.feedbackText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
        const card = page.locator("div", { hasText: created.feedbackText }).filter({ hasText: /Open/i }).first();
        await card.getByRole("button", { name: /open/i }).click();
        await page.getByText("Resolved").last().click();
        await expectBody(page, /Status updated/i);
        await page.getByRole("button", { name: /Status:/i }).click();
        await page.getByText("Resolved").last().click();
        await expectBody(page, new RegExp(created.feedbackText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
        return "Feedback search, status update, and status filter completed.";
    });

    await recordStep("VIP Pipeline", "Seed VIP request, view, approve, delete", async () => {
        await prisma.vipRequest.create({
            data: {
                userId: admin.id,
                broker: "EXNESS",
                accountNumber: created.vipAccount,
                balance: "10000",
                fullName: prefix,
                email: admin.email || adminEmail!,
                country: "VN",
                telegramId: `@${prefix.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
                status: "PENDING",
            },
        });
        await page.goto(`/admin/ib/pipeline?qa=${runId}`, { waitUntil: "domcontentloaded" });
        await page.getByPlaceholder(/Search name, email, Telegram, account #/i).fill(created.vipAccount);
        await page.getByRole("button", { name: /^Search$/i }).click();
        await expectBody(page, new RegExp(created.vipAccount));
        const row = page.locator("tr", { hasText: created.vipAccount });
        await row.getByRole("button", { name: /^Approve$/i }).click();
        await expectBody(page, /approved/i, 10_000);
        const actionsBtn = page.locator("tr", { hasText: created.vipAccount }).getByRole("button").last();
        await actionsBtn.click();
        await page.getByText("Delete Request").click();
        await confirmDanger(page);
        await expect(page.locator("body")).not.toContainText(created.vipAccount, { timeout: 10_000 });
        return "VIP request view, approve, and delete flow completed.";
    });

    const failures = results.filter((r) => r.status === "FAIL");
    expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
});
