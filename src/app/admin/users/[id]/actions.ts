"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { NOTIFICATION_ROUTES } from "@/lib/notification-routes";
import { filterAccountsByBroker } from "@/lib/trading-account-identity";

async function checkAdmin() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { isAuthorized: false, user: null };

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });

    if (profile?.role !== "ADMIN") return { isAuthorized: false, user };
    return { isAuthorized: true, user };
}

function getSupabaseAdmin() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

/** Send a password reset email to the user */
export async function resetUserPassword(userId: string) {
    try {
        const { isAuthorized, user: admin } = await checkAdmin();
        if (!isAuthorized || !admin)
            return { success: false, error: "Unauthorized" };

        const [targetUser, adminRecord] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: { email: true, name: true },
            }),
            prisma.user.findUnique({
                where: { id: admin.id },
                select: { name: true, email: true },
            }),
        ]);

        if (!targetUser?.email)
            return { success: false, error: "User has no email" };

        const supabaseAdmin = getSupabaseAdmin();
        const { data: linkData, error } =
            await supabaseAdmin.auth.admin.generateLink({
                type: "recovery",
                email: targetUser.email,
            });

        if (error) return { success: false, error: error.message };

        const resetUrl = linkData?.properties?.action_link;
        if (!resetUrl) {
            return {
                success: false,
                error: "Failed to generate password recovery link",
            };
        }

        const {
            buildAdminResetPasswordEmailHtml,
            sendEmailWithDetails,
        } = await import("@/lib/services/email.service");

        const html = buildAdminResetPasswordEmailHtml({
            userName: targetUser.name || targetUser.email.split("@")[0],
            adminName: adminRecord?.name || admin.email || "TheNextTrade Admin",
            resetUrl,
        });

        const emailRes = await sendEmailWithDetails({
            to: targetUser.email,
            subject: "🛡️ Password Recovery Link from TheNextTrade Admin",
            html,
        });

        if (!emailRes.success) {
            return {
                success: false,
                error: emailRes.error || "Failed to send password reset email",
            };
        }

        await prisma.auditLog.create({
            data: {
                adminId: admin.id,
                action: "PASSWORD_RESET_SENT",
                targetType: "User",
                targetId: userId,
                details: { email: targetUser.email },
            },
        });

        return { success: true };
    } catch (error) {
        console.error("resetUserPassword error:", error);
        return { success: false, error: "Internal error" };
    }
}

/** Send a notification to the user */
export async function sendUserNotification(
    userId: string,
    title: string,
    message: string
) {
    try {
        const { isAuthorized, user: admin } = await checkAdmin();
        if (!isAuthorized || !admin)
            return { success: false, error: "Unauthorized" };

        if (!title.trim() || !message.trim()) {
            return { success: false, error: "Title and message are required" };
        }

        await prisma.notification.create({
            data: {
                userId,
                type: "ANNOUNCEMENT",
                title: title.trim(),
                message: message.trim(),
                priority: "NORMAL",
                icon: "bell",
                link: NOTIFICATION_ROUTES.DASHBOARD,
            },
        });

        await prisma.auditLog.create({
            data: {
                adminId: admin.id,
                action: "NOTIFICATION_SENT",
                targetType: "User",
                targetId: userId,
                details: { title },
            },
        });

        revalidatePath(`/admin/users/${userId}`);
        return { success: true };
    } catch (error) {
        console.error("sendUserNotification error:", error);
        return { success: false, error: "Internal error" };
    }
}

/** Update IB attribution for a trading account (Doc #3 Step 2) */
export async function updateTradingAccountIbAttribution(
    accountId: string,
    ibAttribution: "CONFIRMED" | "NOT_OURS" | "UNKNOWN",
    userId?: string
) {
    try {
        const { isAuthorized, user: admin } = await checkAdmin();
        if (!isAuthorized || !admin) {
            return { success: false, error: "Unauthorized" };
        }

        const account = await prisma.tradingAccount.findUnique({
            where: { id: accountId },
        });
        if (!account) {
            return { success: false, error: "Trading account not found" };
        }

        const updated = await prisma.tradingAccount.update({
            where: { id: accountId },
            data: {
                ibAttribution,
                ibAttributionSource: "MANUAL",
                ibAttributionAt: new Date(),
                ibAttributionBy: admin.id,
            },
        });

        // Unify IB Attribution with EALicense, License Key, All 3 EAs Access, and GitHub Backup
        if (account.accountNumber) {
            const cleanAccountNumber = account.accountNumber.trim();
            const cleanBroker = (account.broker || "EXNESS")
                .trim()
                .toUpperCase();

            const {
                ensureTradingAccountLicenseKey,
                syncLicensesToGitHubBackup,
            } = await import("@/lib/ea/github-license-sync.server");

            if (ibAttribution === "CONFIRMED") {
                await ensureTradingAccountLicenseKey({
                    userId: account.userId,
                    broker: cleanBroker,
                    accountNumber: cleanAccountNumber,
                    isApproved: true,
                    approvedBy: admin.id,
                });

                await prisma.proEntitlement.upsert({
                    where: { tradingAccountId: account.id },
                    create: {
                        userId: account.userId,
                        tradingAccountId: account.id,
                        status: "ACTIVE",
                        source: "IB_VERIFIED",
                        broker: cleanBroker,
                        accountNumber: cleanAccountNumber,
                        accountNumberMasked:
                            cleanAccountNumber.length >= 4
                                ? `****${cleanAccountNumber.slice(-4)}`
                                : "****",
                        startsAt: new Date(),
                        lastReviewedAt: new Date(),
                        reviewedBy: admin.id,
                    },
                    update: {
                        status: "ACTIVE",
                        source: "IB_VERIFIED",
                        broker: cleanBroker,
                        accountNumber: cleanAccountNumber,
                        accountNumberMasked:
                            cleanAccountNumber.length >= 4
                                ? `****${cleanAccountNumber.slice(-4)}`
                                : "****",
                        startsAt: new Date(),
                        expiresAt: null,
                        lastReviewedAt: new Date(),
                        reviewedBy: admin.id,
                    },
                });

                await prisma.eALicense.upsert({
                    where: {
                        broker_accountNumber: {
                            broker: cleanBroker,
                            accountNumber: cleanAccountNumber,
                        },
                    },
                    create: {
                        userId: account.userId,
                        broker: cleanBroker,
                        accountNumber: cleanAccountNumber,
                        status: "APPROVED",
                        isVerified: true,
                        verifiedAt: new Date(),
                        approvedBy: admin.id,
                        approvedAt: new Date(),
                        startDate: new Date(),
                        note: "Approved via IB Attribution (All EAs Unlocked)",
                    },
                    update: {
                        status: "APPROVED",
                        isVerified: true,
                        verifiedAt: new Date(),
                        approvedBy: admin.id,
                        approvedAt: new Date(),
                        rejectedBy: null,
                        rejectedAt: null,
                        rejectReason: null,
                    },
                });

                await syncLicensesToGitHubBackup();
            } else if (ibAttribution === "NOT_OURS") {
                const licenseCandidates = await prisma.eALicense.findMany({
                    where: {
                        userId: account.userId,
                        accountNumber: cleanAccountNumber,
                    },
                    select: { id: true, broker: true },
                });
                const scopedLicenseIds = filterAccountsByBroker(
                    licenseCandidates,
                    cleanBroker
                ).map((license) => license.id);
                if (scopedLicenseIds.length > 0) {
                    await prisma.eALicense.updateMany({
                        where: { id: { in: scopedLicenseIds } },
                        data: {
                            status: "SUSPENDED",
                            isVerified: false,
                            rejectReason:
                                "Marked as External / Not Ours IB",
                        },
                    });
                }
                await prisma.proEntitlement.deleteMany({
                    where: {
                        tradingAccountId: account.id,
                        source: "IB_VERIFIED",
                    },
                });
                await syncLicensesToGitHubBackup();
            }
        }

        await prisma.auditLog.create({
            data: {
                adminId: admin.id,
                action: "UPDATE_IB_ATTRIBUTION",
                targetType: "TradingAccount",
                targetId: accountId,
                details: {
                    previous: account.ibAttribution,
                    next: ibAttribution,
                    accountNumber: account.accountNumber,
                    broker: account.broker,
                },
            },
        });

        if (userId || account.userId) {
            revalidatePath(`/admin/users/${userId || account.userId}`);
        }
        revalidatePath("/admin/ib/traders");
        revalidatePath("/admin/ib");
        return { success: true, data: updated };
    } catch (error) {
        console.error("updateTradingAccountIbAttribution error:", error);
        return { success: false, error: "Failed to update IB attribution" };
    }
}
