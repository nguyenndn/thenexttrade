import { describe, expect, it, vi, beforeEach } from "vitest";
import { getArticleVoteAudit, purgeArticleVotesAction } from "./admin-article-votes";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        profile: {
            findUnique: vi.fn(),
        },
        article: {
            findMany: vi.fn(),
        },
        articleVote: {
            deleteMany: vi.fn(),
            delete: vi.fn(),
        },
        auditLog: {
            create: vi.fn(),
        },
    },
}));

vi.mock("@/lib/auth-cache", () => ({
    getAuthUser: vi.fn(),
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

describe("admin-article-votes server actions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getArticleVoteAudit", () => {
        it("returns unauthorized if user is not authenticated", async () => {
            vi.mocked(getAuthUser).mockResolvedValue(null);

            const result = await getArticleVoteAudit();
            expect(result.success).toBe(false);
            expect(result.error).toBe("Unauthorized");
        });

        it("returns forbidden if user role is not ADMIN", async () => {
            vi.mocked(getAuthUser).mockResolvedValue({ id: "user-123" } as any);
            vi.mocked(prisma.profile.findUnique).mockResolvedValue({ role: "USER" } as any);

            const result = await getArticleVoteAudit();
            expect(result.success).toBe(false);
            expect(result.error).toContain("Forbidden");
        });

        it("returns audited articles and calculated totals for admin", async () => {
            vi.mocked(getAuthUser).mockResolvedValue({ id: "admin-1" } as any);
            vi.mocked(prisma.profile.findUnique).mockResolvedValue({ role: "ADMIN" } as any);

            const mockArticles = [
                {
                    id: "art-1",
                    title: "ICT Silver Bullet Guide",
                    slug: "ict-silver-bullet-guide",
                    _count: { votes: 3 },
                    votes: [
                        {
                            id: "vote-1",
                            userId: "trader-1",
                            createdAt: new Date(),
                            user: {
                                email: "trader1@example.com",
                                profile: { username: "trader_one" },
                            },
                        },
                        {
                            id: "vote-2",
                            userId: "trader-2",
                            createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
                            user: {
                                email: "trader2@example.com",
                                profile: { username: "trader_two" },
                            },
                        },
                    ],
                },
            ];

            vi.mocked(prisma.article.findMany).mockResolvedValue(mockArticles as any);

            const result = await getArticleVoteAudit();
            expect(result.success).toBe(true);
            expect(result.totalVotes).toBe(3);
            expect(result.votedArticlesCount).toBe(1);
            expect(result.items[0].articleTitle).toBe("ICT Silver Bullet Guide");
            expect(result.items[0].recentVoteCount24h).toBe(1);
            expect(result.items[0].voters).toHaveLength(2);
        });
    });

    describe("purgeArticleVotesAction", () => {
        it("blocks unauthorized callers", async () => {
            vi.mocked(getAuthUser).mockResolvedValue(null);

            const result = await purgeArticleVotesAction({ articleId: "art-1" });
            expect(result.success).toBe(false);
            expect(result.error).toBe("Unauthorized");
        });

        it("purges all votes for an article and writes AuditLog", async () => {
            vi.mocked(getAuthUser).mockResolvedValue({ id: "admin-1" } as any);
            vi.mocked(prisma.profile.findUnique).mockResolvedValue({ role: "ADMIN" } as any);
            vi.mocked(prisma.articleVote.deleteMany).mockResolvedValue({ count: 5 } as any);
            vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: "audit-1" } as any);

            const result = await purgeArticleVotesAction({
                articleId: "art-1",
                purgeAllForArticle: true,
            });

            expect(result.success).toBe(true);
            expect(result.count).toBe(5);
            expect(prisma.articleVote.deleteMany).toHaveBeenCalledWith({
                where: { articleId: "art-1" },
            });
            expect(prisma.auditLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        adminId: "admin-1",
                        action: "ARTICLE_VOTE_PURGE",
                        targetType: "ArticleVote",
                        targetId: "art-1",
                    }),
                })
            );
        });

        it("purges a single vote by voteId", async () => {
            vi.mocked(getAuthUser).mockResolvedValue({ id: "admin-1" } as any);
            vi.mocked(prisma.profile.findUnique).mockResolvedValue({ role: "ADMIN" } as any);
            vi.mocked(prisma.articleVote.delete).mockResolvedValue({ id: "vote-1" } as any);
            vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: "audit-2" } as any);

            const result = await purgeArticleVotesAction({
                articleId: "art-1",
                voteId: "vote-1",
            });

            expect(result.success).toBe(true);
            expect(result.count).toBe(1);
            expect(prisma.articleVote.delete).toHaveBeenCalledWith({
                where: { id: "vote-1" },
            });
        });
    });
});
