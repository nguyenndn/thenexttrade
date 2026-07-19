"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import { vipRequestSchema } from "@/lib/validations/vip-request";
import { z } from "zod";
import { verifyTurnstile } from "@/lib/turnstile";
import { generateApiKey } from "@/lib/utils/api-key";
import { linkIbLeadToVipRequest } from "@/actions/ib-lead";

// ============================================================================
// CREATE PARTNER PRO ACCOUNT — Unified flow for Account Hub
// ============================================================================

interface PartnerProResult {
    success?: boolean;
    error?: string;
    accountId?: string;
    apiKey?: string;
    isNewAccount?: boolean;
}

/**
 * Creates a TradingAccount (or reuses existing) + VipRequest in one action.
 * Called from the unified Add Account wizard's Partner Pro path.
 */
export async function createPartnerProAccount(
    formData: FormData
): Promise<PartnerProResult> {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    // Verify Turnstile
    const turnstileToken = formData.get("cf-turnstile-response") as string;
    const turnstileResult = await verifyTurnstile(turnstileToken);
    if (!turnstileResult.success) {
        return { error: turnstileResult.error || "Verification failed" };
    }

    // Parse form data
    const raw = {
        broker: formData.get("broker") as string,
        accountNumber: formData.get("accountNumber") as string,
        balance: formData.get("balance") as string,
        email: formData.get("email") as string,
        telegramId: formData.get("telegramId") as string,
        fullName: (formData.get("fullName") as string) || undefined,
        country: (formData.get("country") as string) || undefined,
    };

    // Validate using shared VIP request schema
    const parsed = vipRequestSchema.safeParse(raw);
    if (!parsed.success) {
        const firstError = parsed.error.issues[0];
        return { error: firstError?.message || "Invalid input" };
    }

    const {
        broker,
        accountNumber,
        balance,
        email,
        telegramId,
        fullName,
        country,
    } = parsed.data;

    try {
        // Check if another user owns this account number + broker
        const otherUserAccount = await prisma.tradingAccount.findFirst({
            where: {
                broker: { equals: broker, mode: "insensitive" },
                accountNumber,
                userId: { not: user.id },
            },
            select: { id: true },
        });

        if (otherUserAccount) {
            return {
                error: "This account number is already registered by another user.",
            };
        }

        // Find or create TradingAccount
        let tradingAccountId: string;
        let apiKey: string | undefined;
        let isNewAccount = false;

        const existingAccount = await prisma.tradingAccount.findFirst({
            where: {
                userId: user.id,
                broker: { equals: broker, mode: "insensitive" },
                accountNumber,
            },
            select: { id: true },
        });

        if (existingAccount) {
            tradingAccountId = existingAccount.id;
        } else {
            // Create new TradingAccount
            apiKey = generateApiKey();
            const newAccount = await prisma.tradingAccount.create({
                data: {
                    userId: user.id,
                    name: `${broker} ${accountNumber.slice(-4)}`,
                    broker,
                    accountNumber,
                    platform: "MT5",
                    balance: parseFloat(balance) || 0,
                    currency: "USD",
                    apiKey,
                    color: "hsl(var(--primary))",
                },
            });
            tradingAccountId = newAccount.id;
            isNewAccount = true;
        }

        // Block duplicate pending VipRequest for same tradingAccountId
        const existingRequest = await prisma.vipRequest.findFirst({
            where: {
                userId: user.id,
                tradingAccountId,
                status: "PENDING",
            },
        });

        if (existingRequest) {
            return {
                error: "You already have a pending verification request for this account. Please wait for review.",
            };
        }

        // Create VipRequest linked to TradingAccount
        await prisma.vipRequest.create({
            data: {
                userId: user.id,
                tradingAccountId,
                broker,
                accountNumber,
                balance,
                email,
                telegramId,
                fullName: fullName || null,
                country: country || null,
            },
        });

        // Link latest IbLead (fire-and-forget)
        linkIbLeadToVipRequest(broker).catch(() => {});

        revalidatePath("/dashboard/accounts");
        revalidatePath("/dashboard/trading-systems");
        revalidatePath("/admin/ib/pipeline");

        return {
            success: true,
            accountId: tradingAccountId,
            apiKey: isNewAccount ? apiKey : undefined,
            isNewAccount,
        };
    } catch (error: any) {
        console.error("[createPartnerProAccount error]:", error);
        return { error: "Failed to create partner account. Please try again." };
    }
}

/**
 * Normalize broker display value to canonical SUPPORTED_BROKERS enum string.
 * Handles stored display names like "Vantage", "VantageMarkets", "VT Markets", "Exness".
 */
function normalizeBroker(raw: string | null | undefined): string {
    if (!raw) return "";
    const upper = raw.trim().toUpperCase().replace(/[\s-]/g, "");
    if (upper.startsWith("EXNESS")) return "EXNESS";
    if (upper.startsWith("VANTAGE")) return "VANTAGE";
    if (upper.startsWith("VTMARKET") || upper.startsWith("VT"))
        return "VTMARKETS";
    return raw.trim(); // pass through unchanged — let schema validation catch unknown values
}

// ============================================================================
// UPGRADE EXISTING ACCOUNT TO PARTNER PRO — Decoupled from create flow
// ============================================================================

/**
 * Validation schema for upgrade-only fields.
 * Broker & accountNumber come from DB (source of truth), NOT from the form.
 */
const upgradeFormSchema = z.object({
    email: z.string().email("Invalid email address"),
    telegramId: z.string().min(1, "Telegram ID is required").max(100),
    fullName: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    screenshotUrl: z.string().url().max(500).optional().or(z.literal("")),
});

/**
 * Upgrade an existing Free TradingAccount to Partner Pro.
 * Fully independent from createPartnerProAccount — NEVER creates a new TradingAccount.
 * Uses the DB record as source of truth for broker/accountNumber.
 */
export async function upgradeToPartnerPro(
    accountId: string,
    formData: FormData
): Promise<PartnerProResult> {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    // 1. Verify Turnstile
    const turnstileToken = formData.get("cf-turnstile-response") as string;
    const turnstileResult = await verifyTurnstile(turnstileToken);
    if (!turnstileResult.success) {
        return { error: turnstileResult.error || "Verification failed" };
    }

    // 2. Verify account belongs to user — DB is source of truth
    const account = await prisma.tradingAccount.findFirst({
        where: { id: accountId, userId: user.id },
        select: { id: true, broker: true, accountNumber: true, balance: true },
    });

    if (!account) return { error: "Account not found" };

    // 3. Validate user-submitted fields only
    const parsed = upgradeFormSchema.safeParse({
        email: formData.get("email") as string,
        telegramId: formData.get("telegramId") as string,
        fullName: (formData.get("fullName") as string) || undefined,
        country: (formData.get("country") as string) || undefined,
        screenshotUrl: (formData.get("screenshotUrl") as string) || undefined,
    });

    if (!parsed.success) {
        const firstError = parsed.error.issues[0];
        return { error: firstError?.message || "Invalid input" };
    }

    const { email, telegramId, fullName, country } = parsed.data;

    // Normalize broker for VipRequest storage (admin-facing)
    const normalizedBroker = normalizeBroker(account.broker);
    const accountNumber = account.accountNumber ?? "";
    const balanceStr =
        account.balance != null
            ? String(account.balance)
            : (formData.get("balance") as string) || "0";

    try {
        // 4. Block duplicate pending VipRequest for this exact account
        const existingRequest = await prisma.vipRequest.findFirst({
            where: {
                userId: user.id,
                tradingAccountId: account.id,
                status: "PENDING",
            },
        });

        if (existingRequest) {
            return {
                error: "You already have a pending verification request for this account. Please wait for review.",
            };
        }

        // 5. Create VipRequest linked to the EXISTING TradingAccount
        await prisma.vipRequest.create({
            data: {
                userId: user.id,
                tradingAccountId: account.id,
                broker: normalizedBroker || account.broker || "",
                accountNumber,
                balance: balanceStr,
                email,
                telegramId,
                fullName: fullName || null,
                country: country || null,
            },
        });

        // 6. Link latest IbLead (fire-and-forget)
        linkIbLeadToVipRequest(normalizedBroker || account.broker || "").catch(
            () => {}
        );

        revalidatePath("/dashboard/accounts");
        revalidatePath("/dashboard/trading-systems");
        revalidatePath("/admin/ib/pipeline");

        return {
            success: true,
            accountId: account.id,
            apiKey: undefined,
            isNewAccount: false,
        };
    } catch (error: unknown) {
        console.error("[upgradeToPartnerPro error]:", error);
        return { error: "Failed to submit upgrade request. Please try again." };
    }
}
