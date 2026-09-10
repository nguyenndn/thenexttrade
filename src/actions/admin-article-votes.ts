"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";

export interface ArticleVoteAuditItem {
    articleId: string;
    articleTitle: string;
    articleSlug: string;
    voteCount: number;
    recentVoteCount24h: number;
    voters: Array<{
        voteId: string;
        userId: string;
        userEmail: string | null;
        userName: string | null;
        votedAt: Date;
    }>;
}

export interface ArticleVoteAuditResult {
    success: boolean;
    error?: string;
    totalVotes: number;
    votedArticlesCount: number;
    items: ArticleVoteAuditItem[];
}

export async function getArticleVoteAudit(): Promise<ArticleVoteAuditResult> {
    const user = await getAuthUser();
    if (!user) {
        return { success: false, error: "Unauthorized", totalVotes: 0, votedArticlesCount: 0, items: [] };
    }

    const adminProfile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });
    if (adminProfile?.role !== "ADMIN") {
        return { success: false, error: "Forbidden: Admin access required", totalVotes: 0, votedArticlesCount: 0, items: [] };
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Fetch all votes grouped by article
    const articlesWithVotes = await prisma.article.findMany({
        where: {
            votes: {
                some: {},
            },
        },
        select: {
            id: true,
            title: true,
            slug: true,
            _count: {
                select: { votes: true },
            },
            votes: {
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    userId: true,
                    createdAt: true,
                    user: {
                        select: {
                            email: true,
                            profile: {
                                select: { username: true },
                            },
                        },
                    },
                },
            },
        },
        orderBy: {
            votes: {
                _count: "desc",
            },
        },
    });

    const totalVotes = articlesWithVotes.reduce((acc, a) => acc + a._count.votes, 0);

    const items: ArticleVoteAuditItem[] = articlesWithVotes.map((art) => {
        const recentVotes = art.votes.filter((v) => new Date(v.createdAt) >= oneDayAgo).length;
        return {
            articleId: art.id,
            articleTitle: art.title,
            articleSlug: art.slug,
            voteCount: art._count.votes,
            recentVoteCount24h: recentVotes,
            voters: art.votes.map((v) => ({
                voteId: v.id,
                userId: v.userId,
                userEmail: v.user?.email || null,
                userName: v.user?.profile?.username || null,
                votedAt: v.createdAt,
            })),
        };
    });

    return {
        success: true,
        totalVotes,
        votedArticlesCount: items.length,
        items,
    };
}

export async function purgeArticleVotesAction(params: {
    articleId: string;
    voteId?: string;
    purgeAllForArticle?: boolean;
}): Promise<{ success: boolean; error?: string; count?: number }> {
    const user = await getAuthUser();
    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    const adminProfile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });
    if (adminProfile?.role !== "ADMIN") {
        return { success: false, error: "Forbidden: Admin access required" };
    }

    try {
        let deletedCount = 0;

        if (params.purgeAllForArticle) {
            const res = await prisma.articleVote.deleteMany({
                where: { articleId: params.articleId },
            });
            deletedCount = res.count;
        } else if (params.voteId) {
            await prisma.articleVote.delete({
                where: { id: params.voteId },
            });
            deletedCount = 1;
        }

        // Record audit log
        await prisma.auditLog.create({
            data: {
                adminId: user.id,
                action: "ARTICLE_VOTE_PURGE",
                targetType: "ArticleVote",
                targetId: params.articleId,
                details: {
                    articleId: params.articleId,
                    voteId: params.voteId || null,
                    purgeAllForArticle: !!params.purgeAllForArticle,
                    deletedCount,
                },
            },
        });

        revalidatePath("/admin/articles");
        revalidatePath(`/articles`);

        return { success: true, count: deletedCount };
    } catch (err: any) {
        console.error("Failed to purge article votes:", err);
        return { success: false, error: err.message || "Failed to purge votes" };
    }
}
