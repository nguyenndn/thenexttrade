import { describe, expect, it, vi, beforeEach } from "vitest";
import {
    approveAccount,
    rejectAccount,
    deleteLicense,
    suspendLicense,
    reactivateLicense,
    adminIssueLicense,
} from "./actions";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sendEmailWithDetails, buildEALicenseEmailHtml } from "@/lib/services/email.service";
import { ensureTradingAccountLicenseKey } from "@/lib/ea/github-license-sync.server";
import { syncLicenseBackupOrQueue } from "@/lib/ea/license-github-sync-outbox.server";
import { AccountStatus } from "@prisma/client";

vi.mock("@/lib/prisma", () => {
    const mockTx = {
        eALicense: {
            update: vi.fn().mockResolvedValue({ id: "lic-123" }),
            delete: vi.fn().mockResolvedValue({ id: "lic-123" }),
            upsert: vi.fn().mockResolvedValue({ id: "lic-new" }),
        },
        tradingAccount: {
            findMany: vi.fn().mockResolvedValue([]),
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            update: vi.fn().mockResolvedValue({ id: "acc-1" }),
        },
        proEntitlement: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        eAProductAccess: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        eAProductUsageEvent: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        profile: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        notification: {
            create: vi.fn().mockResolvedValue({ id: "notif-1" }),
        },
        auditLog: {
            create: vi.fn().mockResolvedValue({ id: "audit-1" }),
        },
    };

    return {
        prisma: {
            profile: {
                findUnique: vi.fn(),
            },
            user: {
                findFirst: vi.fn(),
            },
            eALicense: {
                findUnique: vi.fn(),
            },
            $transaction: vi.fn(async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
            _mockTx: mockTx,
        },
    };
});

vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue({
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: { id: "admin-user-id", email: "admin@thenexttrade.com" } },
            }),
            mfa: {
                getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
                    data: { currentLevel: "aal1", nextLevel: "aal1" },
                }),
            },
        },
    }),
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

vi.mock("@/lib/ea/github-license-sync.server", () => ({
    ensureTradingAccountLicenseKey: vi.fn(),
    syncLicensesToGitHubBackup: vi.fn(),
}));

vi.mock("@/lib/ea/license-github-sync-outbox.server", () => ({
    syncLicenseBackupOrQueue: vi.fn(),
}));

vi.mock("@/lib/services/email.service", () => ({
    sendEmailWithDetails: vi.fn(),
    buildEALicenseEmailHtml: vi.fn(),
}));

describe("approveAccount - Adversarial Challenge & Verification", () => {
    const mockPrisma = prisma as any;
    const mockEnsure = ensureTradingAccountLicenseKey as any;
    const mockSync = syncLicenseBackupOrQueue as any;
    const mockSendEmail = sendEmailWithDetails as any;
    const mockBuildHtml = buildEALicenseEmailHtml as any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Default Admin auth
        mockPrisma.profile.findUnique.mockResolvedValue({ role: "ADMIN" });

        // Default GitHub sync outcome
        mockSync.mockResolvedValue({
            githubSynced: true,
            githubSkipped: false,
        });

        // Default ensured license key
        mockEnsure.mockResolvedValue({
            tradingAccountId: "ta-456",
            licenseKey: "TNT-GOLD-TEST-KEY-9999",
        });

        // Default email HTML builder
        mockBuildHtml.mockReturnValue("<html>Sample License Email</html>");

        // Default send email response
        mockSendEmail.mockResolvedValue({
            success: true,
            messageId: "<msg-123@mailtrap.io>",
        });
    });

    it("Scenario 1: license.user has null email -> succeeds without email dispatch, does not crash", async () => {
        mockPrisma.eALicense.findUnique.mockResolvedValue({
            id: "lic-1",
            userId: "u-1",
            accountNumber: "12345678",
            broker: "Exness",
            status: AccountStatus.PENDING,
            user: {
                id: "u-1",
                name: "John Doe",
                email: null,
            },
        });

        const result = await approveAccount("lic-1", {});

        expect(result.success).toBe(true);
        expect(result.dbUpdated).toBe(true);
        expect(result.emailDispatched).toBe(false);
        expect(result.licenseKey).toBe("TNT-GOLD-TEST-KEY-9999");
        expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("Scenario 2: license.user is completely null -> succeeds without email dispatch, does not crash", async () => {
        mockPrisma.eALicense.findUnique.mockResolvedValue({
            id: "lic-2",
            userId: "u-2",
            accountNumber: "87654321",
            broker: "IC Markets",
            status: AccountStatus.PENDING,
            user: null,
        });

        const result = await approveAccount("lic-2", {});

        expect(result.success).toBe(true);
        expect(result.dbUpdated).toBe(true);
        expect(result.emailDispatched).toBe(false);
        expect(result.licenseKey).toBe("TNT-GOLD-TEST-KEY-9999");
        expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("Scenario 3: sendEmailWithDetails throws a network or SMTP authentication exception -> caught safely, returns success: true, emailDispatched: false", async () => {
        mockPrisma.eALicense.findUnique.mockResolvedValue({
            id: "lic-3",
            userId: "u-3",
            accountNumber: "99887766",
            broker: "XM",
            status: AccountStatus.PENDING,
            user: {
                id: "u-3",
                name: "Alice Trader",
                email: "alice@example.com",
            },
        });

        // Simulate SMTP network failure / connection timeout
        mockSendEmail.mockRejectedValue(new Error("SMTP connection timeout: ECONNREFUSED 127.0.0.1:587"));

        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        const result = await approveAccount("lic-3", {});

        expect(result.success).toBe(true);
        expect(result.dbUpdated).toBe(true);
        expect(result.emailDispatched).toBe(false);
        expect(result.licenseKey).toBe("TNT-GOLD-TEST-KEY-9999");
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });

    it("Scenario 4: sendEmailWithDetails returns success: false with SMTP error string -> handled gracefully, returns success: true, emailDispatched: false", async () => {
        mockPrisma.eALicense.findUnique.mockResolvedValue({
            id: "lic-4",
            userId: "u-4",
            accountNumber: "55443322",
            broker: "RoboForex",
            status: AccountStatus.PENDING,
            user: {
                id: "u-4",
                name: "Bob Scalper",
                email: "bob@example.com",
            },
        });

        mockSendEmail.mockResolvedValue({
            success: false,
            error: "550 5.1.1 User unknown",
        });

        const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        const result = await approveAccount("lic-4", {});

        expect(result.success).toBe(true);
        expect(result.dbUpdated).toBe(true);
        expect(result.emailDispatched).toBe(false);
        expect(result.licenseKey).toBe("TNT-GOLD-TEST-KEY-9999");
        expect(consoleWarnSpy).toHaveBeenCalled();
        consoleWarnSpy.mockRestore();
    });

    it("Scenario 5: Happy path -> licenseKey is correctly generated and passed into buildEALicenseEmailHtml and sendEmailWithDetails", async () => {
        const testLicenseKey = "TNT-GOLD-ABCD-EFGH-5555";
        mockEnsure.mockResolvedValue({
            tradingAccountId: "ta-789",
            licenseKey: testLicenseKey,
        });

        mockPrisma.eALicense.findUnique.mockResolvedValue({
            id: "lic-5",
            userId: "u-5",
            accountNumber: "11223344",
            broker: "Exness",
            status: AccountStatus.PENDING,
            user: {
                id: "u-5",
                name: "Charlie Gold",
                email: "charlie@goldtrader.io",
            },
        });

        const result = await approveAccount("lic-5", {});

        expect(result.success).toBe(true);
        expect(result.dbUpdated).toBe(true);
        expect(result.emailDispatched).toBe(true);
        expect(result.licenseKey).toBe(testLicenseKey);

        // Verify buildEALicenseEmailHtml invocation
        expect(mockBuildHtml).toHaveBeenCalledTimes(1);
        expect(mockBuildHtml).toHaveBeenCalledWith(
            expect.objectContaining({
                userName: "Charlie Gold",
                eaName: "GoldScalperNinja Pro MT5",
                licenseKey: testLicenseKey,
                mt5Account: "11223344 (Exness)",
                downloadUrl: expect.stringContaining("/dashboard/trading-systems"),
                guideUrl: expect.stringContaining("/dashboard/trading-systems"),
            })
        );

        // Verify sendEmailWithDetails invocation
        expect(mockSendEmail).toHaveBeenCalledTimes(1);
        expect(mockSendEmail).toHaveBeenCalledWith({
            to: "charlie@goldtrader.io",
            subject: "Your GoldScalperNinja Pro MT5 Lifetime License Key 🔑",
            html: "<html>Sample License Email</html>",
        });
    });

    it("Scenario 6: Fallback for missing user.name -> passes 'Trader' to buildEALicenseEmailHtml", async () => {
        mockPrisma.eALicense.findUnique.mockResolvedValue({
            id: "lic-6",
            userId: "u-6",
            accountNumber: "33445566",
            broker: "Forex.com",
            status: AccountStatus.PENDING,
            user: {
                id: "u-6",
                name: null,
                email: "nameless@trader.io",
            },
        });

        const result = await approveAccount("lic-6", {});

        expect(result.success).toBe(true);
        expect(result.emailDispatched).toBe(true);
        expect(mockBuildHtml).toHaveBeenCalledWith(
            expect.objectContaining({
                userName: "Trader",
                licenseKey: "TNT-GOLD-TEST-KEY-9999",
            })
        );
    });

    it("Scenario 7: Non-admin authorization rejection -> fails fast with NOT_ADMIN error", async () => {
        mockPrisma.profile.findUnique.mockResolvedValue({ role: "USER" });

        const result = await approveAccount("lic-7", {});

        expect(result.success).toBe(false);
        expect(result.error).toBe("NOT_ADMIN");
        expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("Scenario 8: Account already approved -> fails fast with ACCOUNT_ALREADY_APPROVED", async () => {
        mockPrisma.eALicense.findUnique.mockResolvedValue({
            id: "lic-8",
            userId: "u-8",
            accountNumber: "77889900",
            broker: "Exness",
            status: AccountStatus.APPROVED,
            user: { id: "u-8", email: "user@example.com" },
        });

        const result = await approveAccount("lic-8", {});

        expect(result.success).toBe(false);
        expect(result.error).toBe("ACCOUNT_ALREADY_APPROVED");
        expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("Scenario 9: license.user.email is an empty string -> does not attempt email dispatch, succeeds cleanly", async () => {
        mockPrisma.eALicense.findUnique.mockResolvedValue({
            id: "lic-9",
            userId: "u-9",
            accountNumber: "44556677",
            broker: "Exness",
            status: AccountStatus.PENDING,
            user: {
                id: "u-9",
                name: "Blank Email Trader",
                email: "",
            },
        });

        const result = await approveAccount("lic-9", {});

        expect(result.success).toBe(true);
        expect(result.emailDispatched).toBe(false);
        expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("Scenario 10: sendEmailWithDetails throws non-Error object -> caught safely by outer catch without crashing", async () => {
        mockPrisma.eALicense.findUnique.mockResolvedValue({
            id: "lic-10",
            userId: "u-10",
            accountNumber: "66778899",
            broker: "Exness",
            status: AccountStatus.PENDING,
            user: {
                id: "u-10",
                name: "Edge Case",
                email: "edge@case.io",
            },
        });

        mockSendEmail.mockRejectedValue("Fatal unhandled string error");

        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        const result = await approveAccount("lic-10", {});

        expect(result.success).toBe(true);
        expect(result.emailDispatched).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });

    it("Scenario 11: revalidatePath is called for all 4 admin and dashboard route targets upon approval", async () => {
        mockPrisma.eALicense.findUnique.mockResolvedValue({
            id: "lic-11",
            userId: "u-11",
            accountNumber: "12121212",
            broker: "Exness",
            status: AccountStatus.PENDING,
            user: {
                id: "u-11",
                name: "Revalidate Check",
                email: "reval@test.com",
            },
        });

        await approveAccount("lic-11", {});

        expect(revalidatePath).toHaveBeenCalledWith("/admin/trading-systems");
        expect(revalidatePath).toHaveBeenCalledWith("/admin/trading-systems/accounts");
        expect(revalidatePath).toHaveBeenCalledWith("/dashboard/trading-systems");
        expect(revalidatePath).toHaveBeenCalledWith("/dashboard/accounts");
    });
});

describe("Existing Trading Systems Server Actions - Backward Compatibility", () => {
    const mockPrisma = prisma as any;
    const mockSync = syncLicenseBackupOrQueue as any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockPrisma.profile.findUnique.mockResolvedValue({ role: "ADMIN" });
        mockSync.mockResolvedValue({
            githubSynced: true,
            githubSkipped: false,
        });
    });

    it("rejectAccount retains existing signature and behaviour", async () => {
        mockPrisma.eALicense.findUnique.mockResolvedValue({
            id: "lic-reject-1",
            userId: "u-rej",
            accountNumber: "12312312",
            broker: "Exness",
        });

        const result = await rejectAccount("lic-reject-1", {
            reason: "Account does not belong to partner IB group",
        });

        expect(result.success).toBe(true);
        expect(result.dbUpdated).toBe(true);
        expect(result.accountRetained).toBe(false);
        expect(result.githubSynced).toBe(true);
    });

    it("deleteLicense retains existing signature and behaviour", async () => {
        mockPrisma.eALicense.findUnique.mockResolvedValue({
            id: "lic-del-1",
            userId: "u-del",
            accountNumber: "45645645",
            broker: "IC Markets",
        });

        const result = await deleteLicense("lic-del-1");

        expect(result.success).toBe(true);
        expect(result.dbUpdated).toBe(true);
        expect(result.githubSynced).toBe(true);
    });

    it("suspendLicense retains existing signature and behaviour", async () => {
        mockPrisma.eALicense.findUnique.mockResolvedValue({
            id: "lic-susp-1",
            userId: "u-susp",
            accountNumber: "78978978",
            broker: "XM",
        });

        const result = await suspendLicense("lic-susp-1", "Compliance violation");

        expect(result.success).toBe(true);
        expect(result.dbUpdated).toBe(true);
        expect(result.githubSynced).toBe(true);
    });

    it("reactivateLicense retains existing signature and behaviour", async () => {
        mockPrisma.eALicense.findUnique.mockResolvedValue({
            id: "lic-react-1",
            userId: "u-react",
            accountNumber: "98798798",
            broker: "Exness",
        });

        (ensureTradingAccountLicenseKey as any).mockResolvedValue({
            tradingAccountId: "ta-react",
            licenseKey: "TNT-REACT-KEY-1111",
        });

        const result = await reactivateLicense("lic-react-1");

        expect(result.success).toBe(true);
        expect(result.dbUpdated).toBe(true);
        expect(result.licenseKey).toBe("TNT-REACT-KEY-1111");
        expect(result.githubSynced).toBe(true);
    });

    it("adminIssueLicense retains existing signature and behaviour", async () => {
        mockPrisma.user.findFirst.mockResolvedValue({
            id: "u-target",
            email: "trader@target.com",
            name: "Target Trader",
        });

        mockPrisma.eALicense.findUnique.mockResolvedValue(null);

        (ensureTradingAccountLicenseKey as any).mockResolvedValue({
            tradingAccountId: "ta-target",
            licenseKey: "TNT-TARGET-KEY-2222",
        });

        const result = await adminIssueLicense({
            userEmail: "trader@target.com",
            broker: "Exness",
            accountNumber: "55667788",
            note: "VIP Grant",
        });

        expect(result.success).toBe(true);
        expect(result.dbUpdated).toBe(true);
        expect(result.licenseKey).toBe("TNT-TARGET-KEY-2222");
        expect(result.githubSynced).toBe(true);
    });
});
