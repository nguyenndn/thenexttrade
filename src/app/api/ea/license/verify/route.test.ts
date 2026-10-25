import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import {
    parseAccountsCsv,
    serializeAccountsCsv,
} from "@/lib/ea/github-license-sync.server";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        eALicense: {
            findMany: vi.fn(),
        },
        tradingAccount: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
        },
    },
}));

vi.mock("@/lib/ea/telemetry.server", () => ({
    recordEaProductTelemetry: vi.fn().mockResolvedValue(undefined),
}));

describe("POST /api/ea/license/verify & GitHub CSV Backup", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(prisma.eALicense.findMany).mockResolvedValue([]);
        vi.mocked(prisma.tradingAccount.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.tradingAccount.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.tradingAccount.update).mockResolvedValue({} as never);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    });

    it("rejects with ACCOUNT_MISMATCH (REVOKED) when License Key of Account A is used on Real Account B", async () => {
        vi.mocked(prisma.tradingAccount.findUnique).mockResolvedValue({
            id: "ta-1",
            userId: "user-1",
            accountNumber: "1059283",
            broker: "Exness",
            platform: "MT5",
            ibAttribution: "VERIFIED",
            proEntitlement: null,
        } as never);

        const req = new NextRequest("http://localhost:3500/api/ea/license/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-License-Key": "TNT-AAAA-BBBB-CCCC",
            },
            body: JSON.stringify({
                accountNumber: "9999999",
                broker: "Exness Technologies Ltd",
                server: "Exness-MT5Real14",
                accountTradeMode: 2, // REAL
                productSlug: "trade-manager",
            }),
        });

        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(403);
        expect(json.valid).toBe(false);
        expect(json.state).toBe("REVOKED");
        expect(json.code).toBe("ACCOUNT_MISMATCH");
        expect(json.expectedAccount).toBe("1059283");
        expect(json.actualAccount).toBe("9999999");
    });

    it("rejects when License Key matches accountNumber but account is still PENDING IB approval", async () => {
        vi.mocked(prisma.tradingAccount.findUnique).mockResolvedValue({
            id: "ta-2",
            userId: "user-1",
            accountNumber: "7748291",
            broker: "Vantage",
            platform: "MT5",
            ibAttribution: "UNKNOWN",
            proEntitlement: null,
        } as never);

        vi.mocked(prisma.eALicense.findMany).mockResolvedValue([
            {
                id: "lic-2",
                userId: "user-1",
                accountNumber: "7748291",
                broker: "Vantage",
                status: "PENDING",
                startDate: null,
                expiryDate: null,
            } as never,
        ]);

        const req = new NextRequest("http://localhost:3500/api/ea/license/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-License-Key": "TNT-1111-2222-3333",
            },
            body: JSON.stringify({
                accountNumber: "7748291",
                broker: "Vantage",
                server: "VantageInternational-Live",
                accountTradeMode: 2,
            }),
        });

        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(403);
        expect(json.valid).toBe(false);
        expect(json.state).toBe("REVOKED");
        expect(json.code).toBe("ACCOUNT_NOT_APPROVED_UNDER_IB");
    });

    it("authorizes (VALID) when License Key matches accountNumber and EALicense is APPROVED", async () => {
        vi.mocked(prisma.tradingAccount.findUnique).mockResolvedValue({
            id: "ta-1",
            userId: "user-1",
            accountNumber: "1059283",
            broker: "Exness",
            platform: "MT5",
            ibAttribution: "VERIFIED",
            proEntitlement: null,
        } as never);

        vi.mocked(prisma.eALicense.findMany).mockResolvedValue([
            {
                id: "lic-1",
                userId: "user-1",
                accountNumber: "1059283",
                broker: "Exness",
                status: "APPROVED",
                startDate: new Date("2026-01-01T00:00:00Z"),
                expiryDate: null, // Lifetime
            } as never,
        ]);

        const req = new NextRequest("http://localhost:3500/api/ea/license/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-License-Key": "TNT-AAAA-BBBB-CCCC",
            },
            body: JSON.stringify({
                accountNumber: "1059283",
                broker: "Exness Technologies Ltd",
                server: "Exness-MT5Real14",
                accountTradeMode: 2,
                balance: 5000,
                equity: 5120,
                currency: "USD",
                productSlug: "trade-manager",
            }),
        });

        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.valid).toBe(true);
        expect(json.state).toBe("VALID");
        expect(json.code).toBe("LICENSE_VALID");
        expect(json.expiryDate).toBe("2099-12-31");
    });

    it("does not let payload identity fields replace a stored demo account", async () => {
        vi.mocked(prisma.tradingAccount.findUnique).mockResolvedValue({
            id: "ta-demo",
            userId: "user-1",
            accountNumber: "1059283",
            broker: "Vantage",
            server: "Vantage-Demo",
            accountType: "PERSONAL",
            platform: "MT5",
            ibAttribution: "VERIFIED",
            proEntitlement: null,
        } as never);

        const req = new NextRequest("http://localhost:3500/api/ea/license/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-License-Key": "TNT-AAAA-BBBB-CCCC",
            },
            body: JSON.stringify({
                accountNumber: "1059283",
                broker: "Exness",
                server: "Exness-MT5Real14",
                accountTradeMode: 2,
                balance: 5000,
                currency: "USD",
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        expect(prisma.tradingAccount.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.not.objectContaining({
                    broker: expect.anything(),
                    server: expect.anything(),
                    accountType: expect.anything(),
                }),
            })
        );
    });

    it("does not authorize with an approved license that belongs to another user", async () => {
        vi.mocked(prisma.tradingAccount.findUnique).mockResolvedValue({
            id: "ta-2",
            userId: "user-1",
            accountNumber: "7748291",
            broker: "Vantage",
            server: "VantageInternational-Live",
            accountType: "PERSONAL",
            platform: "MT5",
            ibAttribution: "UNKNOWN",
            proEntitlement: null,
        } as never);

        vi.mocked(prisma.eALicense.findMany).mockResolvedValue([
            {
                id: "lic-other-user",
                userId: "user-2",
                accountNumber: "7748291",
                broker: "Vantage",
                status: "APPROVED",
                startDate: new Date("2026-01-01T00:00:00Z"),
                expiryDate: null,
            } as never,
        ]);

        const req = new NextRequest("http://localhost:3500/api/ea/license/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-License-Key": "TNT-1111-2222-3333",
            },
            body: JSON.stringify({
                accountNumber: "7748291",
                broker: "Vantage",
                server: "VantageInternational-Live",
                accountTradeMode: 2,
            }),
        });

        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(403);
        expect(json.valid).toBe(false);
        expect(json.code).toBe("ACCOUNT_NOT_APPROVED_UNDER_IB");
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
        "treats a $label marker as demo even when accountTradeMode is REAL",
        async ({ server, broker }) => {
            vi.mocked(prisma.tradingAccount.findUnique).mockResolvedValue({
                id: "ta-non-live",
                userId: "user-1",
                accountNumber: "7748291",
                broker: "Vantage",
                server: "Vantage-Live",
                accountType: "PERSONAL",
                platform: "MT5",
                ibAttribution: "VERIFIED",
                proEntitlement: null,
            } as never);

            const req = new NextRequest(
                "http://localhost:3500/api/ea/license/verify",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-License-Key": "TNT-AAAA-BBBB-CCCC",
                    },
                    body: JSON.stringify({
                        accountNumber: "7748291",
                        broker,
                        server,
                        accountTradeMode: 2,
                    }),
                }
            );

            const res = await POST(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json.valid).toBe(true);
            expect(json.code).toBe("DEMO_AUTHORIZED");
            expect(prisma.tradingAccount.update).not.toHaveBeenCalled();
        }
    );

    it("preserves existing VIP rows when parsing and serializing GitHub accounts.csv", () => {
        const sampleCsv = [
            "account,start_date,end_date,status,note",
            "2001140658,2024-01-01,2030-12-30,active,VIP Client Current Account",
            "19286871,2024-06-01,2030-12-31,active,VantageReal: @Arynox",
        ].join("\n");

        const map = parseAccountsCsv(sampleCsv);
        expect(map.size).toBe(2);
        // Legacy rows without a broker are keyed by account only.
        expect(map.get("acct::2001140658")?.status).toBe("active");

        map.set("EXNESS::1059283", {
            account: "1059283",
            startDate: "2026-10-19",
            endDate: "2099-12-31",
            status: "active",
            note: "Exness: Trader Kee",
            broker: "Exness",
        });

        const serialized = serializeAccountsCsv(map);
        expect(serialized).toContain(
            "2001140658,2024-01-01,2030-12-30,active,VIP Client Current Account,"
        );
        expect(serialized).toContain(
            "1059283,2026-10-19,2099-12-31,active,Exness: Trader Kee,Exness"
        );
    });

    it("keeps the same login at two brokers as separate CSV rows", () => {
        const sampleCsv = [
            "account,start_date,end_date,status,note,broker",
            "1059283,2026-01-01,2099-12-31,active,Exness,Exness",
            "1059283,2026-01-01,2099-12-31,active,Vantage,Vantage",
        ].join("\n");

        const map = parseAccountsCsv(sampleCsv);
        expect(map.size).toBe(2);
        expect(map.get("EXNESS::1059283")?.broker).toBe("Exness");
        expect(map.get("VANTAGE::1059283")?.broker).toBe("Vantage");
    });
});
