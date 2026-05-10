import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const userEmail = process.env.USER_QA_EMAIL || "keezimin@gmail.com";
const userPassword = process.env.USER_QA_PASSWORD || "Password123!";
const runId = Date.now();
const prefix = `QA-VERIFY-${runId}`;

test.describe.configure({ mode: "serial" });
test.setTimeout(8 * 60 * 1000);

let userSnapshot: {
    id: string;
    name: string | null;
    image: string | null;
    profileBio: string | null;
} | null = null;

async function login(page: Page) {
    if (!userEmail || !userPassword) {
        throw new Error("USER_QA_EMAIL and USER_QA_PASSWORD are required");
    }

    await page.goto("/auth/login", { waitUntil: "domcontentloaded" });
    await page.locator('input[name="email"]').fill(userEmail);
    await page.locator('input[name="password"]').fill(userPassword);
    await Promise.all([
        page.waitForURL(/\/dashboard/, { timeout: 45_000 }),
        page.getByRole("button", { name: /^login$/i }).click(),
    ]);
    await page.waitForLoadState("networkidle", { timeout: 12_000 }).catch(() => {});
}

async function dismissOverlays(page: Page) {
    for (let i = 0; i < 3; i += 1) {
        const gotIt = page.getByRole("button", { name: /got it/i }).last();
        if (await gotIt.isVisible({ timeout: 500 }).catch(() => false)) {
            await gotIt.click({ force: true }).catch(() => {});
            await page.waitForTimeout(250);
            continue;
        }
        break;
    }
}

async function goto(page: Page, path: string) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    await dismissOverlays(page);
}

async function cleanup() {
    await prisma.tradingAccount.deleteMany({ where: { name: { startsWith: prefix } } }).catch(() => {});
    await prisma.strategy.deleteMany({ where: { name: { startsWith: prefix } } }).catch(() => {});
    if (userSnapshot) {
        await prisma.user.update({
            where: { id: userSnapshot.id },
            data: { name: userSnapshot.name, image: userSnapshot.image },
        }).catch(() => {});
        await prisma.profile.update({
            where: { userId: userSnapshot.id },
            data: { bio: userSnapshot.profileBio },
        }).catch(() => {});
    }
}

test.beforeAll(async () => {
    if (!userEmail) throw new Error("USER_QA_EMAIL is required");
    const user = await prisma.user.findFirst({
        where: { email: userEmail },
        select: { id: true, name: true, image: true, profile: { select: { bio: true } } },
    });
    if (!user) throw new Error(`User not found: ${userEmail}`);
    userSnapshot = {
        id: user.id,
        name: user.name,
        image: user.image,
        profileBio: user.profile?.bio ?? null,
    };
    await cleanup();
});

test.afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
});

for (const viewport of [
    { name: "desktop", size: { width: 1440, height: 900 } },
    { name: "mobile", size: { width: 390, height: 844 } },
] as const) {
    test(`USER-001 account setup instructions stay visible after create - ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize(viewport.size);
        await login(page);
        await goto(page, "/dashboard/accounts");

        const accountName = `${prefix} ${viewport.name} Account`;
        await page.getByRole("button", { name: /add account/i }).last().click();
        await expect(page.getByText("Account Details")).toBeVisible();
        await page.getByPlaceholder(/My MT5 Growth/i).fill(accountName);
        await page.getByRole("button", { name: /^create account$/i }).click({ force: true });

        await expect(page.getByText("Setup Instructions")).toBeVisible({ timeout: 12_000 });
        await expect(page.getByText("Your API Key (Shown Once)")).toBeVisible();
        await expect.poll(
            () => prisma.tradingAccount.count({ where: { name: accountName } }),
            { timeout: 12_000 },
        ).toBe(1);
    });

    test(`USER-002 strategy delete removes record - ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize(viewport.size);
        await login(page);
        await goto(page, "/dashboard/strategies");

        const strategyName = `${prefix} ${viewport.name} Strategy`;
        await page.getByRole("button", { name: /new strategy/i }).first().click();
        await page.locator("#name").fill(strategyName);
        await page.locator("#description").fill(`${prefix} strategy description`);
        await page.locator("#rules").fill("- setup\n- risk");
        await page.getByRole("button", { name: /save strategy/i }).click({ force: true });

        await expect.poll(
            () => prisma.strategy.count({ where: { name: strategyName } }),
            { timeout: 12_000 },
        ).toBe(1);

        await page.reload({ waitUntil: "domcontentloaded" });
        await dismissOverlays(page);
        await page.getByPlaceholder(/search strategies/i).fill(strategyName);
        const card = page.locator("#onborda-strategy-list").locator("div", { hasText: strategyName }).first();
        await expect(card).toBeVisible({ timeout: 12_000 });
        await card.getByRole("button", { name: /delete strategy/i }).click({ force: true });
        await page.getByRole("button", { name: /delete strategy/i }).last().click({ force: true });

        await expect.poll(
            () => prisma.strategy.count({ where: { name: strategyName } }),
            { timeout: 12_000 },
        ).toBe(0);
    });

    test(`USER-003 account settings save succeeds - ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize(viewport.size);
        await login(page);
        await goto(page, "/dashboard/settings");

        const bio = `${prefix} ${viewport.name} bio`;
        const nameInput = page.getByPlaceholder("Your full name");
        if ((await nameInput.inputValue()).trim().length < 2) {
            await nameInput.fill("Kee QA");
        }
        await page.locator("textarea").first().fill(bio);
        await page.getByRole("button", { name: /save changes/i }).click({ force: true });

        await expect(page.locator("body")).toContainText(/Profile updated successfully/i, { timeout: 12_000 });
        await expect.poll(async () => {
            const profile = await prisma.profile.findUnique({
                where: { userId: userSnapshot!.id },
                select: { bio: true },
            });
            return profile?.bio ?? "";
        }, { timeout: 12_000 }).toBe(bio);
    });
}
