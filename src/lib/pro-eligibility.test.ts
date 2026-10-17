import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
    getAccountProEligibility,
    getAccountsProEligibility,
} from "./pro-eligibility";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        tradingAccount: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
        },
        proEntitlement: {
            findFirst: vi.fn(),
            update: vi.fn().mockReturnValue({ catch: vi.fn() }),
        },
        eABroker: {
            findMany: vi.fn(),
        },
    },
}));

describe("Pro Eligibility Service", () => {
    const userId = "test-user-eligibility";
    const supportedBrokers = [
        { name: "Exness", slug: "exness", isVipEligible: true },
        { name: "Vantage", slug: "vantage", isVipEligible: true },
        { name: "RandomBroker", slug: "random", isVipEligible: false },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (prisma.eABroker.findMany as any).mockResolvedValue(supportedBrokers);
    });

    describe("getAccountProEligibility", () => {
        it("returns MISSING_ACCOUNT_INFO if account is not found", async () => {
            (prisma.tradingAccount.findFirst as any).mockResolvedValue(null);

            const result = await getAccountProEligibility("non-existent-acc", userId);
            expect(result.status).toBe("MISSING_ACCOUNT_INFO");
            expect(result.canRequest).toBe(false);
        });

        it("returns PRO_ACTIVE when account has an active direct proEntitlement", async () => {
            (prisma.tradingAccount.findFirst as any).mockResolvedValue({
                id: "acc-1",
                broker: "Exness",
                accountNumber: "12345",
                proEntitlement: { id: "ent-1", status: "ACTIVE" },
                vipRequests: [],
            });

            const result = await getAccountProEligibility("acc-1", userId);
            expect(result.status).toBe("PRO_ACTIVE");
            expect(result.canRequest).toBe(false);
            expect(result.proEntitlementId).toBe("ent-1");
        });

        it("auto-links and returns PRO_ACTIVE when account matches an unlinked approved Pro record", async () => {
            (prisma.tradingAccount.findFirst as any).mockResolvedValue({
                id: "acc-unlinked-match",
                broker: "UltimaMarkets",
                accountNumber: "924399",
                proEntitlement: null,
                vipRequests: [],
            });

            (prisma.proEntitlement.findFirst as any).mockResolvedValue({
                id: "unlinked-ent-123",
                status: "ACTIVE",
            });

            const result = await getAccountProEligibility("acc-unlinked-match", userId);

            expect(result.status).toBe("PRO_ACTIVE");
            expect(result.proEntitlementId).toBe("unlinked-ent-123");
            expect(prisma.proEntitlement.update).toHaveBeenCalledWith({
                where: { id: "unlinked-ent-123" },
                data: { tradingAccountId: "acc-unlinked-match" },
            });
        });

        it("returns PRO_ACTIVE when user has a global admin entitlement", async () => {
            (prisma.tradingAccount.findFirst as any).mockResolvedValue({
                id: "acc-free-2",
                broker: "Exness",
                accountNumber: "667788",
                proEntitlement: null,
                vipRequests: [],
            });

            // No unlinked match for this account number
            (prisma.proEntitlement.findFirst as any)
                .mockResolvedValueOnce(null) // unlinkedMatch
                .mockResolvedValueOnce({
                    id: "global-admin-ent",
                    status: "ACTIVE",
                }); // globalEntitlement

            const result = await getAccountProEligibility("acc-free-2", userId);
            expect(result.status).toBe("PRO_ACTIVE");
            expect(result.proEntitlementId).toBe("global-admin-ent");
        });

        it("returns PENDING_REVIEW when account has a pending VIP request", async () => {
            (prisma.tradingAccount.findFirst as any).mockResolvedValue({
                id: "acc-pending",
                broker: "Exness",
                accountNumber: "112233",
                proEntitlement: null,
                vipRequests: [{ id: "req-pending-1", status: "PENDING" }],
            });

            (prisma.proEntitlement.findFirst as any)
                .mockResolvedValueOnce(null) // unlinkedMatch
                .mockResolvedValueOnce(null); // globalEntitlement

            const result = await getAccountProEligibility("acc-pending", userId);
            expect(result.status).toBe("PENDING_REVIEW");
            expect(result.canRequest).toBe(false);
            expect(result.vipRequestId).toBe("req-pending-1");
        });

        it("returns REJECTED when account latest VIP request was rejected", async () => {
            (prisma.tradingAccount.findFirst as any).mockResolvedValue({
                id: "acc-rejected",
                broker: "Exness",
                accountNumber: "112233",
                proEntitlement: null,
                vipRequests: [
                    {
                        id: "req-rejected-1",
                        status: "REJECTED",
                        rejectReason: "Incorrect broker account number",
                    },
                ],
            });

            (prisma.proEntitlement.findFirst as any)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);

            const result = await getAccountProEligibility("acc-rejected", userId);
            expect(result.status).toBe("REJECTED");
            expect(result.canRequest).toBe(true);
            expect(result.rejectReason).toBe("Incorrect broker account number");
        });

        it("returns ELIGIBLE when account broker is supported for VIP and has no pending requests", async () => {
            (prisma.tradingAccount.findFirst as any).mockResolvedValue({
                id: "acc-eligible",
                broker: "Exness",
                accountNumber: "555666",
                proEntitlement: null,
                vipRequests: [],
            });

            (prisma.proEntitlement.findFirst as any)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);

            const result = await getAccountProEligibility("acc-eligible", userId);
            expect(result.status).toBe("ELIGIBLE");
            expect(result.canRequest).toBe(true);
            expect(result.brokerSupported).toBe(true);
        });

        it("returns UNSUPPORTED_BROKER when account broker is not in VIP broker list", async () => {
            (prisma.tradingAccount.findFirst as any).mockResolvedValue({
                id: "acc-unsupported",
                broker: "SomeUnknownBroker",
                accountNumber: "777888",
                proEntitlement: null,
                vipRequests: [],
            });

            (prisma.proEntitlement.findFirst as any)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);

            const result = await getAccountProEligibility("acc-unsupported", userId);
            expect(result.status).toBe("UNSUPPORTED_BROKER");
            expect(result.canRequest).toBe(false);
            expect(result.brokerSupported).toBe(false);
        });
    });

    describe("getAccountsProEligibility (batch)", () => {
        it("returns eligibility for all accounts of a user", async () => {
            (prisma.tradingAccount.findMany as any).mockResolvedValue([
                { id: "acc-1" },
                { id: "acc-2" },
            ]);

            (prisma.proEntitlement.findFirst as any).mockResolvedValue(null);

            (prisma.tradingAccount.findFirst as any)
                .mockResolvedValueOnce({
                    id: "acc-1",
                    broker: "Exness",
                    accountNumber: "111",
                    proEntitlement: { id: "ent-1", status: "ACTIVE" },
                    vipRequests: [],
                })
                .mockResolvedValueOnce({
                    id: "acc-2",
                    broker: "Exness",
                    accountNumber: "222",
                    proEntitlement: null,
                    vipRequests: [],
                });

            const results = await getAccountsProEligibility(userId);
            expect(results["acc-1"]?.status).toBe("PRO_ACTIVE");
            expect(results["acc-2"]?.status).toBe("ELIGIBLE");
        });
    });
});
