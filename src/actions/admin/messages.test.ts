import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    fetchAdminMessagesData,
    updateContactMessageStatus,
    saveContactMessageNotes,
    replyToContactMessage,
    deleteContactMessage,
} from "./messages";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { sendEmailWithDetails } from "@/lib/services/email.service";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        profile: {
            findUnique: vi.fn(),
        },
        contactMessage: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            count: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

vi.mock("@/lib/auth-cache", () => ({
    getAuthUser: vi.fn(),
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

vi.mock("@/lib/services/email.service", async () => {
    const actual = await vi.importActual<
        typeof import("@/lib/services/email.service")
    >("@/lib/services/email.service");
    return {
        ...actual,
        sendEmailWithDetails: vi.fn(),
    };
});

describe("Admin Contact Messages Actions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Access Control", () => {
        it("fails when user is not logged in", async () => {
            vi.mocked(getAuthUser).mockResolvedValue(null);

            const res = await fetchAdminMessagesData();
            expect(res.success).toBe(false);
            expect(res.error).toMatch(/Unauthorized/);
        });

        it("fails when user is not an ADMIN", async () => {
            vi.mocked(getAuthUser).mockResolvedValue({
                id: "user-123",
            } as never);
            vi.mocked(prisma.profile.findUnique).mockResolvedValue({
                role: "USER",
            } as never);

            const res = await fetchAdminMessagesData();
            expect(res.success).toBe(false);
            expect(res.error).toMatch(/Forbidden/);
        });
    });

    describe("fetchAdminMessagesData", () => {
        it("successfully fetches messages and aggregates stats for ADMIN", async () => {
            vi.mocked(getAuthUser).mockResolvedValue({
                id: "admin-123",
            } as never);
            vi.mocked(prisma.profile.findUnique).mockResolvedValue({
                role: "ADMIN",
            } as never);

            const mockDate = new Date("2026-10-11T12:00:00Z");
            vi.mocked(prisma.contactMessage.findMany).mockResolvedValue([
                {
                    id: "msg-1",
                    name: "John Trader",
                    email: "john@example.com",
                    subject: "MT5 EA Support",
                    message: "Need help with setup",
                    status: "new",
                    notes: null,
                    createdAt: mockDate,
                    updatedAt: mockDate,
                },
            ] as never);

            vi.mocked(prisma.contactMessage.count)
                .mockResolvedValueOnce(1)
                .mockResolvedValueOnce(5)
                .mockResolvedValueOnce(2)
                .mockResolvedValueOnce(1)
                .mockResolvedValueOnce(1)
                .mockResolvedValueOnce(1);

            const res = await fetchAdminMessagesData({ status: "new" });

            expect(res.success).toBe(true);
            expect(res.data?.messages).toHaveLength(1);
            expect(res.data?.messages[0].name).toBe("John Trader");
            expect(res.data?.stats.total).toBe(5);
            expect(res.data?.stats.newCount).toBe(2);
        });
    });

    describe("updateContactMessageStatus & saveContactMessageNotes", () => {
        it("updates message status and optional internal notes", async () => {
            vi.mocked(getAuthUser).mockResolvedValue({
                id: "admin-123",
            } as never);
            vi.mocked(prisma.profile.findUnique).mockResolvedValue({
                role: "ADMIN",
            } as never);
            vi.mocked(prisma.contactMessage.update).mockResolvedValue(
                {} as never
            );

            const res = await updateContactMessageStatus(
                "msg-1",
                "replied",
                "Followed up via email"
            );

            expect(res.success).toBe(true);
            expect(prisma.contactMessage.update).toHaveBeenCalledWith({
                where: { id: "msg-1" },
                data: { status: "replied", notes: "Followed up via email" },
            });
        });

        it("saves internal notes without mutating status", async () => {
            vi.mocked(getAuthUser).mockResolvedValue({
                id: "admin-123",
            } as never);
            vi.mocked(prisma.profile.findUnique).mockResolvedValue({
                role: "ADMIN",
            } as never);
            vi.mocked(prisma.contactMessage.update).mockResolvedValue(
                {} as never
            );

            const res = await saveContactMessageNotes(
                "msg-1",
                "Reviewed account number"
            );

            expect(res.success).toBe(true);
            expect(prisma.contactMessage.update).toHaveBeenCalledWith({
                where: { id: "msg-1" },
                data: { notes: "Reviewed account number" },
            });
        });
    });

    describe("replyToContactMessage", () => {
        it("sends email via SMTP mail server and marks message as replied", async () => {
            vi.mocked(getAuthUser).mockResolvedValue({
                id: "admin-123",
            } as never);
            vi.mocked(prisma.profile.findUnique).mockResolvedValue({
                role: "ADMIN",
            } as never);
            vi.mocked(prisma.contactMessage.findUnique).mockResolvedValue({
                id: "msg-1",
                name: "Duy Nguyen",
                email: "keezimin@gmail.com",
                subject: "Cancel invoice #329082",
                message: "Please help cancel this invoice.",
                status: "read",
                notes: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as never);
            vi.mocked(sendEmailWithDetails).mockResolvedValue({
                success: true,
                messageId: "<smtp-123@thenexttrade.app>",
            });
            vi.mocked(prisma.contactMessage.update).mockResolvedValue(
                {} as never
            );

            const res = await replyToContactMessage({
                id: "msg-1",
                subject: "Re: Cancel invoice #329082",
                replyMessage: "Your invoice #329082 has been cancelled.",
            });

            expect(res.success).toBe(true);
            expect(sendEmailWithDetails).toHaveBeenCalledTimes(1);
            expect(sendEmailWithDetails).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: "keezimin@gmail.com",
                    subject: "Re: Cancel invoice #329082",
                })
            );
            expect(prisma.contactMessage.update).toHaveBeenCalledWith({
                where: { id: "msg-1" },
                data: { status: "replied" },
            });
        });

        it("does not mark message as replied if mail server delivery fails", async () => {
            vi.mocked(getAuthUser).mockResolvedValue({
                id: "admin-123",
            } as never);
            vi.mocked(prisma.profile.findUnique).mockResolvedValue({
                role: "ADMIN",
            } as never);
            vi.mocked(prisma.contactMessage.findUnique).mockResolvedValue({
                id: "msg-1",
                name: "Duy Nguyen",
                email: "keezimin@gmail.com",
                subject: "Question",
                message: "Hello",
                status: "read",
                notes: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as never);
            vi.mocked(sendEmailWithDetails).mockResolvedValue({
                success: false,
                error: "SMTP connection refused",
            });

            const res = await replyToContactMessage({
                id: "msg-1",
                subject: "Re: Question",
                replyMessage: "Hi there",
            });

            expect(res.success).toBe(false);
            expect(res.error).toBe("SMTP connection refused");
            expect(prisma.contactMessage.update).not.toHaveBeenCalled();
        });
    });

    describe("deleteContactMessage", () => {
        it("deletes message by ID", async () => {
            vi.mocked(getAuthUser).mockResolvedValue({
                id: "admin-123",
            } as never);
            vi.mocked(prisma.profile.findUnique).mockResolvedValue({
                role: "ADMIN",
            } as never);
            vi.mocked(prisma.contactMessage.delete).mockResolvedValue(
                {} as never
            );

            const res = await deleteContactMessage("msg-1");

            expect(res.success).toBe(true);
            expect(prisma.contactMessage.delete).toHaveBeenCalledWith({
                where: { id: "msg-1" },
            });
        });
    });
});
