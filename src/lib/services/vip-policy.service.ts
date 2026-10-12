import { prisma } from "@/lib/prisma";
import {
    getAccountProAccess,
    FUNDING_RECHECK_DAYS,
    FUNDING_GRACE_DAYS,
    FUNDING_MIN_BALANCE,
} from "@/lib/pro-access";
import { NotificationType, NotificationPriority } from "@prisma/client";
import { NOTIFICATION_ROUTES } from "@/lib/notification-routes";

export interface VipPolicyRunResult {
    scannedCount: number;
    pausedCount: number;
    expiredCount: number;
    recheckedFundingCount: number;
    fundingGraceCount: number;
    errors: string[];
}

/**
 * Execute daily VIP Active Retention Policy reconciliation & periodic funding recheck.
 * Runs on cron schedule (e.g. daily at midnight UTC).
 */
export async function runVipPolicyReconciliation(): Promise<VipPolicyRunResult> {
    const now = new Date();
    const result: VipPolicyRunResult = {
        scannedCount: 0,
        pausedCount: 0,
        expiredCount: 0,
        recheckedFundingCount: 0,
        fundingGraceCount: 0,
        errors: [],
    };

    // Kill-switch check
    if (process.env.VIP_POLICY_ENABLED === "false") {
        return result;
    }

    try {
        // Fetch all active entitlements linked to trading accounts
        const activeEntitlements = await prisma.proEntitlement.findMany({
            where: {
                status: "ACTIVE",
                tradingAccountId: { not: null },
            },
            include: {
                tradingAccount: {
                    select: {
                        id: true,
                        userId: true,
                        broker: true,
                        balance: true,
                        fundingVerifiedAt: true,
                        fundingLastVerifiedAt: true,
                        fundingGraceUntil: true,
                    },
                },
            },
        });

        result.scannedCount = activeEntitlements.length;

        for (const entitlement of activeEntitlements) {
            const account = entitlement.tradingAccount;
            if (!account || !account.userId) continue;

            try {
                // 1. Funding Periodic Recheck
                if (account.fundingVerifiedAt) {
                    const lastVerified =
                        account.fundingLastVerifiedAt ?? account.fundingVerifiedAt;
                    const daysSinceRecheck =
                        (now.getTime() - lastVerified.getTime()) /
                        (1000 * 60 * 60 * 24);

                    if (daysSinceRecheck >= FUNDING_RECHECK_DAYS) {
                        result.recheckedFundingCount++;

                        if (account.balance >= FUNDING_MIN_BALANCE) {
                            // Balance is healthy, renew recheck timestamp
                            await prisma.tradingAccount.update({
                                where: { id: account.id },
                                data: {
                                    fundingLastVerifiedAt: now,
                                    fundingGraceUntil: null,
                                },
                            });
                        } else {
                            // Balance dropped below $200 at recheck time
                            if (!account.fundingGraceUntil) {
                                // Put into 7-day grace
                                const graceUntil = new Date(
                                    now.getTime() +
                                        FUNDING_GRACE_DAYS * 24 * 60 * 60 * 1000
                                );
                                await prisma.tradingAccount.update({
                                    where: { id: account.id },
                                    data: { fundingGraceUntil: graceUntil },
                                });
                                result.fundingGraceCount++;
                            }
                        }
                    }
                }

                // 2. Activity / Funding Policy Check
                const proAccess = await getAccountProAccess(
                    account.userId,
                    account.id
                );

                if (proAccess.policyState === "PAUSED") {
                    result.pausedCount++;

                    // If funding verification expired, expire the DB entitlement
                    const isFundingExpired = proAccess.fundingInfo?.expired;

                    if (isFundingExpired) {
                        await prisma.proEntitlement.update({
                            where: { id: entitlement.id },
                            data: {
                                status: "EXPIRED",
                                adminNote: "Auto-expired by VIP Policy: Funding verification expired (balance below $200).",
                            },
                        });

                        await prisma.notification.create({
                            data: {
                                userId: account.userId,
                                type: NotificationType.LICENSE_EXPIRED,
                                title: "VIP Access Expired",
                                message: "Your VIP access has expired because account funding fell below the $200 minimum. Top up to reactivate.",
                                priority: NotificationPriority.HIGH,
                                link: NOTIFICATION_ROUTES.VIP_ACCOUNTS,
                            },
                        });

                        result.expiredCount++;
                    }
                }
            } catch (accountErr) {
                const errMsg = `Error checking account ${account.id}: ${
                    accountErr instanceof Error
                        ? accountErr.message
                        : String(accountErr)
                }`;
                result.errors.push(errMsg);
            }
        }
    } catch (err) {
        result.errors.push(
            `Vip policy run failed: ${
                err instanceof Error ? err.message : String(err)
            }`
        );
    }

    return result;
}
