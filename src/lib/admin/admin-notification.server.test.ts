import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    notifyAdminsOfNewAccount,
    notifyAdminsOfVipRequest,
} from "./admin-notification.server";
import { prisma } from "@/lib/prisma";
import { NotificationType, NotificationPriority } from "@prisma/client";
import { NOTIFICATION_ROUTES } from "@/lib/notification-routes";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        profile: {
            findMany: vi.fn(),
        },
        notification: {
            createMany: vi.fn(),
        },
        securityLog: {
            create: vi.fn(),
        },
    },
}));

describe("notifyAdminsOfVipRequest", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("does nothing if no admins exist", async () => {
        vi.mocked(prisma.profile.findMany).mockResolvedValueOnce([]);

        await notifyAdminsOfVipRequest({
            vipRequestId: "req-1",
            userId: "user-1",
            broker: "EXNESS",
            accountNumber: "123456",
        });

        expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });

    it("creates in-app notifications for all admins with correct fields", async () => {
        vi.mocked(prisma.profile.findMany).mockResolvedValueOnce([
            { userId: "admin-1" },
            { userId: "admin-2" },
        ] as any);

        await notifyAdminsOfVipRequest({
            vipRequestId: "req-123",
            userId: "user-456",
            broker: "ULTIMAMARKETS",
            accountNumber: "1610076507",
            balance: "17000",
            userEmail: "trader@example.com",
            userName: "Trader Joe",
        });

        expect(prisma.notification.createMany).toHaveBeenCalledTimes(1);
        const callArg = vi.mocked(prisma.notification.createMany).mock.calls[0][0];

        expect(callArg?.skipDuplicates).toBe(true);
        expect(callArg?.data).toHaveLength(2);

        const first = (callArg?.data as any[])[0];
        expect(first.userId).toBe("admin-1");
        expect(first.type).toBe(NotificationType.ANNOUNCEMENT);
        expect(first.priority).toBe(NotificationPriority.HIGH);
        expect(first.title).toContain("ULTIMAMARKETS (1610076507)");
        expect(first.message).toContain("Trader Joe");
        expect(first.message).toContain("$17000");
        expect(first.link).toBe(`${NOTIFICATION_ROUTES.ADMIN_USERS}/user-456?tab=vip-broker`);
        expect(first.dedupeKey).toBe("admin-vip-req-req-123-admin-1");
    });
});

describe("notifyAdminsOfNewAccount", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("does nothing if no admins exist", async () => {
        vi.mocked(prisma.profile.findMany).mockResolvedValueOnce([]);

        await notifyAdminsOfNewAccount({
            accountId: "acc-1",
            userId: "user-1",
        });

        expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });

    it("creates in-app notifications for all admins with account details", async () => {
        vi.mocked(prisma.profile.findMany).mockResolvedValueOnce([
            { userId: "admin-1" },
            { userId: "admin-2" },
        ] as any);

        await notifyAdminsOfNewAccount({
            accountId: "acc-123",
            userId: "user-456",
            broker: "ULTIMAMARKETS",
            accountNumber: "924399",
            server: "UltimaMarkets-Demo",
            userEmail: "trader@example.com",
            userName: "Kee",
        });

        expect(prisma.notification.createMany).toHaveBeenCalledTimes(1);
        const callArg = vi.mocked(prisma.notification.createMany).mock.calls[0][0];

        expect(callArg?.skipDuplicates).toBe(true);
        expect(callArg?.data).toHaveLength(2);

        const first = (callArg?.data as any[])[0];
        expect(first.userId).toBe("admin-1");
        expect(first.type).toBe(NotificationType.ANNOUNCEMENT);
        expect(first.priority).toBe(NotificationPriority.NORMAL);
        expect(first.title).toBe("New Trading Account: ULTIMAMARKETS (924399)");
        expect(first.message).toContain("Kee");
        expect(first.message).toContain("ULTIMAMARKETS #924399");
        expect(first.message).toContain("UltimaMarkets-Demo");
        expect(first.link).toBe(`${NOTIFICATION_ROUTES.ADMIN_USERS}/user-456?tab=accounts`);
        expect(first.dedupeKey).toBe("admin-new-account-acc-123-admin-1");
    });

    it("retries delivery and records a durable failure without throwing", async () => {
        vi.mocked(prisma.profile.findMany).mockResolvedValueOnce([
            { userId: "admin-1" },
        ] as any);
        vi.mocked(prisma.notification.createMany)
            .mockRejectedValueOnce(new Error("temporary outage"))
            .mockRejectedValueOnce(new Error("temporary outage"))
            .mockRejectedValueOnce(new Error("temporary outage"));

        await expect(
            notifyAdminsOfNewAccount({
                accountId: "acc-123",
                userId: "user-456",
                broker: "EXNESS",
                accountNumber: "924399",
            })
        ).resolves.toBeUndefined();

        expect(prisma.notification.createMany).toHaveBeenCalledTimes(3);
        expect(prisma.securityLog.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    type: "ADMIN_NOTIFICATION_FAILED",
                }),
            })
        );
    });
});
