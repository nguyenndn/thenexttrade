import { expect, test, type Page } from "@playwright/test";
import { PrismaClient, UserRole } from "@prisma/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const runId = Date.now();
const prefix = `QA-HUB-${runId}`;
const artifactDir = path.join(process.cwd(), "test-results", "account-hub-qa");
const reportPath = path.join(process.cwd(), "docs", "ACCOUNT_HUB_QA_2026-05-10.md");

type QaFinding = {
  id: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  area: string;
  evidence: string;
  recommendation: string;
};

const findings: QaFinding[] = [];

const user = {
  id: "",
  email: `account-hub-${runId}@example.test`,
  password: `Hub-${runId}!`,
  name: `${prefix} Trader`,
  username: `hub${String(runId).slice(-8)}`,
};

test.describe.configure({ mode: "serial" });
test.setTimeout(8 * 60 * 1000);
test.use({
  viewport: { width: 1440, height: 980 },
  screenshot: "on",
  video: "on",
  trace: "on",
});

function recordFinding(finding: Omit<QaFinding, "id">) {
  findings.push({
    id: `HUB-QA-${String(findings.length + 1).padStart(3, "0")}`,
    ...finding,
  });
}

async function shot(page: Page, name: string) {
  fs.mkdirSync(artifactDir, { recursive: true });
  await page.screenshot({
    path: path.join(artifactDir, `${String(findings.length).padStart(2, "0")}-${name}.png`),
    fullPage: true,
  });
}

async function isVisible(page: Page, text: string | RegExp, timeout = 4000) {
  try {
    await expect(page.getByText(text)).toBeVisible({ timeout });
    return true;
  } catch {
    return false;
  }
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for Account Hub QA`);
  return value;
}

async function createAuthUser() {
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
  if (error || !data.user) throw new Error(`Failed to create user: ${error?.message || "missing user"}`);

  user.id = data.user.id;
  await prisma.user.upsert({
    where: { id: user.id },
    update: { email: user.email, name: user.name },
    create: { id: user.id, email: user.email, name: user.name },
  });
  await prisma.profile.upsert({
    where: { userId: user.id },
    update: { role: UserRole.USER, username: user.username },
    create: { userId: user.id, role: UserRole.USER, username: user.username },
  });
}

async function login(page: Page) {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const admin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: user.email });
  const emailOtp = data.properties?.email_otp;
  if (error || !emailOtp) throw new Error(`Magic-link auth failed: ${error?.message || "missing OTP"}`);

  const anon = createSupabaseClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const verified = await anon.auth.verifyOtp({ email: user.email, token: emailOtp, type: "magiclink" });
  if (verified.error || !verified.data.session) {
    throw new Error(`OTP verify failed: ${verified.error?.message || "missing session"}`);
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

  await page.context().addCookies(cookiesToSet.map(({ name, value, options }) => ({
    name,
    value,
    url: "http://localhost:3000",
    httpOnly: options?.httpOnly ?? false,
    secure: false,
    sameSite: "Lax" as const,
  })));
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

async function writeReport() {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  const bugSection = findings.length
    ? [
        "| ID | Severity | Area | Evidence | Recommendation |",
        "| --- | --- | --- | --- | --- |",
        ...findings.map((f) => `| ${f.id} | ${f.severity} | ${f.area} | ${f.evidence.replace(/\|/g, "\\|")} | ${f.recommendation.replace(/\|/g, "\\|")} |`),
      ].join("\n")
    : "No confirmed Account Hub bugs found in this pass.";

  fs.writeFileSync(reportPath, [
    "# Account Hub Unified Flow QA - 2026-05-10",
    "",
    "Scope: `/dashboard/accounts` unified Free/Partner Pro account creation, `/dashboard/trading-systems` account-flow removal, account-scoped VIP/Pro/EA status display, and routing CTAs.",
    "",
    "Report policy: confirmed bugs only. Passing checks are intentionally omitted.",
    "",
    "Test command:",
    "- `.\\node_modules\\.bin\\dotenv.cmd -e .env -- powershell -NoProfile -Command '$env:TURNSTILE_SECRET_KEY=\"\"; $env:NEXT_PUBLIC_TURNSTILE_SITE_KEY=\"\"; npx playwright test tests/e2e/account-hub-unified-flow-qa.spec.ts --project=chromium --reporter=list'`",
    "",
    "Visual evidence:",
    `- Screenshots/video/trace are in \`${path.relative(process.cwd(), artifactDir)}\` and Playwright \`test-results\`.`,
    "",
    "## Confirmed Findings",
    "",
    bugSection,
    "",
    "## Notes",
    "",
    "- The spec creates one temporary Supabase user and deletes it after the run.",
    "- Turnstile is disabled for local automation only.",
    "- QA data is prefixed with `QA-HUB-`.",
  ].join("\n"));
}

test.beforeAll(async () => {
  await cleanup();
  await createAuthUser();
});

test.afterAll(async () => {
  await writeReport();
  await cleanup();
  await prisma.$disconnect();
});

test("unified account hub flow matches product plan", async ({ page }) => {
  await login(page);

  await page.goto("/dashboard/accounts");
  await expect(page.getByRole("heading", { name: "Account Hub", exact: true })).toBeVisible();
  const accountHubCopy = await page.locator("main").innerText();
  if (!/Partner Pro|EA access|auto-sync/i.test(accountHubCopy)) {
    recordFinding({
      severity: "LOW",
      area: "Account Hub Copy",
      evidence: "`/dashboard/accounts` header/empty state still describes only connected MT5 accounts and analytics, not the new unified Sync + Pro + EA account hub.",
      recommendation: "Update the page header and empty state copy to match the unified account hub scope from the plan.",
    });
  }
  await shot(page, "accounts-empty-state");

  await page.getByRole("button", { name: "Add Account" }).first().click();
  const freeChoice = page.getByRole("button", { name: /Free Account Connect any MT5 account/i });
  const proChoice = page.getByRole("button", { name: /Partner Pro Account Open under our IB/i });
  await expect(freeChoice).toBeVisible();
  await expect(proChoice).toBeVisible();
  await shot(page, "add-account-chooser");

  await freeChoice.click();
  await expect(page.getByText("Free Account Details")).toBeVisible();
  const freeName = `${prefix} Free Account`;
  await page.getByPlaceholder(/My MT5 Growth/i).fill(freeName);
  await page.getByRole("button", { name: /Create Account/i }).click();
  await expect(page.getByText("Setup Instructions")).toBeVisible({ timeout: 20000 });
  await shot(page, "free-account-created");
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByText(freeName)).toBeVisible({ timeout: 20000 });

  const freeAccount = await prisma.tradingAccount.findFirst({ where: { userId: user.id, name: freeName } });
  expect(freeAccount).toBeTruthy();
  expect(await prisma.vipRequest.count({ where: { userId: user.id, tradingAccountId: freeAccount!.id } })).toBe(0);
  expect(await prisma.proEntitlement.count({ where: { userId: user.id, tradingAccountId: freeAccount!.id } })).toBe(0);
  expect(await prisma.eALicense.count({ where: { userId: user.id } })).toBe(0);

  if (!(await page.locator("#onborda-account-grid").getByText("Unlock Pro", { exact: true }).isVisible({ timeout: 2000 }).catch(() => false))) {
    recordFinding({
      severity: "MEDIUM",
      area: "Free Account Upgrade CTA",
      evidence: "A newly created Free account card did not show an `Unlock Pro` action, even though the plan requires Free accounts to upgrade from the Account Hub.",
      recommendation: "Pass `onUnlockPro` from `AccountListClient` into `AccountCard` and open the Partner Pro wizard for the selected account.",
    });
  }
  await shot(page, "free-account-card");

  await page.goto("/dashboard/trading-systems?tab=VIP");
  if (await isVisible(page, /Select the broker you registered with|Step 1: Select Broker/i, 3000)) {
    recordFinding({
      severity: "MEDIUM",
      area: "Trading Systems VIP Tab",
      evidence: "For a user without a VIP request, `/dashboard/trading-systems?tab=VIP` still renders the standalone VIP broker/request form.",
      recommendation: "Replace the VIP tab form with a Pro benefits/status summary and CTA to `/dashboard/accounts?intent=unlock-pro` or `/dashboard/accounts?action=add&intent=unlock-pro`.",
    });
  }
  await shot(page, "trading-systems-vip-before-request");

  await page.goto("/dashboard/accounts?intent=unlock-pro");
  await expect(page.getByRole("heading", { name: "Unlock Partner Pro" })).toBeVisible({ timeout: 10000 });

  await page.getByPlaceholder("@yourusername").fill(`@qa_hub_${String(runId).slice(-6)}`);
  await page.getByRole("button", { name: /Submit Upgrade Request/i }).click();
  await expect(page.getByRole("heading", { name: "Request Submitted!", exact: true })).toBeVisible({ timeout: 30000 });
  await shot(page, "partner-pro-upgrade-request-submitted");

  const vipRequest = await prisma.vipRequest.findFirst({
    where: { userId: user.id, tradingAccountId: freeAccount!.id },
  });
  expect(vipRequest).toBeTruthy();
  if (!vipRequest?.tradingAccountId) {
    recordFinding({
      severity: "HIGH",
      area: "Partner Pro Request",
      evidence: "Partner Pro upgrade submitted a VIP request without `tradingAccountId`.",
      recommendation: "Ensure `upgradeToPartnerPro()` always stores the id on `VipRequest`.",
    });
  }

  await page.goto("/dashboard/trading-systems");
  await expect(page.getByRole("heading", { name: "Trading System" })).toBeVisible();
  if (await isVisible(page, "My Accounts", 1500)) {
    recordFinding({
      severity: "HIGH",
      area: "Trading Systems Navigation",
      evidence: "`/dashboard/trading-systems` still shows a `My Accounts` tab after the unified Account Hub refactor.",
      recommendation: "Remove the `My Accounts` tab and all account creation UI from Trading Systems.",
    });
  }
  if (await isVisible(page, /Select the broker you registered with|Step 1: Select Broker|Request Submitted!/i, 3000)) {
    recordFinding({
      severity: "MEDIUM",
      area: "Trading Systems VIP Tab",
      evidence: "Trading Systems still renders the standalone VIP request/form/status flow instead of routing verification to `/dashboard/accounts`.",
      recommendation: "Replace the VIP tab form with a Pro benefits/status summary and CTA to `/dashboard/accounts?intent=unlock-pro`.",
    });
  }
  if (await isVisible(page, "MT5 Account Submitted", 1500)) {
    recordFinding({
      severity: "MEDIUM",
      area: "Trading Systems Setup Widget",
      evidence: "Trading Systems setup widget still measures account progress from EA license submissions (`MT5 Account Submitted`) instead of the new `TradingAccount` Account Hub.",
      recommendation: "Either remove this widget from Trading Systems or base it on TradingAccount + account-scoped Pro/EA access.",
    });
  }
  await shot(page, "trading-systems-after-refactor");
});
