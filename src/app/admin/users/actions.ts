"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { normalizeCountryCode } from "@/lib/country-utils";

// =============================================================================
// AUTH HELPERS (reused pattern from [id]/actions.ts)
// =============================================================================

async function checkAdmin() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { isAuthorized: false, user: null };

    // Enforce MFA if user has enrolled 2FA
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

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const createUserSchema = z
    .object({
        name: z.string().min(1, "Name is required").max(100),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string(),
        role: z.enum(["USER", "EDITOR", "ADMIN"]),
        country: z
            .union([
                z
                    .string()
                    .trim()
                    .regex(
                        /^[A-Za-z]{2}$/,
                        "Country must be a two-letter country code"
                    ),
                z.literal(""),
            ])
            .optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

// =============================================================================
// CREATE USER
// =============================================================================

export async function createUser(data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: string;
    country?: string;
}) {
    try {
        const { isAuthorized, user: admin } = await checkAdmin();
        if (!isAuthorized || !admin) {
            return {
                success: false,
                error: "Unauthorized. Only admins can create users.",
            };
        }

        const validated = createUserSchema.safeParse(data);
        if (!validated.success) {
            const firstError = validated.error.issues[0];
            return {
                success: false,
                error: firstError?.message || "Invalid input",
            };
        }

        const { name, email, password, role } = validated.data;
        const country = normalizeCountryCode(validated.data.country);

        // Check if email already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return {
                success: false,
                error: "A user with this email already exists",
            };
        }

        // Create user in Supabase Auth
        const supabaseAdmin = getSupabaseAdmin();
        const { data: authData, error: authError } =
            await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: name, country },
            });

        if (authError || !authData.user) {
            return {
                success: false,
                error: authError?.message || "Failed to create auth account",
            };
        }

        // Create user in Prisma
        await prisma.user.create({
            data: {
                id: authData.user.id,
                email,
                name,
            },
        });

        // Create profile with role
        await prisma.profile.create({
            data: {
                userId: authData.user.id,
                role: role as UserRole,
                country,
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                adminId: admin.id,
                action: "USER_CREATED",
                targetType: "User",
                targetId: authData.user.id,
                details: { email, role, name, country },
            },
        });

        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("createUser error:", error);
        return { success: false, error: "An unexpected error occurred" };
    }
}

// =============================================================================
// CHANGE USER ROLE
// =============================================================================

export async function changeUserRole(userId: string, newRole: string) {
    try {
        const { isAuthorized, user: admin } = await checkAdmin();
        if (!isAuthorized || !admin) {
            return { success: false, error: "Unauthorized" };
        }

        // Prevent self-demotion
        if (admin.id === userId) {
            return { success: false, error: "You cannot change your own role" };
        }

        if (!["USER", "EDITOR", "ADMIN"].includes(newRole)) {
            return { success: false, error: "Invalid role" };
        }

        await prisma.profile.upsert({
            where: { userId },
            update: { role: newRole as UserRole },
            create: { userId, role: newRole as UserRole },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                adminId: admin.id,
                action: "ROLE_CHANGED",
                targetType: "User",
                targetId: userId,
                details: { newRole },
            },
        });

        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("changeUserRole error:", error);
        return { success: false, error: "An unexpected error occurred" };
    }
}

// =============================================================================
// DELETE USER
// =============================================================================

async function performCascadeUserDelete(tx: any, userId: string) {
    // 1. Audit logs, broadcasts, and AI admin references
    await tx.notification.updateMany({
        where: { broadcast: { createdBy: userId } },
        data: { broadcastId: null },
    });
    await tx.adminBroadcast.deleteMany({ where: { createdBy: userId } });
    await tx.auditLog.deleteMany({ where: { adminId: userId } });
    await tx.adminAuditLog.deleteMany({ where: { adminId: userId } });
    await tx.aiRoutingPolicy.updateMany({
        where: { createdBy: userId },
        data: { createdBy: null },
    });
    await tx.aiProviderCredential.updateMany({
        where: { createdBy: userId },
        data: { createdBy: null },
    });

    // 2. Media, Articles, Comments, Shortcuts, Feedback
    await tx.media.deleteMany({ where: { userId } });
    await tx.articleVote.deleteMany({ where: { userId } });
    await tx.comment.updateMany({
        where: {
            OR: [
                { userId },
                { parent: { userId } },
                { article: { authorId: userId } },
                { parent: { article: { authorId: userId } } },
            ],
        },
        data: { parentId: null },
    });
    await tx.comment.deleteMany({
        where: {
            OR: [{ userId }, { article: { authorId: userId } }],
        },
    });
    await tx.article.deleteMany({ where: { authorId: userId } });
    await tx.contentShortcut.deleteMany({ where: { authorId: userId } });
    await tx.feedback.deleteMany({ where: { userId } });

    // 3. EA, Licenses, Commands & Product Access
    await tx.eaCommand.deleteMany({
        where: { OR: [{ userId }, { tradingAccount: { userId } }] },
    });
    await tx.eADownload.deleteMany({ where: { userId } });
    await tx.eALicense.deleteMany({ where: { userId } });
    await tx.eAProductAccess.deleteMany({ where: { userId } });
    await tx.eAProductUsageEvent.deleteMany({ where: { userId } });

    // 4. IB, VIP, Pipeline, Loyalty & Competitions
    await tx.ibActivitySnapshot.deleteMany({
        where: { OR: [{ userId }, { tradingAccount: { userId } }] },
    });
    await tx.ibLead.updateMany({
        where: { tradingAccount: { userId } },
        data: { tradingAccountId: null },
    });
    await tx.ibLead.deleteMany({ where: { userId } });
    await tx.vipRequest.updateMany({
        where: { tradingAccount: { userId } },
        data: { tradingAccountId: null },
    });
    await tx.vipRequest.deleteMany({ where: { userId } });
    await tx.proEntitlement.updateMany({
        where: { qualifyingAccount: { userId } },
        data: { qualifyingAccountId: null },
    });
    await tx.proEntitlement.deleteMany({ where: { userId } });
    await tx.loyaltyClaim.deleteMany({ where: { userId } });
    await tx.competitionParticipant.deleteMany({
        where: { OR: [{ userId }, { tradingAccount: { userId } }] },
    });

    // 5. Unlink Profile.mainTradingAccountId before deleting TradingAccounts
    await tx.profile.updateMany({
        where: {
            OR: [{ userId }, { mainTradingAccount: { userId } }],
        },
        data: { mainTradingAccountId: null },
    });

    // 6. Trading Journals, Rules, Plans, Syncs, Snapshots, then TradingAccounts
    await tx.tradeRuleCheck.deleteMany({ where: { userId } });
    await tx.tradeCheckSnapshot.deleteMany({ where: { userId } });
    await tx.tradePlan.deleteMany({ where: { userId } });
    await tx.tradingRule.deleteMany({ where: { userId } });
    await tx.strategy.deleteMany({ where: { userId } });
    await tx.coachActionPlan.deleteMany({ where: { userId } });
    await tx.traderGoal.deleteMany({ where: { userId } });
    await tx.traderSignal.deleteMany({ where: { userId } });
    await tx.traderInsightSnapshot.deleteMany({ where: { userId } });
    await tx.tradingDayNote.deleteMany({ where: { userId } });
    await tx.improvementExperiment.deleteMany({ where: { userId } });
    await tx.tradingReport.deleteMany({ where: { userId } });
    await tx.journalEntry.deleteMany({
        where: { OR: [{ userId }, { tradingAccount: { userId } }] },
    });
    await tx.importHistory.deleteMany({
        where: { OR: [{ userId }, { tradingAccount: { userId } }] },
    });
    await tx.mt5ImportJob.deleteMany({
        where: { OR: [{ userId }, { tradingAccount: { userId } }] },
    });
    await tx.supportSyncTicket.deleteMany({
        where: { OR: [{ userId }, { tradingAccount: { userId } }] },
    });
    await tx.accountNotification.deleteMany({ where: { userId } });
    await tx.tradingAccount.deleteMany({ where: { userId } });

    // 7. AI, Gamification & Profile
    await tx.aiRequest.deleteMany({ where: { userId } });
    await tx.analyticsEvent.deleteMany({ where: { userId } });
    await tx.edgeEvent.deleteMany({ where: { userId } });
    await tx.certificate.deleteMany({ where: { userId } });
    await tx.challenge.deleteMany({
        where: { OR: [{ challengerId: userId }, { challengeeId: userId }] },
    });
    await tx.userBadge.deleteMany({ where: { userId } });
    await tx.userFollow.deleteMany({
        where: { OR: [{ followerId: userId }, { followingId: userId }] },
    });
    await tx.userProgress.deleteMany({ where: { userId } });
    await tx.userQuizAttempt.deleteMany({ where: { userId } });
    await tx.userSession.deleteMany({ where: { userId } });
    await tx.userMissionProgress.deleteMany({ where: { userId } });
    await tx.userDashboard.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.profile.deleteMany({ where: { userId } });

    // 8. Finally delete the User row
    await tx.user.delete({ where: { id: userId } });
}

export async function deleteUser(userId: string) {
    try {
        const { isAuthorized, user: admin } = await checkAdmin();
        if (!isAuthorized || !admin) {
            return { success: false, error: "Unauthorized" };
        }

        // Cannot delete self
        if (admin.id === userId) {
            return {
                success: false,
                error: "You cannot delete your own account",
            };
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true },
        });

        if (!targetUser) {
            return { success: false, error: "User not found" };
        }

        // Delete from Prisma with cascade transaction first so DB failure never orphans Auth
        await prisma.$transaction(async (tx) => {
            await performCascadeUserDelete(tx, userId);
        });

        // Delete from Supabase Auth
        const supabaseAdmin = getSupabaseAdmin();
        const { error: authError } =
            await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
            console.error("Supabase delete error:", authError);
        }

        // Audit log
        await prisma.auditLog.create({
            data: {
                adminId: admin.id,
                action: "USER_DELETED",
                targetType: "User",
                targetId: userId,
                details: { email: targetUser.email, name: targetUser.name },
            },
        });

        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("deleteUser error:", error);
        return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred" };
    }
}

// =============================================================================
// BULK DELETE USERS
// =============================================================================

export async function bulkDeleteUsers(userIds: string[]) {
    try {
        const { isAuthorized, user: admin } = await checkAdmin();
        if (!isAuthorized || !admin) {
            return { success: false, error: "Unauthorized" };
        }

        // Filter out own ID
        const safeIds = userIds.filter((id) => id !== admin.id);

        if (safeIds.length === 0) {
            return { success: false, error: "No valid users to delete" };
        }

        const supabaseAdmin = getSupabaseAdmin();
        let deleted = 0;

        for (const userId of safeIds) {
            try {
                await prisma.$transaction(async (tx) => {
                    await performCascadeUserDelete(tx, userId);
                });
                const { error: authError } =
                    await supabaseAdmin.auth.admin.deleteUser(userId);
                if (authError) {
                    console.error(`Supabase delete error for ${userId}:`, authError);
                }
                deleted++;
            } catch (err) {
                console.error(`Failed to delete user ${userId}:`, err);
            }
        }

        if (deleted === 0) {
            return { success: false, error: "Failed to delete selected users" };
        }

        // Audit log
        await prisma.auditLog.create({
            data: {
                adminId: admin.id,
                action: "USERS_BULK_DELETED",
                targetType: "User",
                targetId: "bulk",
                details: { count: deleted, ids: safeIds },
            },
        });

        revalidatePath("/admin/users");
        return { success: true, deleted };
    } catch (error) {
        console.error("bulkDeleteUsers error:", error);
        return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred" };
    }
}
