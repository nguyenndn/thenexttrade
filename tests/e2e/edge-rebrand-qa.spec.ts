import { expect, test } from "@playwright/test";
import { PrismaClient, UserRole } from "@prisma/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const prisma = new PrismaClient();
const runId = Date.now() + Math.random().toString().slice(-4);
const user = {
    id: "",
    email: `edge-rebrand-qa-${runId}@example.test`,
    password: `Test-${runId}!`,
    name: `Edge QA User ${runId}`,
    username: `qa${String(runId).slice(-8)}`,
};

function requireEnv(name: string) {
    const value = process.env[name];
    if (!value) throw new Error(`${name} is required`);
    return value;
}

async function cleanup() {
    if (!user.id) return;
    await prisma.notification.deleteMany({ where: { userId: user.id } }).catch(() => { });
    await prisma.profile.deleteMany({ where: { userId: user.id } }).catch(() => { });
    await prisma.user.deleteMany({ where: { id: user.id } }).catch(() => { });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceRoleKey) {
        const admin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
        await admin.auth.admin.deleteUser(user.id).catch(() => { });
    }
}

async function createUser() {
    const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const admin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await admin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { full_name: user.name },
    });
    if (error || !data.user) throw new Error(`createUser failed: ${error?.message || "missing user"}`);
    // Create or update user
    await prisma.user.upsert({
        where: { id: data.user.id },
        update: { email: user.email, name: user.name },
        create: { id: data.user.id, email: user.email, name: user.name }
    });
    
    // Create or update profile
    await prisma.profile.upsert({
        where: { userId: data.user.id },
        update: { role: UserRole.USER, username: user.username, xp: 5000 },
        create: { userId: data.user.id, role: UserRole.USER, username: user.username, xp: 5000 }
    });

    await prisma.tradingAccount.create({
        data: {
            userId: data.user.id,
            name: "Edge QA Account",
            platform: "MT5",
            broker: "Vantage",
            accountNumber: "999999",
            balance: 10000,
            equity: 10000,
            currency: "USD",
            apiKey: `qa_edge_${runId}`,
            color: "hsl(var(--primary))",
        },
    });
}

async function login(page: import("@playwright/test").Page) {
    const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const admin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: user.email });
    const emailOtp = data.properties?.email_otp;
    if (error || !emailOtp) throw new Error(`magic link failed: ${error?.message || "missing OTP"}`);

    const anon = createSupabaseClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const verified = await anon.auth.verifyOtp({ email: user.email, token: emailOtp, type: "magiclink" });
    if (verified.error || !verified.data.session) {
        throw new Error(`verifyOtp failed: ${verified.error?.message || "missing session"}`);
    }

    const cookiesToSet: { name: string; value: string; options: any }[] = [];
    const server = createServerClient(supabaseUrl, anonKey, {
        cookies: {
            getAll: () => [],
            setAll: (cookies) => cookiesToSet.push(...cookies),
        },
    });
    await server.auth.setSession({
        access_token: verified.data.session.access_token,
        refresh_token: verified.data.session.refresh_token,
    });

    await page.context().addCookies(
        cookiesToSet.map(({ name, value, options }) => ({
            name,
            value,
            url: "http://localhost:3000",
            httpOnly: options?.httpOnly ?? false,
            secure: false,
            sameSite: "Lax" as const,
        }))
    );
}

test.beforeAll(async () => {
    await cleanup();
    await createUser();
});

test.afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
});

test.beforeEach(async ({ page }) => {
    await login(page);
});

test.describe("Edge Rebrand & Features Verification", () => {
    test("Verify all Edge Rebrand features in single flow", async ({ page }) => {
        // 1. Verify /edge public page
        await page.goto("/edge");
        await expect(page.getByRole("heading", { name: "What Is Edge?" })).toBeVisible({ timeout: 15000 });
        await expect(page.getByText("Apprentice")).toBeVisible();
        await expect(page.getByText("Operator")).toBeVisible();
        await expect(page.getByText("Edge is not money, crypto, a financial asset, or a reward with real-world cash value.")).toBeVisible();

        // 2. Verify Leaderboard uses Edge instead of XP
        await page.goto("/dashboard/leaderboard");
        await expect(page.getByRole("heading", { name: "Leaderboard", exact: true })).toBeVisible({ timeout: 15000 });
        let bodyText = await page.innerText("body");
        expect(bodyText).not.toMatch(/\bXP\b/);
        await expect(page.getByText(/Edge/i).first()).toBeVisible();

        // 3. Verify Streak page uses Edge instead of XP
        await page.goto("/dashboard/settings/streak");
        await expect(page.getByText("Current Login Streak")).toBeVisible({ timeout: 15000 });
        await expect(page.getByText("Day Streak", { exact: false }).first()).toBeVisible();
        bodyText = await page.innerText("body");
        expect(bodyText).not.toMatch(/\bXP\b/);
        await expect(page.getByText(/Edge/i).first()).toBeVisible();

        // 4. Verify Account Hub Free vs Pro Modal
        await page.goto("/dashboard/accounts");
        await expect(page.getByRole("heading", { name: "Account Hub", exact: true })).toBeVisible({ timeout: 15000 });
        await page.getByRole("button", { name: /Free vs Pro/i }).click();
        await expect(page.getByRole("heading", { name: "Free vs Partner Pro" })).toBeVisible();
        await expect(page.getByText("Partner Pro access is a complimentary upgrade")).toBeVisible();
        await expect(page.getByText("Performance Analytics")).toBeVisible();
        await expect(page.getByText("Priority Trade Processing")).toBeVisible();
        await expect(page.getByRole("button", { name: "Got it" })).toBeVisible();
    });
});
