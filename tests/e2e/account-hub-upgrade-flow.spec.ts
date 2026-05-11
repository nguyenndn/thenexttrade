import { expect, test } from "@playwright/test";
import { PrismaClient, UserRole } from "@prisma/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const prisma = new PrismaClient();
const runId = Date.now();
const accountNumber = `900${String(runId).slice(-6)}`;
const user = {
  id: "",
  email: `upgrade-flow-${runId}@example.test`,
  password: `Upgrade-${runId}!`,
  name: `Upgrade Flow ${runId}`,
  username: `up${String(runId).slice(-8)}`,
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function cleanup() {
  if (!user.id) return;
  await prisma.notification.deleteMany({ where: { userId: user.id } }).catch(() => {});
  await prisma.ibActivitySnapshot.deleteMany({ where: { userId: user.id } }).catch(() => {});
  await prisma.journalEntry.deleteMany({ where: { userId: user.id } }).catch(() => {});
  await prisma.proEntitlement.deleteMany({ where: { userId: user.id } }).catch(() => {});
  await prisma.vipRequest.deleteMany({ where: { userId: user.id } }).catch(() => {});
  await prisma.ibLead.deleteMany({ where: { userId: user.id } }).catch(() => {});
  await prisma.eALicense.deleteMany({ where: { userId: user.id } }).catch(() => {});
  await prisma.tradingAccount.deleteMany({ where: { userId: user.id } }).catch(() => {});
  await prisma.analyticsEvent.deleteMany({ where: { userId: user.id } }).catch(() => {});
  await prisma.profile.deleteMany({ where: { userId: user.id } }).catch(() => {});
  await prisma.user.deleteMany({ where: { id: user.id } }).catch(() => {});

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceRoleKey) {
    const admin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await admin.auth.admin.deleteUser(user.id).catch(() => {});
  }
}

async function createUserAndAccount() {
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

  user.id = data.user.id;
  await prisma.user.create({ data: { id: user.id, email: user.email, name: user.name } });
  await prisma.profile.create({ data: { userId: user.id, role: UserRole.USER, username: user.username } });
  await prisma.tradingAccount.create({
    data: {
      userId: user.id,
      name: "Vantage Upgrade QA",
      platform: "MT5",
      broker: "Vantage",
      accountNumber,
      balance: 29242.6,
      equity: 30339.99,
      currency: "USD",
      apiKey: `qa_${runId}`,
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

test.afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

test("existing account Unlock Pro submits account-scoped upgrade request", async ({ page }) => {
  await cleanup();
  await createUserAndAccount();
  await login(page);

  await page.goto("/dashboard/accounts");
  await expect(page.getByRole("heading", { name: "Account Hub", exact: true })).toBeVisible({ timeout: 30000 });

  const card = page.locator("#onborda-account-grid").filter({ hasText: "Vantage Upgrade QA" }).first();
  await expect(card.getByText(`#${accountNumber}`)).toBeVisible();
  await card.getByRole("button", { name: "Unlock Pro access" }).click();

  await expect(page.getByRole("heading", { name: "Unlock Partner Pro" })).toBeVisible();
  await expect(page.getByText("Vantage", { exact: true })).toBeVisible();
  await expect(page.getByText(accountNumber, { exact: true })).toBeVisible();

  await page.getByPlaceholder("@yourusername").fill(`@upgrade_${String(runId).slice(-6)}`);
  await page.getByPlaceholder("e.g. Vietnam").fill("Vietnam");
  await page.getByRole("button", { name: /Submit Upgrade Request/i }).click();
  await expect(page.getByRole("heading", { name: "Request Submitted!", exact: true })).toBeVisible({ timeout: 30000 });

  const account = await prisma.tradingAccount.findFirst({ where: { userId: user.id, accountNumber } });
  expect(account).toBeTruthy();

  const vip = await prisma.vipRequest.findFirst({
    where: { userId: user.id, tradingAccountId: account!.id },
  });
  expect(vip).toBeTruthy();
  expect(vip!.broker).toBe("VANTAGE");
  expect(vip!.accountNumber).toBe(accountNumber);
});
