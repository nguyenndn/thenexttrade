import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
    failSupportSyncTicket,
    getSupportSyncJobId,
    getSupportTicketIdFromJobId,
    sanitizeSupportSyncMessage,
    verifySupportSyncTicket,
} from "./support-sync-jobs.server";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        supportSyncTicket: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    },
}));

describe("support sync job helpers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("maps a ticket to a stable, 50-character job id", () => {
        expect(getSupportSyncJobId("ticket-123")).toBe("support_ticket-123");
        expect(
            getSupportTicketIdFromJobId("support_ticket-123")
        ).toBe("ticket-123");
        expect(getSupportTicketIdFromJobId("cloud_ticket-123")).toBeNull();
        expect(getSupportTicketIdFromJobId("support_")).toBeNull();

        const longTicketId = "t".repeat(60);
        const jobId = getSupportSyncJobId(longTicketId);
        expect(jobId).toHaveLength(50);
        expect(jobId.startsWith("support_")).toBe(true);
    });

    it("redacts password-like values and normalizes whitespace", () => {
        const message = sanitizeSupportSyncMessage(
            "Login failed\npassword=super-secret Investor Pass : another-secret"
        );

        expect(message).not.toContain("super-secret");
        expect(message).not.toContain("another-secret");
        expect(message).toContain("password=[redacted]");
        expect(message).not.toContain("\n");
    });

    it("marks a Support ticket FAILED and stores a redacted reason", async () => {
        vi.mocked(prisma.supportSyncTicket.findUnique).mockResolvedValue({
            id: "ticket-1",
            notes: "Existing note",
        } as never);
        vi.mocked(prisma.supportSyncTicket.update).mockResolvedValue(
            {} as never
        );

        const updated = await failSupportSyncTicket({
            ticketId: "ticket-1",
            errorCode: "NO_CREDENTIALS",
            errorMessage: "Investor password=must-not-leak",
        });

        expect(updated).toBe(true);
        expect(prisma.supportSyncTicket.update).toHaveBeenCalledWith({
            where: { id: "ticket-1" },
            data: {
                status: "FAILED",
                notes: expect.stringContaining(
                    "[Support Sync] Failed (NO_CREDENTIALS)"
                ),
            },
        });
        const notes = vi.mocked(prisma.supportSyncTicket.update).mock.calls[0][0]
            .data.notes as string;
        expect(notes).toContain("Existing note");
        expect(notes).not.toContain("must-not-leak");
    });

    it("marks a Support ticket VERIFIED with a result summary", async () => {
        vi.mocked(prisma.supportSyncTicket.findUnique).mockResolvedValue({
            id: "ticket-2",
            notes: null,
        } as never);
        vi.mocked(prisma.supportSyncTicket.update).mockResolvedValue(
            {} as never
        );

        const updated = await verifySupportSyncTicket({
            ticketId: "ticket-2",
            imported: 8,
            updated: 2,
            totalDeals: 10,
        });

        expect(updated).toBe(true);
        expect(prisma.supportSyncTicket.update).toHaveBeenCalledWith({
            where: { id: "ticket-2" },
            data: {
                status: "VERIFIED",
                verifiedAt: expect.any(Date),
                notes: expect.stringContaining(
                    "Verified: 8 imported, 2 updated, 10 deals received."
                ),
            },
        });
    });

    it("returns false when the ticket no longer exists", async () => {
        vi.mocked(prisma.supportSyncTicket.findUnique).mockResolvedValue(null);

        await expect(
            failSupportSyncTicket({
                ticketId: "missing",
                errorCode: "WORKER_ERROR",
                errorMessage: "failure",
            })
        ).resolves.toBe(false);
        await expect(
            verifySupportSyncTicket({
                ticketId: "missing",
                imported: 0,
                updated: 0,
                totalDeals: 0,
            })
        ).resolves.toBe(false);
    });
});
