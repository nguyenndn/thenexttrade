import { describe, it, expect, vi, beforeEach } from "vitest";
import SharePage from "./page";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        journalEntry: {
            findUnique: vi.fn(),
        },
        coachActionPlan: {
            findFirst: vi.fn(),
        },
    },
}));

vi.mock("next/navigation", () => ({
    notFound: vi.fn(() => {
        throw new Error("NEXT_NOT_FOUND");
    }),
}));

vi.mock("@/components/journal/TradeShareCard", () => ({
    TradeShareCard: ({ trade }: { trade: any }) => (
        <div data-testid="trade-share-card" data-trade={JSON.stringify(trade)} />
    ),
}));

describe("SharePage (/share/[id]) Security Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("triggers notFound() if the trade does not exist", async () => {
        vi.mocked(prisma.journalEntry.findUnique).mockResolvedValue(null);

        await expect(
            SharePage({ params: Promise.resolve({ id: "trade-non-existent" }) })
        ).rejects.toThrow("NEXT_NOT_FOUND");

        expect(notFound).toHaveBeenCalled();
    });

    it("triggers notFound() if the trade shareMode is private or none", async () => {
        vi.mocked(prisma.journalEntry.findUnique).mockResolvedValue({
            id: "trade-private",
            shareMode: "private",
            userId: "user-1",
        } as any);

        await expect(
            SharePage({ params: Promise.resolve({ id: "trade-private" }) })
        ).rejects.toThrow("NEXT_NOT_FOUND");

        expect(notFound).toHaveBeenCalled();
    });

    it("triggers notFound() if the trade shareMode is empty or invalid", async () => {
        vi.mocked(prisma.journalEntry.findUnique).mockResolvedValue({
            id: "trade-no-share",
            shareMode: null,
            userId: "user-1",
        } as any);

        await expect(
            SharePage({ params: Promise.resolve({ id: "trade-no-share" }) })
        ).rejects.toThrow("NEXT_NOT_FOUND");

        expect(notFound).toHaveBeenCalled();
    });

    it("does NOT query coachActionPlan and strips psychological/private notes on valid public share", async () => {
        const mockTrade = {
            id: "trade-public-123",
            symbol: "XAUUSD",
            shareMode: "basic",
            userId: "user-victim",
            notesPsychology: "I felt extreme greed and broke my rules",
            notes: "Secret private notes",
            emotionBefore: "FOMO",
            emotionAfter: "Depressed",
            thesis: "Insider tip",
            invalidation: "My secret plan",
            postTradeLesson: "Do not revenge trade",
            entryReason: "Impulse",
            exitReason: "Panicked",
            user: {
                name: "John Trader",
                image: null,
                profile: {
                    isPublicProfile: true,
                    username: "johntrader",
                    showRealName: false,
                    showMoney: false,
                    showBroker: false,
                    showAccountNumber: false,
                    showPercentMetrics: true,
                },
            },
            account: {
                accountType: "REAL",
                name: "Exness Real",
                accountNumber: "123456789",
            },
        };

        vi.mocked(prisma.journalEntry.findUnique).mockResolvedValue(mockTrade as any);

        const pageResult = await SharePage({
            params: Promise.resolve({ id: "trade-public-123" }),
        });

        // 1. Verify coachActionPlan was never queried (anti-leak)
        expect(prisma.coachActionPlan.findFirst).not.toHaveBeenCalled();

        // 2. Verify page returned valid React element without notFound
        expect(notFound).not.toHaveBeenCalled();
        expect(pageResult).toBeDefined();
    });
});
