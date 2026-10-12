import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchAdminMessagesData,
  updateContactMessageStatus,
  deleteContactMessage,
} from "./messages";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: vi.fn(),
    },
    contactMessage: {
      findMany: vi.fn(),
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
      vi.mocked(getAuthUser).mockResolvedValue({ id: "user-123" } as any);
      vi.mocked(prisma.profile.findUnique).mockResolvedValue({ role: "USER" } as any);

      const res = await fetchAdminMessagesData();
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Forbidden/);
    });
  });

  describe("fetchAdminMessagesData", () => {
    it("successfully fetches messages and aggregates stats for ADMIN", async () => {
      vi.mocked(getAuthUser).mockResolvedValue({ id: "admin-123" } as any);
      vi.mocked(prisma.profile.findUnique).mockResolvedValue({ role: "ADMIN" } as any);

      const mockDate = new Date("2026-10-11T12:00:00Z");
      vi.mocked(prisma.contactMessage.findMany).mockResolvedValue([
        {
          id: "msg-1",
          name: "John Trader",
          email: "john@example.com",
          subject: "MT5 EA Inquiry",
          message: "Need help with setup",
          status: "new",
          notes: null,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ] as any);

      // count resolves for: total filtered, total all, new, read, replied, archived
      vi.mocked(prisma.contactMessage.count)
        .mockResolvedValueOnce(1) // total filtered
        .mockResolvedValueOnce(5) // total all
        .mockResolvedValueOnce(2) // new
        .mockResolvedValueOnce(1) // read
        .mockResolvedValueOnce(1) // replied
        .mockResolvedValueOnce(1); // archived

      const res = await fetchAdminMessagesData({ status: "new" });

      expect(res.success).toBe(true);
      expect(res.data?.messages).toHaveLength(1);
      expect(res.data?.messages[0].name).toBe("John Trader");
      expect(res.data?.stats.total).toBe(5);
      expect(res.data?.stats.newCount).toBe(2);
    });
  });

  describe("updateContactMessageStatus", () => {
    it("updates message status and optional internal notes", async () => {
      vi.mocked(getAuthUser).mockResolvedValue({ id: "admin-123" } as any);
      vi.mocked(prisma.profile.findUnique).mockResolvedValue({ role: "ADMIN" } as any);
      vi.mocked(prisma.contactMessage.update).mockResolvedValue({} as any);

      const res = await updateContactMessageStatus("msg-1", "replied", "Followed up via email");

      expect(res.success).toBe(true);
      expect(prisma.contactMessage.update).toHaveBeenCalledWith({
        where: { id: "msg-1" },
        data: { status: "replied", notes: "Followed up via email" },
      });
    });
  });

  describe("deleteContactMessage", () => {
    it("deletes message by ID", async () => {
      vi.mocked(getAuthUser).mockResolvedValue({ id: "admin-123" } as any);
      vi.mocked(prisma.profile.findUnique).mockResolvedValue({ role: "ADMIN" } as any);
      vi.mocked(prisma.contactMessage.delete).mockResolvedValue({} as any);

      const res = await deleteContactMessage("msg-1");

      expect(res.success).toBe(true);
      expect(prisma.contactMessage.delete).toHaveBeenCalledWith({
        where: { id: "msg-1" },
      });
    });
  });
});
