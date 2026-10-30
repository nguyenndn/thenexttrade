import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { getJournalEntries } from "./journal";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        journalEntry: {
            findMany: vi.fn(),
            count: vi.fn(),
            aggregate: vi.fn(),
            groupBy: vi.fn(),
        },
    },
}));

vi.mock("@/lib/auth-cache", () => ({
    getAuthUser: vi.fn(),
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

vi.mock("@/lib/experiments/progress.server", () => ({
    onUserTradesUpdated: vi.fn().mockResolvedValue(undefined),
}));

describe("Journal Actions - Backend Logic & Edge Case Stress Testing", () => {
    const mockUser = {
        id: "user-challenger-1",
        email: "challenger@example.com",
    };

    const defaultFindManyResponse = [
        {
            id: "entry-1",
            userId: mockUser.id,
            accountId: "acc-1",
            symbol: "EURUSD",
            type: "BUY",
            status: "CLOSED",
            result: "WIN",
            pnl: 150,
            lotSize: 1.0,
            commission: -5,
            swap: -2,
            entryDate: new Date("2026-10-01T10:00:00Z"),
            exitDate: new Date("2026-10-01T11:00:00Z"),
            createdAt: new Date("2026-10-01T10:00:00Z"),
            updatedAt: new Date("2026-10-01T11:00:00Z"),
            syncedAt: null,
            mistakes: [],
            account: { name: "Live MT5", color: "#10b981", accountType: "REAL", timezone: "UTC" },
            tradePlan: null,
            ruleChecks: [],
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (getAuthUser as any).mockResolvedValue(mockUser);
        (prisma.journalEntry.findMany as any).mockResolvedValue(defaultFindManyResponse);
        (prisma.journalEntry.count as any).mockResolvedValue(1);
        (prisma.journalEntry.aggregate as any).mockResolvedValue({
            _sum: { pnl: 150, swap: -2, commission: -5, lotSize: 1.0 },
        });
        (prisma.journalEntry.groupBy as any).mockResolvedValue([
            { result: "WIN", _count: 1 },
        ]);
    });

    describe("Authentication & Authorization", () => {
        it("returns empty result when user is not authenticated", async () => {
            (getAuthUser as any).mockResolvedValue(null);

            const result = await getJournalEntries(1, 20);

            expect(result.entries).toEqual([]);
            expect(result.meta.total).toBe(0);
            expect(prisma.journalEntry.findMany).not.toHaveBeenCalled();
        });

        it("always binds query to authenticated user's ID preventing IDOR", async () => {
            await getJournalEntries(1, 20, { accountId: "attacker-target-acc" });

            expect(prisma.journalEntry.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        userId: mockUser.id,
                        accountId: "attacker-target-acc",
                    }),
                })
            );
        });
    });

    describe("accountId Filter Stress Testing", () => {
        it('omits accountId in where clause when accountId is "all"', async () => {
            await getJournalEntries(1, 20, { accountId: "all" });

            const callArgs = (prisma.journalEntry.findMany as any).mock.calls[0][0];
            expect(callArgs.where.userId).toBe(mockUser.id);
            expect(callArgs.where.accountId).toBeUndefined();
        });

        it("omits accountId in where clause when accountId is empty string", async () => {
            await getJournalEntries(1, 20, { accountId: "" });

            const callArgs = (prisma.journalEntry.findMany as any).mock.calls[0][0];
            expect(callArgs.where.userId).toBe(mockUser.id);
            expect(callArgs.where.accountId).toBeUndefined();
        });

        it("omits accountId in where clause when accountId is undefined", async () => {
            await getJournalEntries(1, 20, {});

            const callArgs = (prisma.journalEntry.findMany as any).mock.calls[0][0];
            expect(callArgs.where.userId).toBe(mockUser.id);
            expect(callArgs.where.accountId).toBeUndefined();
        });

        it("filters by specific accountId when a valid CUID is provided", async () => {
            const validCuid = "clh7xyz89000108l4gh12abcd";
            await getJournalEntries(1, 20, { accountId: validCuid });

            const callArgs = (prisma.journalEntry.findMany as any).mock.calls[0][0];
            expect(callArgs.where.accountId).toBe(validCuid);
        });

        it("safely binds hostile/SQL injection strings as literal where.accountId values", async () => {
            const hostilePayload = "' OR '1'='1' -- DROP TABLE users;";
            await getJournalEntries(1, 20, { accountId: hostilePayload });

            const callArgs = (prisma.journalEntry.findMany as any).mock.calls[0][0];
            expect(callArgs.where.accountId).toBe(hostilePayload);
            expect(callArgs.where.userId).toBe(mockUser.id);
        });
    });

    describe("sortBy Whitelist & Injection Defense", () => {
        const allowedFields = [
            "entryDate",
            "exitDate",
            "profit",
            "lots",
            "symbol",
            "pnl",
            "createdAt",
        ];

        it.each(allowedFields)(
            "accepts allowed sortBy field: %s with default desc ordering",
            async (sortField) => {
                await getJournalEntries(1, 20, { sortBy: sortField });

                const callArgs = (prisma.journalEntry.findMany as any).mock.calls[0][0];
                expect(callArgs.orderBy).toEqual({ [sortField]: "desc" });
            }
        );

        it("maps legacy aliases to appropriate whitelisted fields", async () => {
            // date -> entryDate
            await getJournalEntries(1, 20, { sortBy: "date" });
            expect((prisma.journalEntry.findMany as any).mock.calls[0][0].orderBy).toEqual({
                entryDate: "desc",
            });

            // openTime -> entryDate
            await getJournalEntries(1, 20, { sortBy: "openTime" });
            expect((prisma.journalEntry.findMany as any).mock.calls[1][0].orderBy).toEqual({
                entryDate: "desc",
            });

            // closeTime -> exitDate
            await getJournalEntries(1, 20, { sortBy: "closeTime" });
            expect((prisma.journalEntry.findMany as any).mock.calls[2][0].orderBy).toEqual({
                exitDate: "desc",
            });
        });

        const hostileSortFields = [
            ["prototype pollution __proto__", "__proto__"],
            ["prototype constructor", "constructor"],
            ["sensitive field password", "password"],
            ["SQL injection DROP TABLE", "DROP TABLE users"],
            ["SQL injection stacked query", "1; DROP TABLE users;"],
            ["sensitive field email", "email"],
            ["id column bypass", "id"],
            ["userId column bypass", "userId"],
            ["arbitrary unknown property", "nonExistentField"],
            ["empty string", ""],
            ["whitespace string", "   "],
        ];

        it.each(hostileSortFields)(
            "falls back safely to entryDate for hostile/unwhitelisted sortBy: %s (%s)",
            async (_, hostileInput) => {
                await getJournalEntries(1, 20, { sortBy: hostileInput });

                const callArgs = (prisma.journalEntry.findMany as any).mock.calls[0][0];
                expect(callArgs.orderBy).toEqual({ entryDate: "desc" });
            }
        );

        it("defaults to entryDate when sortBy is undefined", async () => {
            await getJournalEntries(1, 20, {});

            const callArgs = (prisma.journalEntry.findMany as any).mock.calls[0][0];
            expect(callArgs.orderBy).toEqual({ entryDate: "desc" });
        });
    });

    describe("sortOrder Stress Testing", () => {
        it('accepts valid "asc" order', async () => {
            await getJournalEntries(1, 20, { sortBy: "pnl", sortOrder: "asc" });

            const callArgs = (prisma.journalEntry.findMany as any).mock.calls[0][0];
            expect(callArgs.orderBy).toEqual({ pnl: "asc" });
        });

        it('accepts valid "desc" order', async () => {
            await getJournalEntries(1, 20, { sortBy: "pnl", sortOrder: "desc" });

            const callArgs = (prisma.journalEntry.findMany as any).mock.calls[0][0];
            expect(callArgs.orderBy).toEqual({ pnl: "desc" });
        });

        it('defaults safely to "desc" when sortOrder is arbitrary or invalid', async () => {
            await getJournalEntries(1, 20, {
                sortBy: "pnl",
                sortOrder: "INVALID_ORDER; DROP TABLE" as any,
            });

            const callArgs = (prisma.journalEntry.findMany as any).mock.calls[0][0];
            expect(callArgs.orderBy).toEqual({ pnl: "desc" });
        });

        it('defaults safely to "desc" when sortOrder is undefined', async () => {
            await getJournalEntries(1, 20, { sortBy: "pnl", sortOrder: undefined });

            const callArgs = (prisma.journalEntry.findMany as any).mock.calls[0][0];
            expect(callArgs.orderBy).toEqual({ pnl: "desc" });
        });
    });
});
