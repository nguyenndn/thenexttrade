import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { getAccountProAccess } from "@/lib/pro-access";
import { runVipPolicyReconciliation } from "./vip-policy.service";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        proEntitlement: {
            findMany: vi.fn(),
        },
        tradingAccount: {
            update: vi.fn(),
        },
        notification: {
            create: vi.fn(),
        },
    },
}));

vi.mock("@/lib/pro-access", () => ({
    getAccountProAccess: vi.fn(),
    FUNDING_RECHECK_DAYS: 30,
    FUNDING_GRACE_DAYS: 7,
    FUNDING_MIN_BALANCE: 200,
    normalizeUsdBalance: vi.fn(),
}));

describe("runVipPolicyReconciliation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete process.env.VIP_POLICY_ENABLED;
        vi.mocked(getAccountProAccess).mockResolvedValue({
            isPro: true,
            status: "ACTIVE",
            source: "IB_VERIFIED",
            expiresAt: null,
            policyState: "ACTIVE",
            fundingInfo: {
                verified: true,
                verifiedAt: new Date(),
                lastVerifiedAt: new Date(),
                graceUntil: null,
                amount: 500,
                inGrace: false,
                expired: false,
            },
        });
    });

    it("skips Demo, contest, evaluation, and trial accounts", async () => {
        vi.mocked(prisma.proEntitlement.findMany).mockResolvedValue([
            {
                id: "ent-live",
                tradingAccount: {
                    id: "acc-live",
                    userId: "user-1",
                    broker: "Vantage",
                    balance: 500,
                    currency: "USD",
                    server: "Vantage-Live",
                    accountType: "STANDARD",
                    status: "ACTIVE",
                    fundingVerifiedAt: null,
                    fundingLastVerifiedAt: null,
                    fundingGraceUntil: null,
                },
            },
            {
                id: "ent-demo",
                tradingAccount: {
                    id: "acc-demo",
                    userId: "user-1",
                    broker: "Vantage",
                    balance: 100000,
                    currency: "USD",
                    server: "Vantage-Demo",
                    accountType: "DEMO",
                    status: "ACTIVE",
                    fundingVerifiedAt: null,
                    fundingLastVerifiedAt: null,
                    fundingGraceUntil: null,
                },
            },
            {
                id: "ent-contest",
                tradingAccount: {
                    id: "acc-contest",
                    userId: "user-1",
                    broker: "Exness",
                    balance: 10000,
                    currency: "USD",
                    server: "Exness-Contest",
                    accountType: "STANDARD",
                    status: "ACTIVE",
                    fundingVerifiedAt: null,
                    fundingLastVerifiedAt: null,
                    fundingGraceUntil: null,
                },
            },
        ] as never);

        const result = await runVipPolicyReconciliation();

        expect(result.scannedCount).toBe(1);
        expect(getAccountProAccess).toHaveBeenCalledTimes(1);
        expect(getAccountProAccess).toHaveBeenCalledWith("user-1", "acc-live");
        expect(prisma.notification.create).not.toHaveBeenCalled();
    });
});
