"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { submitAccountSchema } from "@/lib/validations/ea-license";
import { AccountStatus } from "@prisma/client";
import { ensureTradingAccountLicenseKey } from "@/lib/ea/github-license-sync.server";
import { syncLicenseBackupOrQueue } from "@/lib/ea/license-github-sync-outbox.server";
import { notifyAdminsOfLicenseRequest } from "@/lib/admin/admin-notification.server";
import {
    filterAccountsByBroker,
    normalizeBrokerKey,
} from "@/lib/trading-account-identity";

export async function submitMultipleAccountRequests(
    tradingAccountIds: string[]
) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    if (!Array.isArray(tradingAccountIds) || tradingAccountIds.length === 0) {
        return { error: "Please select at least one trading account." };
    }

    try {
        const accounts = await prisma.tradingAccount.findMany({
            where: {
                id: { in: tradingAccountIds },
                userId: user.id,
            },
            select: {
                id: true,
                name: true,
                broker: true,
                accountNumber: true,
            },
        });

        if (accounts.length === 0) {
            return { error: "Selected trading accounts were not found." };
        }

        let submittedCount = 0;

        for (const acc of accounts) {
            const cleanAccountNumber = (acc.accountNumber || "").trim();
            if (!cleanAccountNumber) {
                continue;
            }
            const cleanBroker = (acc.broker || "EXNESS").trim().toUpperCase();

            // Check if another user owns this license
            const existingLicense = await prisma.eALicense.findFirst({
                where: {
                    accountNumber: cleanAccountNumber,
                },
            });

            if (existingLicense && existingLicense.userId !== user.id) {
                return {
                    error: `Account #${cleanAccountNumber} is already registered by another user.`,
                };
            }

            let submittedLicenseId: string | null = null;

            if (existingLicense) {
                if (
                    existingLicense.status === AccountStatus.REJECTED ||
                    existingLicense.status === AccountStatus.EXPIRED
                ) {
                    await prisma.eALicense.update({
                        where: { id: existingLicense.id },
                        data: {
                            status: AccountStatus.PENDING,
                            rejectReason: null,
                            rejectedAt: null,
                            rejectedBy: null,
                        },
                    });
                    submittedLicenseId = existingLicense.id;
                    submittedCount++;
                }
            } else {
                const created = await prisma.eALicense.create({
                    data: {
                        userId: user.id,
                        broker: cleanBroker,
                        accountNumber: cleanAccountNumber,
                        status: AccountStatus.PENDING,
                    },
                    select: { id: true },
                });
                submittedLicenseId = created.id;
                submittedCount++;
            }

            if (submittedLicenseId) {
                await notifyAdminsOfLicenseRequest({
                    licenseId: submittedLicenseId,
                    userId: user.id,
                    broker: cleanBroker,
                    accountNumber: cleanAccountNumber,
                    userEmail: user.email,
                });
            }

            await ensureTradingAccountLicenseKey({
                userId: user.id,
                broker: cleanBroker,
                accountNumber: cleanAccountNumber,
                isApproved: false,
            });
        }

        if (submittedCount === 0) {
            return {
                error: "Selected accounts are either already submitted or missing an MT4/MT5 account number.",
            };
        }

        revalidatePath("/dashboard/trading-systems");
        revalidatePath("/dashboard/accounts");
        revalidatePath("/admin/trading-systems");
        revalidatePath("/admin/trading-systems/accounts");
        revalidatePath("/admin/trading-systems/accounts/pending");

        return { success: true, submittedCount };
    } catch (error) {
        console.error("submitMultipleAccountRequests error:", error);
        return { error: "Failed to submit account license requests." };
    }
}

export async function submitAccountRequest(
    data: z.infer<typeof submitAccountSchema>
) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const validation = submitAccountSchema.safeParse(data);
    if (!validation.success) {
        return {
            error:
                validation.error.issues[0]?.message ||
                validation.error.message,
        };
    }

    try {
        const { broker, accountNumber } = validation.data;
        const cleanAccountNumber = accountNumber.trim();

        const existing = await prisma.eALicense.findFirst({
            where: {
                accountNumber: cleanAccountNumber,
                broker,
            },
        });

        if (existing) {
            return { error: "This trading account is already registered." };
        }

        const otherUserAccount = await prisma.tradingAccount.findFirst({
            where: {
                accountNumber: cleanAccountNumber,
                broker: { equals: broker, mode: "insensitive" },
                userId: { not: user.id },
            },
            select: { id: true },
        });

        if (otherUserAccount) {
            return {
                error: "This trading account is already registered by another user.",
            };
        }

        const createdLicense = await prisma.eALicense.create({
            data: {
                userId: user.id,
                broker,
                accountNumber: cleanAccountNumber,
                status: AccountStatus.PENDING,
            },
            select: { id: true },
        });

        await notifyAdminsOfLicenseRequest({
            licenseId: createdLicense.id,
            userId: user.id,
            broker,
            accountNumber: cleanAccountNumber,
            userEmail: user.email,
        });

        await ensureTradingAccountLicenseKey({
            userId: user.id,
            broker,
            accountNumber: cleanAccountNumber,
            isApproved: false,
        });

        revalidatePath("/dashboard/trading-systems");
        revalidatePath("/dashboard/accounts");
        return { success: true };
    } catch {
        return { error: "Failed to submit account request." };
    }
}

export async function cancelAccountRequest(licenseId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const existing = await prisma.eALicense.findUnique({
            where: { id: licenseId },
        });

        if (!existing || existing.userId !== user.id) {
            return { success: false, error: "License not found" };
        }

        if (existing.status !== AccountStatus.PENDING) {
            return {
                success: false,
                error: "Cannot cancel a processed request.",
            };
        }

        await prisma.eALicense.delete({
            where: { id: licenseId },
        });

        revalidatePath("/dashboard/trading-systems");
        return { success: true };
    } catch {
        return { success: false, error: "Failed to cancel request." };
    }
}

export async function removeAccount(
    licenseIdOrInput:
        | string
        | {
              licenseId?: string | null;
              accountNumber?: string | null;
              broker?: string | null;
          }
) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const licenseId =
            typeof licenseIdOrInput === "string"
                ? licenseIdOrInput
                : licenseIdOrInput.licenseId || null;
        let cleanAccountNumber =
            typeof licenseIdOrInput === "string"
                ? ""
                : (licenseIdOrInput.accountNumber || "").trim();
        let cleanBroker =
            typeof licenseIdOrInput === "string"
                ? ""
                : (licenseIdOrInput.broker || "").trim();

        const { accountRetained } = await prisma.$transaction(
            async (tx) => {
                let removedAccountNumber = cleanAccountNumber;
                let removedBroker = cleanBroker;

                if (licenseId) {
                    const existing = await tx.eALicense.findUnique({
                        where: { id: licenseId },
                    });

                    if (existing && existing.userId === user.id) {
                        if (!removedAccountNumber) {
                            removedAccountNumber =
                                existing.accountNumber.trim();
                        }
                        // The license row is authoritative for the broker.
                        removedBroker = existing.broker || removedBroker;
                        await tx.eALicense.delete({
                            where: { id: licenseId },
                        });
                    }
                }

                if (!removedAccountNumber) {
                    return { accountRetained: false };
                }

                cleanAccountNumber = removedAccountNumber;
                cleanBroker = removedBroker;

                // Remove only the license rows for this broker; the same
                // login at another broker is a different account.
                const licenseCandidates = await tx.eALicense.findMany({
                    where: {
                        userId: user.id,
                        accountNumber: removedAccountNumber,
                    },
                    select: { id: true, broker: true },
                });
                const scopedLicenseIds = filterAccountsByBroker(
                    licenseCandidates,
                    removedBroker
                ).map((license) => license.id);
                if (scopedLicenseIds.length > 0) {
                    await tx.eALicense.deleteMany({
                        where: {
                            id: { in: scopedLicenseIds },
                            userId: user.id,
                        },
                    });
                }

                const matchedCandidates = await tx.tradingAccount.findMany({
                    where: {
                        userId: user.id,
                        accountNumber: removedAccountNumber,
                    },
                    select: {
                        id: true,
                        broker: true,
                        ibAttributionSource: true,
                        totalTrades: true,
                        _count: { select: { journalEntries: true } },
                    },
                });
                const matchedAccounts = filterAccountsByBroker(
                    matchedCandidates,
                    removedBroker
                );

                const matchedAccountIds = matchedAccounts.map((a) => a.id);
                let retained = false;

                if (matchedAccountIds.length > 0) {
                    await tx.proEntitlement.deleteMany({
                        where: {
                            userId: user.id,
                            tradingAccountId: { in: matchedAccountIds },
                        },
                    });

                    await tx.eAProductAccess.updateMany({
                        where: {
                            userId: user.id,
                            tradingAccountId: { in: matchedAccountIds },
                        },
                        data: {
                            status: "REVOKED",
                        },
                    });

                    const autoCreatedEmptyIds = matchedAccounts
                        .filter(
                            (a) =>
                                a.ibAttributionSource ===
                                    "EA_LICENSE_APPROVED" &&
                                (a.totalTrades ?? 0) === 0 &&
                                (a._count?.journalEntries ?? 0) === 0
                        )
                        .map((a) => a.id);

                    const remainingIds = matchedAccountIds.filter(
                        (id) => !autoCreatedEmptyIds.includes(id)
                    );

                    if (autoCreatedEmptyIds.length > 0) {
                        await tx.profile.updateMany({
                            where: {
                                userId: user.id,
                                mainTradingAccountId: {
                                    in: autoCreatedEmptyIds,
                                },
                            },
                            data: { mainTradingAccountId: null },
                        });
                        await tx.tradingAccount.deleteMany({
                            where: {
                                id: { in: autoCreatedEmptyIds },
                                userId: user.id,
                            },
                        });
                    }

                    if (remainingIds.length > 0) {
                        await tx.tradingAccount.updateMany({
                            where: {
                                id: { in: remainingIds },
                                userId: user.id,
                            },
                            data: {
                                ibAttribution: "UNVERIFIED",
                                apiKey: null,
                            },
                        });
                        retained = true;
                    }
                }

                return { accountRetained: retained };
            },
            { maxWait: 10_000, timeout: 20_000 }
        );

        let github: {
            githubSynced: boolean;
            githubSkipped: boolean;
            githubError?: string;
            syncJobId?: string;
        } = { githubSynced: false, githubSkipped: false };

        if (cleanAccountNumber) {
            github = await syncLicenseBackupOrQueue({
                eventKey: `license-sync:user-remove:${user.id}:${normalizeBrokerKey(cleanBroker)}:${cleanAccountNumber}:${Date.now()}`,
                removedAccountNumber: cleanAccountNumber,
                ...(cleanBroker ? { removedBroker: cleanBroker } : {}),
            });
        }

        revalidatePath("/dashboard/trading-systems");
        revalidatePath("/dashboard/accounts");
        revalidatePath("/admin/trading-systems");
        revalidatePath("/admin/trading-systems/accounts");
        return {
            success: true,
            dbUpdated: true,
            accountRetained,
            ...github,
        };
    } catch (error) {
        console.error("removeAccount error:", error);
        return { success: false, error: "Failed to remove account license." };
    }
}

export async function updateTradingAccountLoginNumber(
    tradingAccountId: string,
    accountNumber: string
) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const cleanNumber = (accountNumber || "").trim();
    if (!/^\d{4,20}$/.test(cleanNumber)) {
        return {
            error: "Please enter a valid numeric MT4/MT5 Account Login ID (4-20 digits).",
        };
    }

    try {
        const account = await prisma.tradingAccount.findFirst({
            where: {
                id: tradingAccountId,
                userId: user.id,
            },
            select: {
                id: true,
                broker: true,
            },
        });

        if (!account) {
            return { error: "Trading account not found." };
        }

        const duplicateOtherUser = await prisma.eALicense.findFirst({
            where: {
                accountNumber: cleanNumber,
                userId: { not: user.id },
            },
            select: { id: true },
        });

        if (duplicateOtherUser) {
            return {
                error: `Account #${cleanNumber} is already registered by another user.`,
            };
        }

        await prisma.tradingAccount.update({
            where: { id: account.id },
            data: { accountNumber: cleanNumber },
        });

        revalidatePath("/dashboard/trading-systems");
        revalidatePath("/dashboard/accounts");
        return { success: true, accountNumber: cleanNumber };
    } catch (error) {
        console.error("updateTradingAccountLoginNumber error:", error);
        return { error: "Failed to update MT4/MT5 account number." };
    }
}
