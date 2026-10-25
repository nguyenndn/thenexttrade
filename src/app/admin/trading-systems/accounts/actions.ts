"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
    approveAccountSchema,
    rejectAccountSchema,
    adminCreateLicenseSchema,
} from "@/lib/validations/ea-license";
import { ErrorCode } from "@/lib/errors/ea-license";
import {
    ApproveAccountInput,
    RejectAccountInput,
    AdminCreateLicenseInput,
} from "@/types/ea-license";
import {
    AccountStatus,
    NotificationType,
    NotificationPriority,
} from "@prisma/client";
import { NOTIFICATION_ROUTES } from "@/lib/notification-routes";
import {
    ensureTradingAccountLicenseKey,
    syncLicensesToGitHubBackup,
} from "@/lib/ea/github-license-sync.server";
import { syncLicenseBackupOrQueue } from "@/lib/ea/license-github-sync-outbox.server";
import type { LicenseGitHubSyncOutcome } from "@/lib/ea/license-github-sync-outbox.server";
import { generateApiKey } from "@/lib/utils/api-key";
import { filterAccountsByBroker } from "@/lib/trading-account-identity";

export type LicenseMutationResult = {
    success: boolean;
    dbUpdated?: boolean;
    accountRetained?: boolean;
    githubSynced?: boolean;
    githubSkipped?: boolean;
    githubError?: string;
    syncJobId?: string;
    error?: string;
    licenseKey?: string;
};

function mutationFailure(error: string): LicenseMutationResult {
    return {
        success: false,
        dbUpdated: false,
        accountRetained: false,
        githubSynced: false,
        githubSkipped: false,
        error,
    };
}

function syncFields(outcome: LicenseGitHubSyncOutcome) {
    return {
        githubSynced: outcome.githubSynced,
        githubSkipped: outcome.githubSkipped,
        ...(outcome.githubError ? { githubError: outcome.githubError } : {}),
        ...(outcome.syncJobId ? { syncJobId: outcome.syncJobId } : {}),
    };
}

function buildSyncEventKey(action: string, accountId: string): string {
    return `license-sync:${action}:${accountId}:${Date.now()}`;
}

async function checkAdmin() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { isAuthorized: false, user: null };
    }

    const { data: aal, error: aalError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (
        aalError ||
        (aal && aal.currentLevel === "aal1" && aal.nextLevel === "aal2")
    ) {
        return { isAuthorized: false, user: null };
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });

    if (profile?.role !== "ADMIN") {
        return { isAuthorized: false, user };
    }

    return { isAuthorized: true, user };
}

export async function approveAccount(
    accountId: string,
    data: ApproveAccountInput
): Promise<LicenseMutationResult> {
    try {
        const { isAuthorized, user } = await checkAdmin();
        if (!isAuthorized || !user)
            return { success: false, error: ErrorCode.NOT_ADMIN };

        const validated = approveAccountSchema.safeParse(data);
        if (!validated.success) {
            return {
                success: false,
                error:
                    validated.error.issues[0]?.message || "Validation failed",
            };
        }

        const license = await prisma.eALicense.findUnique({
            where: { id: accountId },
        });

        if (!license) {
            return { success: false, error: ErrorCode.ACCOUNT_NOT_FOUND };
        }

        if (license.status === AccountStatus.APPROVED) {
            return {
                success: false,
                error: ErrorCode.ACCOUNT_ALREADY_APPROVED,
            };
        }

        const { licenseKey } = await prisma.$transaction(
            async (tx) => {
                await tx.eALicense.update({
                    where: { id: accountId },
                    data: {
                        status: AccountStatus.APPROVED,
                        isVerified: true,
                        verifiedAt: new Date(),
                        approvedBy: user.id,
                        approvedAt: new Date(),
                        startDate: new Date(),
                        expiryDate:
                            data.expiryDate ||
                            new Date("2040-12-31T23:59:59.000Z"),
                        note: data.note,
                        rejectedBy: null,
                        rejectedAt: null,
                        rejectReason: null,
                    },
                });

                const ensured = await ensureTradingAccountLicenseKey(
                    {
                        userId: license.userId,
                        broker: license.broker,
                        accountNumber: license.accountNumber,
                        isApproved: true,
                        approvedBy: user.id,
                    },
                    tx
                );

                await tx.notification.create({
                    data: {
                        userId: license.userId,
                        type: NotificationType.LICENSE_APPROVED,
                        title: "EA License Approved",
                        message: `Account #${license.accountNumber} (${license.broker}) has been verified under our IB. Your License Key (${ensured.licenseKey}) is now ready on Trading Systems.`,
                        priority: NotificationPriority.HIGH,
                        link: NOTIFICATION_ROUTES.EA_DASHBOARD,
                    },
                });

                await tx.auditLog.create({
                    data: {
                        adminId: user.id,
                        action: "LICENSE_APPROVED",
                        targetType: "EALicense",
                        targetId: accountId,
                        details: {
                            accountNumber: license.accountNumber,
                            broker: license.broker,
                            expiry: data.expiryDate,
                            licenseKeyMasked: `${ensured.licenseKey.slice(0, 8)}-****-${ensured.licenseKey.slice(-4)}`,
                        },
                    },
                });

                return ensured;
            },
            { maxWait: 10_000, timeout: 20_000 }
        );

        const github = await syncLicenseBackupOrQueue({
            eventKey: buildSyncEventKey("approve", accountId),
        });

        revalidatePath("/admin/trading-systems");
        revalidatePath("/admin/trading-systems/accounts");
        revalidatePath("/dashboard/trading-systems");
        revalidatePath("/dashboard/accounts");
        return {
            success: true,
            dbUpdated: true,
            accountRetained: false,
            licenseKey,
            ...syncFields(github),
        };
    } catch (error) {
        console.error("approveAccount error:", error);
        return mutationFailure(ErrorCode.INTERNAL_ERROR);
    }
}

export async function rejectAccount(
    accountId: string,
    data: RejectAccountInput
): Promise<LicenseMutationResult> {
    try {
        const { isAuthorized, user } = await checkAdmin();
        if (!isAuthorized || !user)
            return { success: false, error: ErrorCode.NOT_ADMIN };

        const validated = rejectAccountSchema.safeParse(data);
        if (!validated.success) {
            return {
                success: false,
                error:
                    validated.error.issues[0]?.message || "Validation failed",
            };
        }

        const license = await prisma.eALicense.findUnique({
            where: { id: accountId },
        });

        if (!license) {
            return { success: false, error: ErrorCode.ACCOUNT_NOT_FOUND };
        }

        await prisma.$transaction(
            async (tx) => {
                await tx.eALicense.update({
                    where: { id: accountId },
                    data: {
                        status: AccountStatus.REJECTED,
                        isVerified: false,
                        rejectedBy: user.id,
                        rejectedAt: new Date(),
                        rejectReason: data.reason,
                        approvedBy: null,
                        approvedAt: null,
                    },
                });

                const rejectedCandidates = await tx.tradingAccount.findMany({
                    where: {
                        userId: license.userId,
                        accountNumber: license.accountNumber.trim(),
                    },
                    select: { id: true, broker: true },
                });
                const rejectedAccountIds = filterAccountsByBroker(
                    rejectedCandidates,
                    license.broker
                ).map((a) => a.id);
                if (rejectedAccountIds.length > 0) {
                    await tx.tradingAccount.updateMany({
                        where: { id: { in: rejectedAccountIds } },
                        data: { ibAttribution: "UNVERIFIED" },
                    });
                    await tx.proEntitlement.deleteMany({
                        where: {
                            tradingAccountId: { in: rejectedAccountIds },
                        },
                    });
                    await tx.eAProductAccess.updateMany({
                        where: {
                            tradingAccountId: { in: rejectedAccountIds },
                        },
                        data: { status: "REVOKED" },
                    });
                }

                await tx.notification.create({
                    data: {
                        userId: license.userId,
                        type: NotificationType.LICENSE_REJECTED,
                        title: "License Rejected",
                        message: `Request for account ${license.accountNumber} was rejected. Reason: ${data.reason}`,
                        priority: NotificationPriority.HIGH,
                        link: NOTIFICATION_ROUTES.EA_DASHBOARD,
                    },
                });

                await tx.auditLog.create({
                    data: {
                        adminId: user.id,
                        action: "LICENSE_REJECTED",
                        targetType: "EALicense",
                        targetId: accountId,
                        details: {
                            accountNumber: license.accountNumber,
                            reason: data.reason,
                        },
                    },
                });
            },
            { maxWait: 10_000, timeout: 20_000 }
        );

        const github = await syncLicenseBackupOrQueue({
            eventKey: buildSyncEventKey("reject", accountId),
        });

        revalidatePath("/admin/trading-systems");
        revalidatePath("/admin/trading-systems/accounts");
        revalidatePath("/dashboard/trading-systems");
        return {
            success: true,
            dbUpdated: true,
            accountRetained: false,
            ...syncFields(github),
        };
    } catch (error) {
        console.error("rejectAccount error:", error);
        return mutationFailure(ErrorCode.INTERNAL_ERROR);
    }
}

export async function deleteLicense(
    accountId: string
): Promise<LicenseMutationResult> {
    try {
        const { isAuthorized, user } = await checkAdmin();
        if (!isAuthorized || !user)
            return { success: false, error: ErrorCode.NOT_ADMIN };

        const license = await prisma.eALicense.findUnique({
            where: { id: accountId },
        });

        if (!license) {
            return { success: false, error: ErrorCode.ACCOUNT_NOT_FOUND };
        }

        const { accountRetained } = await prisma.$transaction(
            async (tx) => {
                await tx.eALicense.delete({
                    where: { id: accountId },
                });

                const deletedCandidates = await tx.tradingAccount.findMany({
                    where: {
                        userId: license.userId,
                        accountNumber: license.accountNumber.trim(),
                    },
                    select: {
                        id: true,
                        broker: true,
                        ibAttributionSource: true,
                        totalTrades: true,
                        _count: { select: { journalEntries: true } },
                    },
                });
                const deletedMatchedAccounts = filterAccountsByBroker(
                    deletedCandidates,
                    license.broker
                );
                const deletedAccountIds = deletedMatchedAccounts.map(
                    (a) => a.id
                );
                let retained = false;

                if (deletedAccountIds.length > 0) {
                    await tx.proEntitlement.deleteMany({
                        where: {
                            tradingAccountId: { in: deletedAccountIds },
                        },
                    });
                    await tx.eAProductAccess.updateMany({
                        where: {
                            tradingAccountId: { in: deletedAccountIds },
                        },
                        data: { status: "REVOKED" },
                    });

                    // Auto-created placeholder accounts from Grant License with 0 trades should be deleted cleanly
                    const autoCreatedEmptyIds = deletedMatchedAccounts
                        .filter(
                            (a) =>
                                a.ibAttributionSource ===
                                    "EA_LICENSE_APPROVED" &&
                                (a.totalTrades ?? 0) === 0 &&
                                (a._count?.journalEntries ?? 0) === 0
                        )
                        .map((a) => a.id);

                    const remainingIds = deletedAccountIds.filter(
                        (id) => !autoCreatedEmptyIds.includes(id)
                    );

                    if (autoCreatedEmptyIds.length > 0) {
                        await tx.profile.updateMany({
                            where: {
                                userId: license.userId,
                                mainTradingAccountId: {
                                    in: autoCreatedEmptyIds,
                                },
                            },
                            data: { mainTradingAccountId: null },
                        });
                        await tx.eAProductUsageEvent.deleteMany({
                            where: {
                                tradingAccountId: {
                                    in: autoCreatedEmptyIds,
                                },
                            },
                        });
                        await tx.tradingAccount.deleteMany({
                            where: { id: { in: autoCreatedEmptyIds } },
                        });
                    }

                    if (remainingIds.length > 0) {
                        await tx.tradingAccount.updateMany({
                            where: { id: { in: remainingIds } },
                            data: {
                                ibAttribution: "UNVERIFIED",
                                apiKey: null,
                            },
                        });
                        retained = true;
                    }
                }

                await tx.auditLog.create({
                    data: {
                        adminId: user.id,
                        action: "LICENSE_DELETED",
                        targetType: "EALicense",
                        targetId: accountId,
                        details: {
                            accountNumber: license.accountNumber,
                            broker: license.broker,
                            accountRetained: retained,
                        },
                    },
                });

                return { accountRetained: retained };
            },
            { maxWait: 10_000, timeout: 20_000 }
        );

        const github = await syncLicenseBackupOrQueue({
            eventKey: buildSyncEventKey("delete", accountId),
            removedAccountNumber: license.accountNumber,
            removedBroker: license.broker,
        });

        revalidatePath("/admin/trading-systems");
        revalidatePath("/admin/trading-systems/accounts");
        revalidatePath("/dashboard/trading-systems");
        return {
            success: true,
            dbUpdated: true,
            accountRetained,
            ...syncFields(github),
        };
    } catch (error) {
        console.error("deleteLicense error:", error);
        return mutationFailure(ErrorCode.INTERNAL_ERROR);
    }
}

export async function syncAllLicensesToGitHub() {
    try {
        const { isAuthorized } = await checkAdmin();
        if (!isAuthorized) {
            return { success: false, error: ErrorCode.NOT_ADMIN };
        }

        const result = await syncLicensesToGitHubBackup();

        if (result.skipped) {
            return {
                success: false,
                githubSynced: false,
                githubSkipped: true,
                error:
                    result.error ||
                    "GITHUB_TOKEN is not configured (GitHub backup sync skipped).",
            };
        }

        if (!result.success) {
            return {
                success: false,
                githubSynced: false,
                githubSkipped: false,
                error: result.error || "Failed to sync to GitHub backup",
            };
        }

        return {
            success: true,
            githubSynced: true,
            githubSkipped: false,
            totalActiveAccounts: result.totalActiveAccounts ?? 0,
            commitSha: result.commitSha,
        };
    } catch (error) {
        console.error("syncAllLicensesToGitHub error:", error);
        return { success: false, error: ErrorCode.INTERNAL_ERROR };
    }
}

export async function suspendLicense(
    accountId: string,
    reason?: string
): Promise<LicenseMutationResult> {
    try {
        const { isAuthorized, user } = await checkAdmin();
        if (!isAuthorized || !user)
            return { success: false, error: ErrorCode.NOT_ADMIN };

        const license = await prisma.eALicense.findUnique({
            where: { id: accountId },
        });

        if (!license) {
            return { success: false, error: ErrorCode.ACCOUNT_NOT_FOUND };
        }

        const suspendNote = reason?.trim() || "Suspended by Admin";

        await prisma.$transaction(
            async (tx) => {
                await tx.eALicense.update({
                    where: { id: accountId },
                    data: {
                        status: AccountStatus.SUSPENDED,
                        isVerified: false,
                        rejectReason: suspendNote,
                    },
                });

                const suspendedCandidates = await tx.tradingAccount.findMany({
                    where: {
                        userId: license.userId,
                        accountNumber: license.accountNumber.trim(),
                    },
                    select: { id: true, broker: true },
                });
                const suspendedAccountIds = filterAccountsByBroker(
                    suspendedCandidates,
                    license.broker
                ).map((a) => a.id);
                if (suspendedAccountIds.length > 0) {
                    await tx.tradingAccount.updateMany({
                        where: { id: { in: suspendedAccountIds } },
                        data: { ibAttribution: "UNVERIFIED" },
                    });
                    await tx.proEntitlement.deleteMany({
                        where: {
                            tradingAccountId: { in: suspendedAccountIds },
                        },
                    });
                    await tx.eAProductAccess.updateMany({
                        where: {
                            tradingAccountId: { in: suspendedAccountIds },
                        },
                        data: { status: "REVOKED" },
                    });
                }

                await tx.notification.create({
                    data: {
                        userId: license.userId,
                        type: NotificationType.LICENSE_REJECTED,
                        title: "EA License Suspended",
                        message: `License for MT5 account #${license.accountNumber} (${license.broker}) has been suspended. Reason: ${suspendNote}`,
                        priority: NotificationPriority.HIGH,
                        link: NOTIFICATION_ROUTES.EA_DASHBOARD,
                    },
                });

                await tx.auditLog.create({
                    data: {
                        adminId: user.id,
                        action: "LICENSE_SUSPENDED",
                        targetType: "EALicense",
                        targetId: accountId,
                        details: {
                            accountNumber: license.accountNumber,
                            broker: license.broker,
                            reason: suspendNote,
                        },
                    },
                });
            },
            { maxWait: 10_000, timeout: 20_000 }
        );

        const github = await syncLicenseBackupOrQueue({
            eventKey: buildSyncEventKey("suspend", accountId),
        });

        revalidatePath("/admin/trading-systems");
        revalidatePath("/admin/trading-systems/accounts");
        revalidatePath("/dashboard/trading-systems");
        return {
            success: true,
            dbUpdated: true,
            accountRetained: false,
            ...syncFields(github),
        };
    } catch (error) {
        console.error("suspendLicense error:", error);
        return mutationFailure(ErrorCode.INTERNAL_ERROR);
    }
}

export async function reactivateLicense(
    accountId: string
): Promise<LicenseMutationResult> {
    try {
        const { isAuthorized, user } = await checkAdmin();
        if (!isAuthorized || !user)
            return { success: false, error: ErrorCode.NOT_ADMIN };

        const license = await prisma.eALicense.findUnique({
            where: { id: accountId },
        });

        if (!license) {
            return { success: false, error: ErrorCode.ACCOUNT_NOT_FOUND };
        }

        const { licenseKey } = await prisma.$transaction(
            async (tx) => {
                await tx.eALicense.update({
                    where: { id: accountId },
                    data: {
                        status: AccountStatus.APPROVED,
                        isVerified: true,
                        verifiedAt: new Date(),
                        approvedBy: user.id,
                        approvedAt: new Date(),
                        rejectedBy: null,
                        rejectedAt: null,
                        rejectReason: null,
                    },
                });

                const ensured = await ensureTradingAccountLicenseKey(
                    {
                        userId: license.userId,
                        broker: license.broker,
                        accountNumber: license.accountNumber,
                        isApproved: true,
                        approvedBy: user.id,
                    },
                    tx
                );

                await tx.auditLog.create({
                    data: {
                        adminId: user.id,
                        action: "LICENSE_REACTIVATED",
                        targetType: "EALicense",
                        targetId: accountId,
                        details: {
                            accountNumber: license.accountNumber,
                            broker: license.broker,
                            licenseKeyMasked: `${ensured.licenseKey.slice(0, 8)}-****-${ensured.licenseKey.slice(-4)}`,
                        },
                    },
                });

                return ensured;
            },
            { maxWait: 10_000, timeout: 20_000 }
        );

        const github = await syncLicenseBackupOrQueue({
            eventKey: buildSyncEventKey("reactivate", accountId),
        });

        revalidatePath("/admin/trading-systems");
        revalidatePath("/admin/trading-systems/accounts");
        revalidatePath("/dashboard/trading-systems");
        return {
            success: true,
            dbUpdated: true,
            accountRetained: false,
            licenseKey,
            ...syncFields(github),
        };
    } catch (error) {
        console.error("reactivateLicense error:", error);
        return mutationFailure(ErrorCode.INTERNAL_ERROR);
    }
}

export async function regenerateAccountLicenseKey(
    accountId: string
): Promise<LicenseMutationResult> {
    try {
        const { isAuthorized, user } = await checkAdmin();
        if (!isAuthorized || !user)
            return { success: false, error: ErrorCode.NOT_ADMIN };

        const license = await prisma.eALicense.findUnique({
            where: { id: accountId },
        });

        if (!license) {
            return { success: false, error: ErrorCode.ACCOUNT_NOT_FOUND };
        }

        const newKey = await prisma.$transaction(
            async (tx) => {
                const { tradingAccountId } =
                    await ensureTradingAccountLicenseKey(
                        {
                            userId: license.userId,
                            broker: license.broker,
                            accountNumber: license.accountNumber,
                            isApproved:
                                license.status === AccountStatus.APPROVED,
                            approvedBy: user.id,
                        },
                        tx
                    );

                const key = generateApiKey();
                await tx.tradingAccount.update({
                    where: { id: tradingAccountId },
                    data: {
                        apiKey: key,
                        apiKeyCreatedAt: new Date(),
                    },
                });

                await tx.auditLog.create({
                    data: {
                        adminId: user.id,
                        action: "LICENSE_KEY_REGENERATED",
                        targetType: "EALicense",
                        targetId: accountId,
                        details: {
                            accountNumber: license.accountNumber,
                            broker: license.broker,
                            newKeyMasked: `${key.slice(0, 8)}-****-${key.slice(-4)}`,
                        },
                    },
                });

                return key;
            },
            { maxWait: 10_000, timeout: 20_000 }
        );

        revalidatePath("/admin/trading-systems");
        revalidatePath("/admin/trading-systems/accounts");
        revalidatePath("/dashboard/trading-systems");
        return {
            success: true,
            dbUpdated: true,
            accountRetained: false,
            licenseKey: newKey,
            githubSynced: false,
            githubSkipped: false,
        };
    } catch (error) {
        console.error("regenerateAccountLicenseKey error:", error);
        return mutationFailure(ErrorCode.INTERNAL_ERROR);
    }
}

export async function adminIssueLicense(
    data: AdminCreateLicenseInput
): Promise<LicenseMutationResult> {
    try {
        const { isAuthorized, user: adminUser } = await checkAdmin();
        if (!isAuthorized || !adminUser)
            return { success: false, error: ErrorCode.NOT_ADMIN };

        const validated = adminCreateLicenseSchema.safeParse(data);
        if (!validated.success) {
            return {
                success: false,
                error:
                    validated.error.issues[0]?.message || "Validation failed",
            };
        }

        const { userEmail, broker, accountNumber, expiryDate, note } =
            validated.data;
        const effectiveExpiryDate =
            expiryDate || new Date("2040-12-31T23:59:59.000Z");

        const targetUser = await prisma.user.findFirst({
            where: {
                email: {
                    equals: userEmail,
                    mode: "insensitive",
                },
            },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });

        if (!targetUser) {
            return {
                success: false,
                error: `User with email "${userEmail}" was not found.`,
            };
        }

        const existingLicense = await prisma.eALicense.findUnique({
            where: {
                broker_accountNumber: {
                    broker,
                    accountNumber,
                },
            },
        });

        if (existingLicense && existingLicense.userId !== targetUser.id) {
            return {
                success: false,
                error: `Account #${accountNumber} (${broker}) is already registered to another user.`,
            };
        }

        const { licenseKey, licenseId } = await prisma.$transaction(
            async (tx) => {
                const upsertedLicense = await tx.eALicense.upsert({
                    where: {
                        broker_accountNumber: {
                            broker,
                            accountNumber,
                        },
                    },
                    update: {
                        status: AccountStatus.APPROVED,
                        isVerified: true,
                        verifiedAt: new Date(),
                        approvedBy: adminUser.id,
                        approvedAt: new Date(),
                        startDate: new Date(),
                        expiryDate: effectiveExpiryDate,
                        note: note || `Granted by Admin`,
                        rejectedBy: null,
                        rejectedAt: null,
                        rejectReason: null,
                    },
                    create: {
                        userId: targetUser.id,
                        broker,
                        accountNumber,
                        status: AccountStatus.APPROVED,
                        isVerified: true,
                        verifiedAt: new Date(),
                        approvedBy: adminUser.id,
                        approvedAt: new Date(),
                        startDate: new Date(),
                        expiryDate: effectiveExpiryDate,
                        note: note || `Granted by Admin`,
                    },
                });

                const ensured = await ensureTradingAccountLicenseKey(
                    {
                        userId: targetUser.id,
                        broker,
                        accountNumber,
                        isApproved: true,
                        approvedBy: adminUser.id,
                    },
                    tx
                );

                await tx.notification.create({
                    data: {
                        userId: targetUser.id,
                        type: NotificationType.LICENSE_APPROVED,
                        title: "EA License Issued",
                        message: `Admin has issued an EA License for your account #${accountNumber} (${broker}). Your License Key (${ensured.licenseKey}) is ready on Trading Systems.`,
                        priority: NotificationPriority.HIGH,
                        link: NOTIFICATION_ROUTES.EA_DASHBOARD,
                    },
                });

                await tx.auditLog.create({
                    data: {
                        adminId: adminUser.id,
                        action: "LICENSE_ISSUED_BY_ADMIN",
                        targetType: "EALicense",
                        targetId: upsertedLicense.id,
                        details: {
                            targetUserEmail: targetUser.email,
                            accountNumber,
                            broker,
                            licenseKeyMasked: `${ensured.licenseKey.slice(0, 8)}-****-${ensured.licenseKey.slice(-4)}`,
                        },
                    },
                });

                return {
                    licenseKey: ensured.licenseKey,
                    licenseId: upsertedLicense.id,
                };
            },
            { maxWait: 10_000, timeout: 20_000 }
        );

        const github = await syncLicenseBackupOrQueue({
            eventKey: buildSyncEventKey("issue", licenseId),
        });

        revalidatePath("/admin/trading-systems");
        revalidatePath("/admin/trading-systems/accounts");
        revalidatePath("/dashboard/trading-systems");
        return {
            success: true,
            dbUpdated: true,
            accountRetained: false,
            licenseKey,
            ...syncFields(github),
        };
    } catch (error) {
        console.error("adminIssueLicense error:", error);
        return mutationFailure(ErrorCode.INTERNAL_ERROR);
    }
}
