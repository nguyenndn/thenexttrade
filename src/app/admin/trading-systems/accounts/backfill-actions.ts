"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AccountStatus } from "@prisma/client";
import { ensureTradingAccountLicenseKey } from "@/lib/ea/github-license-sync.server";
import {
    filterAccountsByBroker,
    normalizeBrokerKey,
} from "@/lib/trading-account-identity";

export type BackfillLicenseAccountsResult = {
    success: boolean;
    created: number;
    updated: number;
    skipped: number;
    error?: string;
};

async function requireAdmin() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: aal, error: aalError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (
        aalError ||
        (aal && aal.currentLevel === "aal1" && aal.nextLevel === "aal2")
    ) {
        return null;
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });

    return profile?.role === "ADMIN" ? user : null;
}

/**
 * Explicit, idempotent repair for approved licenses that are missing their
 * TradingAccount row or per-account License Key. Never runs during render.
 */
export async function backfillLicenseAccounts(): Promise<BackfillLicenseAccountsResult> {
    const admin = await requireAdmin();
    if (!admin) {
        return {
            success: false,
            created: 0,
            updated: 0,
            skipped: 0,
            error: "Unauthorized",
        };
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    try {
        const licenses = await prisma.eALicense.findMany({
            where: { status: AccountStatus.APPROVED },
            select: {
                id: true,
                userId: true,
                broker: true,
                accountNumber: true,
            },
        });

        for (const license of licenses) {
            const cleanAccountNumber = license.accountNumber.trim();
            if (!cleanAccountNumber) {
                skipped++;
                continue;
            }

            const candidates = await prisma.tradingAccount.findMany({
                where: {
                    userId: license.userId,
                    accountNumber: cleanAccountNumber,
                },
                select: { id: true, apiKey: true, broker: true },
            });
            const [existing] = filterAccountsByBroker(
                candidates,
                license.broker
            );

            await ensureTradingAccountLicenseKey({
                userId: license.userId,
                broker: license.broker,
                accountNumber: cleanAccountNumber,
                isApproved: true,
                approvedBy: admin.id,
            });

            if (!existing) {
                created++;
            } else if (
                !existing.apiKey ||
                !normalizeBrokerKey(existing.broker) ||
                normalizeBrokerKey(existing.broker) !==
                    normalizeBrokerKey(license.broker)
            ) {
                updated++;
            } else {
                skipped++;
            }
        }

        await prisma.auditLog.create({
            data: {
                adminId: admin.id,
                action: "LICENSE_ACCOUNTS_BACKFILLED",
                targetType: "EALicense",
                details: { created, updated, skipped },
            },
        });

        revalidatePath("/admin/trading-systems/accounts");
        return { success: true, created, updated, skipped };
    } catch (error) {
        console.error("backfillLicenseAccounts error:", error);
        return {
            success: false,
            created,
            updated,
            skipped,
            error: "Backfill failed. Please check the logs.",
        };
    }
}
