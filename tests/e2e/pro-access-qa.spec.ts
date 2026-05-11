import { expect, test, type Locator, type Page } from "@playwright/test";
import { PrismaClient, TradeStatus, TradeType, UserRole } from "@prisma/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const runId = Date.now();
const prefix = `QA-PRO-${runId}`;
const artifactDir = path.join(process.cwd(), "test-results", "pro-access-qa");
const reportPath = path.join(process.cwd(), "docs", "PRO_ACCESS_QA_2026-05-10.md");

type QaFinding = {
  id: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  area: string;
  evidence: string;
  recommendation: string;
};

const findings: QaFinding[] = [];

const users = {
  trader: {
    id: "",
    email: `pro-trader-${runId}@example.test`,
    password: `Pro-${runId}-Trader!`,
    name: `${prefix} Trader`,
    username: `protrader${String(runId).slice(-8)}`,
  },
  grace: {
    id: "",
    email: `pro-grace-${runId}@example.test`,
    password: `Pro-${runId}-Grace!`,
    name: `${prefix} Grace Trader`,
    username: `prograce${String(runId).slice(-8)}`,
  },
  admin: {
    id: "",
    email: `pro-admin-${runId}@example.test`,
    password: `Pro-${runId}-Admin!`,
    name: `${prefix} Admin`,
    username: `proadmin${String(runId).slice(-8)}`,
  },
};

let primaryRequestId = "";
let graceRequestId = "";
let tradingAccountId = "";

test.describe.configure({ mode: "serial" });
test.setTimeout(8 * 60 * 1000);
test.use({
  viewport: { width: 1440, height: 980 },
  video: "on",
  screenshot: "on",
  trace: "on",
  launchOptions: { slowMo: 180 },
});

function recordFinding(finding: Omit<QaFinding, "id">) {
  findings.push({
    id: `PRO-QA-${String(findings.length + 1).padStart(3, "0")}`,
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

async function isVisible(locator: Locator, timeout = 5000) {
  try {
    await expect(locator).toBeVisible({ timeout });
    return true;
  } catch {
    return false;
  }
}

async function hasVisibleText(page: Page, text: string | RegExp, timeout = 5000) {
  try {
    await expect.poll(async () => {
      const matches = page.getByText(text);
      const count = await matches.count();
      for (let i = 0; i < count; i += 1) {
        if (await matches.nth(i).isVisible().catch(() => false)) {
          return true;
        }
      }
      return false;
    }, { timeout }).toBe(true);
    return true;
  } catch {
    return false;
  }
}

async function gotoDashboardPage(page: Page, url: string) {
  const target = new URL(url, "http://localhost:3000");
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      return;
    } catch (error) {
      lastError = error;
      await page.waitForLoadState("domcontentloaded", { timeout: 15000 }).catch(() => {});
      const current = new URL(page.url());
      if (current.pathname === target.pathname && current.search === target.search) {
        return;
      }
      await page.waitForTimeout(500);
    }
  }
  throw lastError;
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for Pro Access QA`);
  return value;
}

async function createAuthUser(user: typeof users.trader, role: UserRole) {
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
  if (error || !data.user) throw new Error(`Failed to create ${user.email}: ${error?.message || "missing user"}`);

  user.id = data.user.id;

  await prisma.user.upsert({
    where: { id: user.id },
    update: { email: user.email, name: user.name },
    create: { id: user.id, email: user.email, name: user.name },
  });
  await prisma.profile.upsert({
    where: { userId: user.id },
    update: { role, username: user.username },
    create: { userId: user.id, role, username: user.username },
  });
}

async function login(page: Page, user: typeof users.trader) {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const admin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: user.email });
  const emailOtp = data.properties?.email_otp;
  if (error || !emailOtp) throw new Error(`Magic-link auth failed for ${user.email}: ${error?.message || "missing OTP"}`);

  const anon = createSupabaseClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const verified = await anon.auth.verifyOtp({ email: user.email, token: emailOtp, type: "magiclink" });
  if (verified.error || !verified.data.session) {
    throw new Error(`OTP verify failed for ${user.email}: ${verified.error?.message || "missing session"}`);
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

async function cleanup() {
  const ids = [users.trader.id, users.grace.id, users.admin.id].filter(Boolean);
  if (ids.length) {
    await prisma.notification.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.ibActivitySnapshot.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.journalEntry.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.tradingAccount.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.proEntitlement.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.vipRequest.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.ibLead.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.analyticsEvent.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.profile.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: ids } } }).catch(() => {});
  }

  await prisma.vipRequest.deleteMany({ where: { email: { contains: `${runId}` } } }).catch(() => {});
  await prisma.ibLead.deleteMany({ where: { sessionId: { contains: `${runId}` } } }).catch(() => {});
  await prisma.analyticsEvent.deleteMany({ where: { sessionId: { contains: `${runId}` } } }).catch(() => {});

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceRoleKey) {
    const admin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await Promise.all(ids.map((id) => admin.auth.admin.deleteUser(id).catch(() => {})));
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
    : "No confirmed Pro Access bugs found in this pass.";

  fs.writeFileSync(reportPath, [
    "# Pro Access QA - 2026-05-10",
    "",
    "Scope: IB-powered Pro Access, VIP request, Pro entitlement, admin IB screens, gated Intelligence features, activity tracking, and cron/API boundaries.",
    "",
    "Report policy: confirmed bugs only. Passing checks are intentionally omitted.",
    "",
    "Visual evidence:",
    `- Screenshots/video/trace are in \`${path.relative(process.cwd(), artifactDir)}\` and Playwright \`test-results\`.`,
    "",
    "Test command:",
    "- `.\\node_modules\\.bin\\dotenv.cmd -e .env -- powershell -NoProfile -Command '$env:TURNSTILE_SECRET_KEY=\"\"; $env:NEXT_PUBLIC_TURNSTILE_SITE_KEY=\"\"; npx playwright test tests/e2e/pro-access-qa.spec.ts --project=chromium --reporter=list'`",
    "",
    "## Confirmed Findings",
    "",
    bugSection,
    "",
    "## Notes",
    "",
    "- The spec creates temporary Supabase users and deletes them after the run.",
    "- QA data is prefixed with `QA-PRO-` and cleaned up.",
    "- Turnstile is disabled for local automation only so the real form can be submitted.",
  ].join("\n"));
}

test.beforeAll(async () => {
  await cleanup();
  await createAuthUser(users.trader, UserRole.USER);
  await createAuthUser(users.grace, UserRole.USER);
  await createAuthUser(users.admin, UserRole.ADMIN);
});

test.afterAll(async () => {
  await writeReport();
  await cleanup();
  await prisma.$disconnect();
});

test("visual deep QA for IB-powered Pro Access", async ({ browser, request }) => {
  const traderContext = await browser.newContext({ viewport: { width: 1440, height: 980 }, recordVideo: { dir: artifactDir } });
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 980 }, recordVideo: { dir: artifactDir } });
  const graceContext = await browser.newContext({ viewport: { width: 390, height: 844 }, recordVideo: { dir: artifactDir } });

  const traderPage = await traderContext.newPage();
  const adminPage = await adminContext.newPage();
  const gracePage = await graceContext.newPage();

  await login(traderPage, users.trader);
  await login(adminPage, users.admin);
  await login(gracePage, users.grace);

  await gotoDashboardPage(traderPage, `/dashboard/intelligence?accountId=${tradingAccountId}`);
  await expect(traderPage.getByRole("heading", { name: "Trading Intelligence" })).toBeVisible();
  await expect(traderPage.getByText("Edge Leak Detector is a Pro Feature")).toBeVisible();
  await expect(traderPage.getByText("Rule Violation Tracker is a Pro Feature")).toBeVisible();
  await shot(traderPage, "free-user-pro-gates");

  const freeStatus = await traderPage.request.get("/api/pro-status");
  if (freeStatus.status() === 200) {
    expect(await freeStatus.json()).toMatchObject({ isPro: false, status: "NONE" });
  } else {
    recordFinding({
      severity: "LOW",
      area: "Pro Status API",
      evidence: `GET /api/pro-status returned HTTP ${freeStatus.status()} for an authenticated user during QA.`,
      recommendation: "Ensure normal dashboard polling of `/api/pro-status` is not rate-limited too aggressively.",
    });
  }

  await traderPage.goto("/dashboard/accounts?action=add&intent=unlock-pro");
  await expect(traderPage.getByText("Select Partner Broker")).toBeVisible({ timeout: 10000 });
  await shot(traderPage, "vip-broker-selection");

  const exnessCard = traderPage.getByRole("button").filter({ hasText: "Exness" }).first();
  await exnessCard.click();
  await expect(traderPage.getByText("Do you already have a Exness account?")).toBeVisible();

  const popupPromise = traderPage.waitForEvent("popup", { timeout: 5000 }).catch(() => null);
  await traderPage.getByRole("button", { name: /No, create new account/i }).click();
  const popup = await popupPromise;
  if (popup) await popup.close().catch(() => {});
  await traderPage.waitForTimeout(1000);

  const leadsAfterBrokerClick = await prisma.ibLead.count({ where: { userId: users.trader.id } });
  const brokerClickEvents = await prisma.analyticsEvent.count({
    where: {
      userId: users.trader.id,
      name: { in: ["broker_ref_click", "click_open_account"] },
    },
  });
  if (leadsAfterBrokerClick === 0) {
    recordFinding({
      severity: "HIGH",
      area: "IB Attribution",
      evidence: "Clicking `No, create new account` opens the broker affiliate URL but creates 0 `IbLead` rows for the logged-in user. The UI calls generic analytics instead of `trackBrokerClick()`.",
      recommendation: "Call `trackBrokerClick({ broker, affiliateUrl, source: 'DASHBOARD', sessionId, utm... })` before opening the affiliate URL, and mark converted lead when VIP request is submitted/approved.",
    });
  }
  if (brokerClickEvents === 0) {
    recordFinding({
      severity: "MEDIUM",
      area: "IB Attribution",
      evidence: "Broker affiliate click produced neither `broker_ref_click` nor `click_open_account` analytics event for the logged-in user during QA.",
      recommendation: "Ensure broker CTA click events are persisted with user/session/broker metadata.",
    });
  }

  await traderPage.getByRole("button", { name: /Yes, I have an account/i }).click();
  await expect(traderPage.getByText("How to transfer IB")).toBeVisible();
  await traderPage.getByRole("button", { name: /Continue/i }).click();

  await expect(traderPage.getByText("Account Details")).toBeVisible();
  const proAccountNumber = `77${String(runId).slice(-6)}`;
  await traderPage.getByPlaceholder("e.g. 12345678").fill(proAccountNumber);
  await traderPage.getByPlaceholder("e.g. 200").fill("5000");
  await traderPage.getByPlaceholder("@yourusername").fill(`@qa_pro_${String(runId).slice(-8)}`);
  const proTextboxes = traderPage.getByRole("textbox");
  const fullNameInput = proTextboxes.nth(4);
  if (await fullNameInput.isVisible().catch(() => false)) {
    await fullNameInput.fill(users.trader.name);
  }
  const countryInput = proTextboxes.nth(5);
  if (await countryInput.isVisible().catch(() => false)) {
    await countryInput.fill("Vietnam");
  }

  const screenshotInput = traderPage.getByText(/screenshot|proof|upload/i);
  if ((await screenshotInput.count()) === 0) {
    recordFinding({
      severity: "MEDIUM",
      area: "VIP Verification Form",
      evidence: "The guide says screenshot/proof can be submitted and admin details display `screenshotUrl`, but the user VIP form has no screenshot/proof input.",
      recommendation: "Add screenshot/proof upload or remove screenshot expectations from admin/review docs. If required per broker, enforce it through broker config.",
    });
  }

  await shot(traderPage, "vip-details-form-filled");
  await traderPage.getByRole("button", { name: /Review/i }).click();
  await expect(traderPage.getByText("Review Request")).toBeVisible();
  await shot(traderPage, "vip-review-step");
  await traderPage.getByRole("button", { name: /Submit Request/i }).click();
  await expect(traderPage.getByText("Confirm Submission")).toBeVisible();
  await traderPage.getByRole("button", { name: /^Confirm$/ }).click();
  await expect(traderPage.getByText(/Request Submitted!|Request Under Review/)).toBeVisible({ timeout: 30000 });
  await shot(traderPage, "vip-submit-success");

  const proAccount = await prisma.tradingAccount.findFirst({
    where: { userId: users.trader.id, accountNumber: proAccountNumber },
    orderBy: { createdAt: "desc" },
  });
  expect(proAccount).toBeTruthy();
  tradingAccountId = proAccount!.id;

  const vipRequest = await prisma.vipRequest.findFirst({
    where: { userId: users.trader.id, email: users.trader.email },
    orderBy: { createdAt: "desc" },
  });
  expect(vipRequest?.status).toBe("PENDING");
  primaryRequestId = vipRequest!.id;
  if (vipRequest?.tradingAccountId !== tradingAccountId) {
    recordFinding({
      severity: "HIGH",
      area: "Account-Scoped VIP Request",
      evidence: "Partner Pro request did not store the created `TradingAccount.id` on `VipRequest.tradingAccountId`.",
      recommendation: "Ensure `createPartnerProAccount()` creates/reuses the trading account first and links the VIP request to that account.",
    });
  }

  await traderPage.goto("/dashboard");
  await expect(traderPage.getByText("Free Plan")).toBeVisible({ timeout: 20000 });
  await expect(traderPage.getByText(/VIP request submitted/i)).toBeVisible();
  await shot(traderPage, "sidebar-pending-request");

  await adminPage.goto("/admin/ib");
  await expect(adminPage.getByRole("heading", { name: "IB Overview" })).toBeVisible();
  await shot(adminPage, "admin-ib-overview");

  await adminPage.goto("/admin/ib/pipeline");
  await expect(adminPage.getByRole("heading", { name: "VIP Pipeline" })).toBeVisible();
  await adminPage.getByPlaceholder("Search Telegram, email, account...").fill(users.trader.email);
  await expect(adminPage.getByText(users.trader.email)).toBeVisible();
  await shot(adminPage, "admin-pipeline-pending-filtered");

  await adminPage.getByRole("button", { name: "Actions" }).first().click();
  await adminPage.getByText("View Details").click();
  await expect(adminPage.getByText("Request Details")).toBeVisible();
  await shot(adminPage, "admin-request-details-modal");
  await adminPage.getByLabel("Close modal").click();
  await adminPage.getByRole("button", { name: "Actions" }).first().click();
  await adminPage.getByText("Approve & Grant Pro").click();
  await expect.poll(async () => {
    const entitlement = await prisma.proEntitlement.findFirst({
      where: {
        userId: users.trader.id,
        OR: [{ vipRequestId: primaryRequestId }, { tradingAccountId }],
      },
    });
    return entitlement?.status || "NONE";
  }, { timeout: 30000 }).toBe("ACTIVE").catch(() => {});
  await shot(adminPage, "admin-approved-request");

  let activeEntitlement = await prisma.proEntitlement.findFirst({
    where: {
      userId: users.trader.id,
      OR: [{ vipRequestId: primaryRequestId }, { tradingAccountId }],
    },
  });
  if (activeEntitlement?.status !== "ACTIVE") {
    recordFinding({
      severity: "HIGH",
      area: "VIP Approval",
      evidence: "Admin clicked `Approve & Grant Pro`, but no ACTIVE `ProEntitlement` was created for the user.",
      recommendation: "Ensure `approveVipRequest()` is invoked from the pipeline menu and check server action errors/toast handling.",
    });
    await prisma.vipRequest.update({ where: { id: primaryRequestId }, data: { status: "APPROVED" } });
    const existingEnt = await prisma.proEntitlement.findFirst({ where: { userId: users.trader.id } });
    if (existingEnt) {
      await prisma.proEntitlement.update({
        where: { id: existingEnt.id },
        data: { status: "ACTIVE", source: "IB_VERIFIED", expiresAt: null },
      });
    } else {
      await prisma.proEntitlement.create({
        data: {
          userId: users.trader.id,
          status: "ACTIVE",
          source: "IB_VERIFIED",
          vipRequestId: primaryRequestId,
          broker: "EXNESS",
          accountNumberMasked: `****${String(runId).slice(-4)}`,
          startsAt: new Date(),
        },
      });
    }
    activeEntitlement = await prisma.proEntitlement.findFirst({
      where: {
        userId: users.trader.id,
        OR: [{ vipRequestId: primaryRequestId }, { tradingAccountId }],
      },
    });
  }
  expect(activeEntitlement?.accountNumberMasked).toBe(`****${String(runId).slice(-4)}`);
  if (!activeEntitlement?.tradingAccountId) {
    recordFinding({
      severity: "HIGH",
      area: "Account-Scoped Pro",
      evidence: "Admin approval created an ACTIVE `ProEntitlement` without `tradingAccountId`. This grants user-level Pro instead of Pro for the verified trading account only.",
      recommendation: "Require VIP requests to link to a `TradingAccount` before approval, or create/match the trading account during request submission and store `tradingAccountId` on both `VipRequest` and `ProEntitlement`.",
    });
  }

  const leadAfterApproval = await prisma.ibLead.findFirst({ where: { userId: users.trader.id } });
  if (!leadAfterApproval?.convertedAt) {
    recordFinding({
      severity: "MEDIUM",
      area: "IB Funnel Conversion",
      evidence: "After VIP approval, no `IbLead.convertedAt` / `vipRequestId` was linked for the user, so funnel conversion cannot show click -> request -> approval accurately.",
      recommendation: "When VIP request is submitted or approved, attach the latest matching `IbLead` to `vipRequestId` and set `convertedAt`.",
    });
  }

  // Recovery setup so the rest of QA can verify account-scoped behavior even if
  // approval incorrectly created a legacy/unlinked entitlement.
  if (!tradingAccountId) {
    tradingAccountId = (await prisma.tradingAccount.create({
      data: {
        userId: users.trader.id,
        name: `${prefix} Active Account`,
        broker: "EXNESS",
        accountNumber: `77${String(runId).slice(-6)}`,
        balance: 10000,
        equity: 10200,
        platform: "MT5",
        status: "CONNECTED",
        lastHeartbeat: new Date(),
        lastSync: new Date(),
      },
    })).id;
  }
  if (activeEntitlement && !activeEntitlement.tradingAccountId) {
    await prisma.proEntitlement.update({
      where: { id: activeEntitlement.id },
      data: {
        status: "ACTIVE",
        broker: "EXNESS",
        accountNumberMasked: `****${String(runId).slice(-4)}`,
        tradingAccountId,
      },
    });
  }

  await traderPage.goto("/dashboard");
  const proActiveVisible = await hasVisibleText(traderPage, "Pro Active", 12000);
  if (!proActiveVisible) {
    recordFinding({
      severity: "HIGH",
      area: "Pro Status UI",
      evidence: "After admin approval created ACTIVE `ProEntitlement`, the user dashboard still displayed `Free Plan` instead of `Pro Active`.",
      recommendation: "Check `/api/pro-status` rate limits/cache and make the ProProvider refetch after entitlement changes. The sidebar should reflect ACTIVE entitlement after refresh.",
    });
  }
  await shot(traderPage, "sidebar-pro-active");

  await gotoDashboardPage(traderPage, `/dashboard/intelligence?accountId=${tradingAccountId}`);
  if (await isVisible(traderPage.getByText("Edge Leak Detector is a Pro Feature"), 8000)) {
    recordFinding({
      severity: "HIGH",
      area: "Pro Feature Gate",
      evidence: "User with ACTIVE `ProEntitlement` still sees locked `Edge Leak Detector` on `/dashboard/intelligence`.",
      recommendation: "Ensure `ProGate` receives `isPro=true` from `/api/pro-status` and is not blocked by stale client state or rate limiting.",
    });
  }
  if (await isVisible(traderPage.getByText("Rule Violation Tracker is a Pro Feature"), 3000)) {
    recordFinding({
      severity: "HIGH",
      area: "Pro Feature Gate",
      evidence: "User with ACTIVE `ProEntitlement` still sees locked `Rule Violation Tracker` on `/dashboard/intelligence`.",
      recommendation: "Ensure all Pro gates use the same reliable entitlement source.",
    });
  }
  await shot(traderPage, "pro-user-intelligence-unlocked");

  await adminPage.goto("/admin/ib/pipeline");
  await adminPage.getByPlaceholder("Search Telegram, email, account...").fill(users.trader.email);
  await expect(adminPage.getByRole("table").getByText("Approved")).toBeVisible();
  await adminPage.getByRole("button", { name: "Actions" }).first().click();
  await adminPage.getByText("Revoke Pro").click();
  await adminPage.waitForTimeout(1500);
  const revokedEntitlement = await prisma.proEntitlement.findFirst({ where: { userId: users.trader.id } });
  expect(revokedEntitlement?.status).toBe("REVOKED");

  await traderPage.goto("/dashboard");
  if (!(await hasVisibleText(traderPage, "Revoked", 12000))) {
    recordFinding({
      severity: "MEDIUM",
      area: "Pro Status UI",
      evidence: "After admin revoke changed entitlement to REVOKED, the user dashboard did not show `Revoked` after refresh.",
      recommendation: "Make `/api/pro-status` and `VipStatusWidget` reliably reflect REVOKED entitlement.",
    });
  }
  await gotoDashboardPage(traderPage, "/dashboard/intelligence");
  if (!(await isVisible(traderPage.getByText("Edge Leak Detector is a Pro Feature"), 8000))) {
    recordFinding({
      severity: "MEDIUM",
      area: "Pro Feature Gate",
      evidence: "After entitlement was REVOKED, the Intelligence Pro gate was not visible.",
      recommendation: "Verify revoked users always lose access to Pro-only content after refresh.",
    });
  }
  await shot(traderPage, "revoked-user-pro-gated");

  const graceAccountId = (await prisma.tradingAccount.create({
    data: {
      userId: users.grace.id,
      name: `${prefix} Grace Account`,
      broker: "EXNESS",
      accountNumber: `88${String(runId).slice(-6)}`,
      balance: 3000,
      equity: 3000,
      platform: "MT5",
      status: "CONNECTED",
    },
  })).id;

  const graceRequest = await prisma.vipRequest.create({
    data: {
      userId: users.grace.id,
      tradingAccountId: graceAccountId,
      broker: "EXNESS",
      accountNumber: `88${String(runId).slice(-6)}`,
      balance: "3000",
      email: users.grace.email,
      telegramId: `@qa_grace_${String(runId).slice(-8)}`,
      fullName: users.grace.name,
      country: "Vietnam",
      status: "PENDING",
    },
  });
  graceRequestId = graceRequest.id;

  await adminPage.goto("/admin/ib/pipeline");
  await adminPage.getByPlaceholder("Search Telegram, email, account...").fill(users.grace.email);
  await expect(adminPage.getByText(users.grace.email)).toBeVisible();
  await adminPage.getByRole("button", { name: "Actions" }).first().click();
  await adminPage.getByText("Grant 14d Grace").click();
  await adminPage.waitForTimeout(1500);
  await shot(adminPage, "admin-grace-granted");

  const graceEntitlement = await prisma.proEntitlement.findFirst({ where: { userId: users.grace.id } });
  expect(graceEntitlement?.status).toBe("GRACE");
  expect(graceEntitlement?.expiresAt).toBeTruthy();
  if (graceEntitlement?.tradingAccountId !== graceAccountId) {
    recordFinding({
      severity: "HIGH",
      area: "Account-Scoped Grace",
      evidence: "Admin clicked `Grant 14d Grace` on a VIP request linked to a trading account, but the created GRACE entitlement was user-level/unlinked instead of account-scoped.",
      recommendation: "Pass `request.tradingAccountId` from the VIP Pipeline row into `grantGracePeriod(userId, days, tradingAccountId)` so grace unlocks only the requested account.",
    });
  }

  await gracePage.goto("/dashboard");
  if (!(await hasVisibleText(gracePage, "Grace Period", 12000))) {
    recordFinding({
      severity: "MEDIUM",
      area: "Grace Access UI",
      evidence: "After admin granted GRACE entitlement, the mobile dashboard did not show `Grace Period` after refresh.",
      recommendation: "Ensure `VipStatusWidget` renders GRACE status on mobile and desktop.",
    });
  }
  await shot(gracePage, "mobile-grace-widget");

  const graceToExpire = await prisma.proEntitlement.findFirst({ where: { userId: users.grace.id } });
  if (graceToExpire) {
    await prisma.proEntitlement.update({
      where: { id: graceToExpire.id },
      data: { expiresAt: new Date(Date.now() - 60 * 1000) },
    });
  }
  const expired = await gracePage.request.get("/api/pro-status");
  if (expired.status() === 200) {
    expect(await expired.json()).toMatchObject({ isPro: false, status: "EXPIRED" });
  } else {
    recordFinding({
      severity: "LOW",
      area: "Grace Expiry",
      evidence: `GET /api/pro-status returned HTTP ${expired.status()} when verifying expired grace access.`,
      recommendation: "Re-test grace expiry after rate-limit reset; endpoint should return `isPro=false,status=EXPIRED` and persist the status.",
    });
  }

  const traderEntitlement = await prisma.proEntitlement.findFirst({ where: { userId: users.trader.id } });
  if (traderEntitlement) {
    await prisma.proEntitlement.update({
      where: { id: traderEntitlement.id },
      data: {
        status: "ACTIVE",
        broker: "EXNESS",
        accountNumberMasked: `****${String(runId).slice(-4)}`,
        tradingAccountId,
      },
    });
  }

  const freeTradingAccountId = (await prisma.tradingAccount.create({
    data: {
      userId: users.trader.id,
      name: `${prefix} Free Account`,
      broker: "EXNESS",
      accountNumber: `66${String(runId).slice(-6)}`,
      balance: 5000,
      equity: 5000,
      platform: "MT5",
      status: "CONNECTED",
    },
  })).id;

  const activeAccountStatus = await traderPage.request.get(`/api/pro-status?accountId=${tradingAccountId}`);
  if (activeAccountStatus.status() === 200) {
    expect(await activeAccountStatus.json()).toMatchObject({ isPro: true, status: "ACTIVE" });
  } else {
    recordFinding({
      severity: "MEDIUM",
      area: "Account-Scoped Pro API",
      evidence: `GET /api/pro-status?accountId=<activeAccount> returned HTTP ${activeAccountStatus.status()}.`,
      recommendation: "Account-level Pro status API should return 200 with the account-specific entitlement for the authenticated owner.",
    });
  }

  const freeAccountStatus = await traderPage.request.get(`/api/pro-status?accountId=${freeTradingAccountId}`);
  if (freeAccountStatus.status() === 200) {
    expect(await freeAccountStatus.json()).toMatchObject({ isPro: false, status: "NONE" });
  } else {
    recordFinding({
      severity: "MEDIUM",
      area: "Account-Scoped Pro API",
      evidence: `GET /api/pro-status?accountId=<freeAccount> returned HTTP ${freeAccountStatus.status()}.`,
      recommendation: "Account-level Pro status API should return 200 with `isPro=false,status=NONE` for an owned account without entitlement.",
    });
  }

  await gotoDashboardPage(traderPage, `/dashboard/intelligence?accountId=${freeTradingAccountId}`);
  if (!(await isVisible(traderPage.getByText("Edge Leak Detector is a Pro Feature"), 8000))) {
    recordFinding({
      severity: "HIGH",
      area: "Account-Scoped Feature Gate",
      evidence: "A user with one ACTIVE Pro account opened `/dashboard/intelligence` for a different Free account and the Edge Leak Detector was still unlocked. The UI appears to use aggregate user Pro instead of selected account Pro.",
      recommendation: "Make `ProGate` accept the selected `accountId` and check `/api/pro-status?accountId=...` or `getAccountStatus(accountId)`. Account-scoped features must not unlock from aggregate user status.",
    });
  }
  if (!(await isVisible(traderPage.getByText("Rule Violation Tracker is a Pro Feature"), 3000))) {
    recordFinding({
      severity: "HIGH",
      area: "Account-Scoped Feature Gate",
      evidence: "A user with one ACTIVE Pro account opened Rule Violation Tracker for a different Free account and the Pro gate was not shown.",
      recommendation: "Gate `RuleViolationTracker` by selected account entitlement, not user aggregate entitlement.",
    });
  }
  await shot(traderPage, "free-account-should-remain-gated");

  await gotoDashboardPage(traderPage, `/dashboard/intelligence?accountId=${tradingAccountId}`);
  if (await isVisible(traderPage.getByText("Edge Leak Detector is a Pro Feature"), 8000)) {
    recordFinding({
      severity: "MEDIUM",
      area: "Account-Scoped Feature Gate",
      evidence: "The account with ACTIVE account-scoped entitlement still showed the Edge Leak Detector Pro teaser.",
      recommendation: "Ensure the selected account entitlement is available to Pro-gated components after navigation.",
    });
  }

  for (let i = 0; i < 3; i++) {
    await prisma.journalEntry.create({
      data: {
        userId: users.trader.id,
        accountId: tradingAccountId,
        symbol: "XAUUSD",
        type: i % 2 === 0 ? TradeType.BUY : TradeType.SELL,
        entryPrice: 2300 + i,
        exitPrice: 2310 + i,
        lotSize: 0.5 + i * 0.1,
        pnl: 100 + i * 20,
        status: TradeStatus.CLOSED,
        result: "WIN",
        entryDate: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
        exitDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        images: [],
      },
    });
  }

  await adminPage.goto("/admin/ib/traders");
  await expect(adminPage.getByRole("heading", { name: "Active Trader Monitor" })).toBeVisible();
  await adminPage.getByPlaceholder("Search user...").fill(users.trader.name);
  await expect(adminPage.getByText(users.trader.name)).toBeVisible();
  if (!(await isVisible(adminPage.getByText("Active", { exact: true }), 5000))) {
    recordFinding({
      severity: "MEDIUM",
      area: "Active Trader Monitor",
      evidence: "A user with an ACTIVE account-scoped Pro entitlement and recent closed trades appeared in `/admin/ib/traders`, but the row did not show `Active`.",
      recommendation: "Verify `getActiveTraderMonitor()` classifies activity from `JournalEntry.accountId` / `TradingAccount` correctly for account-scoped entitlements.",
    });
  }
  await shot(adminPage, "admin-trader-monitor-active-user");

  const cronPost = await request.post("/api/cron/ib-snapshots", {
    headers: process.env.CRON_SECRET ? { authorization: `Bearer ${process.env.CRON_SECRET}` } : undefined,
  });
  if (cronPost.status() === 405 || cronPost.status() === 404) {
    recordFinding({
      severity: "LOW",
      area: "IB Snapshot Cron",
      evidence: "Process guide documents `POST /api/cron/ib-snapshots`, but the implemented route exposes `GET` only.",
      recommendation: "Either update the guide to GET/Vercel Cron semantics or add a POST handler that delegates to the same snapshot service.",
    });
  }

  const cronGet = await request.get("/api/cron/ib-snapshots", {
    headers: process.env.CRON_SECRET ? { authorization: `Bearer ${process.env.CRON_SECRET}` } : undefined,
  });
  if (![200, 401].includes(cronGet.status())) {
    recordFinding({
      severity: "MEDIUM",
      area: "IB Snapshot Cron",
      evidence: `GET /api/cron/ib-snapshots returned HTTP ${cronGet.status()} during QA.`,
      recommendation: "Ensure the cron endpoint is protected by CRON_SECRET and succeeds with the configured secret.",
    });
  }

  await traderContext.close();
  await adminContext.close();
  await graceContext.close();
});
