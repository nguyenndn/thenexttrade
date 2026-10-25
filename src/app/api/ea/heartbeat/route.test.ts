import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { resolveSyncAuth } from "@/lib/sync-auth";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        tradingAccount: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            create: vi.fn(),
        },
        proEntitlement: {
            upsert: vi.fn(),
            update: vi.fn(),
        },
        eAProduct: {
            findFirst: vi.fn(),
        },
        eAProductAccess: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            upsert: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
        },
        eAProductUsageEvent: {
            findFirst: vi.fn(),
            create: vi.fn(),
        },
        tradingAccountCapitalSnapshot: {
            create: vi.fn(),
        },
        eABroker: {
            findMany: vi.fn(),
        },
        eALicense: {
            findFirst: vi.fn(),
        },
        profile: {
            findMany: vi.fn(),
        },
        notification: {
            createMany: vi.fn(),
        },
    },
}));

vi.mock("@/lib/sync-auth", () => ({
    resolveSyncAuth: vi.fn(),
}));

describe("POST /api/ea/heartbeat security & telemetry", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(prisma.eABroker.findMany).mockResolvedValue([
            { name: "Vantage", slug: "vantage" },
            { name: "Exness", slug: "exness" },
        ] as any);
        vi.mocked(prisma.eALicense.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.profile.findMany).mockResolvedValue([]);
    });

    it("does NOT grant Pro or set funding for an untrusted heartbeat at >= $200", async () => {
        vi.mocked(resolveSyncAuth).mockResolvedValue({
            success: true,
            data: {
                user: { id: "user-123" } as any,
                account: {
                    id: "acct-123",
                    accountNumber: "1001",
                    autoSync: true,
                } as any,
                authMode: "LEGACY_ACCOUNT_KEY",
            },
        });

        // Account is currently unverified
        vi.mocked(prisma.tradingAccount.findUnique).mockResolvedValue({
            id: "acct-123",
            timezone: "UTC",
            fundingVerifiedAt: null,
            fundingGraceUntil: null,
            broker: "Vantage Markets",
            ibAttribution: "UNVERIFIED",
        } as any);

        vi.mocked(prisma.tradingAccount.update).mockResolvedValue({} as any);

        const req = new NextRequest("http://localhost/api/ea/heartbeat", {
            method: "POST",
            body: JSON.stringify({
                eaVersion: "1.0",
                accountNumber: "1001",
                balance: 5000,
                equity: 5000,
                accountTradeMode: "REAL",
                broker: "Vantage",
                server: "Vantage-Live",
                currency: "USD",
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);

        // Security assertion 1: proEntitlement.upsert must NEVER be called from heartbeat
        expect(prisma.proEntitlement.upsert).not.toHaveBeenCalled();

        // Security assertion 2: an untrusted heartbeat must NOT establish funding.
        expect(prisma.tradingAccount.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: "acct-123" },
                data: expect.not.objectContaining({
                    fundingVerifiedAt: expect.anything(),
                    fundingAmount: expect.anything(),
                }),
            })
        );

        expect(prisma.tradingAccount.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ accountType: "REAL" }),
            })
        );
    });

    it("keeps a low-balance REAL account connected as Free instead of returning 403", async () => {
        vi.mocked(resolveSyncAuth).mockResolvedValue({
            success: true,
            data: {
                user: { id: "user-123" } as any,
                account: {
                    id: "acct-123",
                    accountNumber: "1001",
                    autoSync: true,
                } as any,
                authMode: "LEGACY_ACCOUNT_KEY",
            },
        });

        vi.mocked(prisma.tradingAccount.findUnique).mockResolvedValue({
            id: "acct-123",
            timezone: "UTC",
            fundingVerifiedAt: null,
            fundingGraceUntil: null,
            broker: "Vantage Markets",
            ibAttribution: "UNVERIFIED",
        } as any);

        vi.mocked(prisma.tradingAccount.update).mockResolvedValue({} as any);

        const req = new NextRequest("http://localhost/api/ea/heartbeat", {
            method: "POST",
            body: JSON.stringify({
                eaVersion: "1.0",
                accountNumber: "1001",
                balance: 150,
                equity: 150,
                accountTradeMode: "REAL",
                broker: "Vantage",
                server: "Vantage-Live",
                currency: "USD",
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.balanceEligible).toBe(false);
        expect(data.vipEligible).toBe(false);
        expect(data.minBalanceRequired).toBe(200);
    });

    it("establishes funding at $200 only for an IB-verified trusted account", async () => {
        vi.mocked(resolveSyncAuth).mockResolvedValue({
            success: true,
            data: {
                user: { id: "user-123", email: "a@example.com", name: "A" },
                account: {
                    id: "acct-123",
                    accountNumber: "1001",
                    autoSync: true,
                } as any,
                authMode: "LEGACY_ACCOUNT_KEY",
            },
        });

        vi.mocked(prisma.tradingAccount.findUnique).mockResolvedValue({
            id: "acct-123",
            timezone: "UTC",
            fundingVerifiedAt: null,
            fundingGraceUntil: null,
            broker: "Vantage Markets",
            ibAttribution: "VERIFIED",
        } as any);
        vi.mocked(prisma.tradingAccount.update).mockResolvedValue({} as any);

        const req = new NextRequest("http://localhost/api/ea/heartbeat", {
            method: "POST",
            body: JSON.stringify({
                accountNumber: "1001",
                balance: 200,
                equity: 200,
                accountTradeMode: "REAL",
                broker: "Vantage",
                server: "Vantage-Live",
                currency: "USD",
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.balanceEligible).toBe(true);
        expect(prisma.tradingAccount.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    fundingVerifiedAt: expect.any(Date),
                    fundingAmount: 200,
                    fundingLastVerifiedAt: expect.any(Date),
                    fundingGraceUntil: null,
                }),
            })
        );
    });

    it("does not let a heartbeat payload replace an ineligible stored broker", async () => {
        vi.mocked(resolveSyncAuth).mockResolvedValue({
            success: true,
            data: {
                user: { id: "user-123", email: "a@example.com", name: "A" },
                account: {
                    id: "acct-123",
                    accountNumber: "1001",
                    autoSync: true,
                } as any,
                authMode: "LEGACY_ACCOUNT_KEY",
            },
        });

        vi.mocked(prisma.tradingAccount.findUnique).mockResolvedValue({
            id: "acct-123",
            timezone: "UTC",
            fundingVerifiedAt: null,
            fundingGraceUntil: null,
            broker: "RandomBroker",
            ibAttribution: "VERIFIED",
        } as any);
        vi.mocked(prisma.tradingAccount.update).mockResolvedValue({} as any);

        const req = new NextRequest("http://localhost/api/ea/heartbeat", {
            method: "POST",
            body: JSON.stringify({
                accountNumber: "1001",
                balance: 5000,
                equity: 5000,
                accountTradeMode: "REAL",
                broker: "Vantage",
                server: "Vantage-Live",
                currency: "USD",
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.balanceEligible).toBe(false);
        expect(prisma.tradingAccount.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.not.objectContaining({
                    broker: expect.anything(),
                    fundingVerifiedAt: expect.anything(),
                    fundingAmount: expect.anything(),
                }),
            })
        );
    });

    it("does not trust an approved license issued for a different broker", async () => {
        vi.mocked(resolveSyncAuth).mockResolvedValue({
            success: true,
            data: {
                user: { id: "user-123", email: "a@example.com", name: "A" },
                account: {
                    id: "acct-123",
                    accountNumber: "1001",
                    autoSync: true,
                } as any,
                authMode: "LEGACY_ACCOUNT_KEY",
            },
        });

        vi.mocked(prisma.tradingAccount.findUnique).mockResolvedValue({
            id: "acct-123",
            timezone: "UTC",
            fundingVerifiedAt: null,
            fundingGraceUntil: null,
            broker: "Vantage Markets",
            ibAttribution: "UNVERIFIED",
        } as any);
        vi.mocked(prisma.eALicense.findFirst).mockResolvedValue({
            id: "license-1",
            broker: "Exness",
        } as any);
        vi.mocked(prisma.tradingAccount.update).mockResolvedValue({} as any);

        const req = new NextRequest("http://localhost/api/ea/heartbeat", {
            method: "POST",
            body: JSON.stringify({
                accountNumber: "1001",
                balance: 5000,
                equity: 5000,
                accountTradeMode: "REAL",
                broker: "Vantage",
                server: "Vantage-Live",
                currency: "USD",
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.balanceEligible).toBe(false);
        expect(prisma.tradingAccount.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.not.objectContaining({
                    fundingVerifiedAt: expect.anything(),
                    fundingAmount: expect.anything(),
                }),
            })
        );
    });

    it("does not let a heartbeat payload promote a stored demo account to REAL", async () => {
        vi.mocked(resolveSyncAuth).mockResolvedValue({
            success: true,
            data: {
                user: { id: "user-123", email: "a@example.com", name: "A" },
                account: {
                    id: "acct-123",
                    accountNumber: "1001",
                    autoSync: true,
                } as any,
                authMode: "LEGACY_ACCOUNT_KEY",
            },
        });

        vi.mocked(prisma.tradingAccount.findUnique).mockResolvedValue({
            id: "acct-123",
            timezone: "UTC",
            fundingVerifiedAt: null,
            fundingGraceUntil: null,
            broker: "Vantage Markets",
            server: "Vantage-Demo",
            accountType: "PERSONAL",
            ibAttribution: "VERIFIED",
        } as any);
        vi.mocked(prisma.tradingAccount.update).mockResolvedValue({} as any);

        const req = new NextRequest("http://localhost/api/ea/heartbeat", {
            method: "POST",
            body: JSON.stringify({
                accountNumber: "1001",
                balance: 5000,
                equity: 5000,
                accountTradeMode: "REAL",
                broker: "Vantage",
                server: "Vantage-Live",
                currency: "USD",
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.balanceEligible).toBe(false);
        expect(prisma.tradingAccount.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.not.objectContaining({
                    server: expect.anything(),
                    accountType: "REAL",
                    fundingVerifiedAt: expect.anything(),
                }),
            })
        );
        expect(prisma.tradingAccount.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ accountType: "PERSONAL" }),
            })
        );
        expect(
            prisma.tradingAccountCapitalSnapshot.create
        ).not.toHaveBeenCalled();
    });

    it.each([
        {
            label: "evaluation",
            server: "Vantage-Evaluation",
            broker: "Vantage",
        },
        {
            label: "trial",
            server: "Vantage-Live",
            broker: "Exness-Trial",
        },
    ])(
        "does not treat an explicit REAL mode with a $label marker as a live account",
        async ({ server, broker }) => {
            vi.mocked(resolveSyncAuth).mockResolvedValue({
                success: true,
                data: {
                    user: {
                        id: "user-123",
                        email: "a@example.com",
                        name: "A",
                    },
                    account: {
                        id: "acct-123",
                        accountNumber: "1001",
                        autoSync: true,
                    } as any,
                    authMode: "LEGACY_ACCOUNT_KEY",
                },
            });

            vi.mocked(prisma.tradingAccount.findUnique).mockResolvedValue({
                id: "acct-123",
                timezone: "UTC",
                fundingVerifiedAt: null,
                fundingGraceUntil: null,
                broker: "Vantage Markets",
                server: "Vantage-Live",
                accountType: "PERSONAL",
                ibAttribution: "VERIFIED",
            } as any);
            vi.mocked(prisma.tradingAccount.update).mockResolvedValue(
                {} as any
            );

            const req = new NextRequest(
                "http://localhost/api/ea/heartbeat",
                {
                    method: "POST",
                    body: JSON.stringify({
                        accountNumber: "1001",
                        balance: 5000,
                        equity: 5000,
                        accountTradeMode: 2,
                        broker,
                        server,
                        currency: "USD",
                    }),
                }
            );

            const res = await POST(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.balanceEligible).toBe(false);
            expect(prisma.tradingAccount.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ accountType: "DEMO" }),
                })
            );
            expect(prisma.tradingAccount.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.not.objectContaining({
                        fundingVerifiedAt: expect.anything(),
                        fundingAmount: expect.anything(),
                    }),
                })
            );
            expect(
                prisma.tradingAccountCapitalSnapshot.create
            ).not.toHaveBeenCalled();
        }
    );

    it("establishes funding for an approved license on the matching broker", async () => {
        vi.mocked(resolveSyncAuth).mockResolvedValue({
            success: true,
            data: {
                user: { id: "user-123", email: "a@example.com", name: "A" },
                account: {
                    id: "acct-123",
                    accountNumber: "1001",
                    autoSync: true,
                } as any,
                authMode: "LEGACY_ACCOUNT_KEY",
            },
        });

        vi.mocked(prisma.tradingAccount.findUnique).mockResolvedValue({
            id: "acct-123",
            timezone: "UTC",
            fundingVerifiedAt: null,
            fundingGraceUntil: null,
            broker: "Vantage Markets",
            ibAttribution: "UNVERIFIED",
        } as any);
        vi.mocked(prisma.eALicense.findFirst).mockResolvedValue({
            id: "license-1",
            broker: "Vantage",
        } as any);
        vi.mocked(prisma.tradingAccount.update).mockResolvedValue({} as any);

        const req = new NextRequest("http://localhost/api/ea/heartbeat", {
            method: "POST",
            body: JSON.stringify({
                accountNumber: "1001",
                balance: 5000,
                equity: 5000,
                accountTradeMode: "REAL",
                broker: "Vantage",
                server: "Vantage-Live",
                currency: "USD",
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.balanceEligible).toBe(true);
        expect(prisma.tradingAccount.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    fundingVerifiedAt: expect.any(Date),
                    fundingAmount: 5000,
                }),
            })
        );
    });

    it("rejects an unknown USER_SYNC_KEY account without creating it or notifying Admins", async () => {
        vi.mocked(resolveSyncAuth).mockResolvedValue({
            success: true,
            data: {
                user: { id: "user-999" } as any,
                account: undefined,
                authMode: "USER_SYNC_KEY",
            },
        });

        vi.mocked(prisma.tradingAccount.findFirst).mockResolvedValue(null);

        const req = new NextRequest("http://localhost/api/ea/heartbeat", {
            method: "POST",
            body: JSON.stringify({
                productSlug: "trade-manager",
                eaName: "GoldScalperNinja - TradeManager",
                eaVersion: "3.92",
                accountNumber: "888888",
                balance: 12500.5,
                equity: 12640.25,
                accountTradeMode: 2,
                broker: "Exness",
                server: "Exness-MT5Real",
                currency: "USD",
                platform: "MT5",
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(404);
        expect(await res.json()).toEqual(
            expect.objectContaining({ error: "Account not found" })
        );
        expect(prisma.tradingAccount.create).not.toHaveBeenCalled();
        expect(prisma.tradingAccount.update).not.toHaveBeenCalled();
        expect(
            prisma.tradingAccountCapitalSnapshot.create
        ).not.toHaveBeenCalled();
        expect(prisma.eAProductAccess.findFirst).not.toHaveBeenCalled();
        expect(prisma.eAProductUsageEvent.create).not.toHaveBeenCalled();
    });
});
