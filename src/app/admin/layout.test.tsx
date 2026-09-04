import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminLayout from "./layout";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

vi.mock("@/lib/auth-cache", () => ({
    getAuthUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
    prisma: {
        profile: {
            findUnique: vi.fn(),
        },
    },
}));

vi.mock("next/navigation", () => ({
    redirect: vi.fn((url: string) => {
        throw new Error(`REDIRECT_TO:${url}`);
    }),
}));

vi.mock("@/components/dashboard/DashboardShell", () => ({
    DashboardShell: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="dashboard-shell">{children}</div>
    ),
}));

vi.mock("@/components/admin/AdminNotificationBell", () => ({
    AdminNotificationBell: () => <div data-testid="admin-bell" />,
}));

vi.mock("@/components/providers/AdminButtonSizeProvider", () => ({
    AdminButtonSizeProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="button-size-provider">{children}</div>
    ),
}));

describe("AdminLayout Fail-Closed Security Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("redirects unauthenticated users immediately to /auth/login?next=/admin (Fail-Closed)", async () => {
        vi.mocked(getAuthUser).mockResolvedValue(null);

        await expect(
            AdminLayout({ children: <div>Secret Admin Content</div> })
        ).rejects.toThrow("REDIRECT_TO:/auth/login?next=/admin");

        expect(redirect).toHaveBeenCalledWith("/auth/login?next=/admin");
    });

    it("redirects authenticated non-admin users to /dashboard", async () => {
        vi.mocked(getAuthUser).mockResolvedValue({ id: "user-regular" } as any);
        vi.mocked(prisma.profile.findUnique).mockResolvedValue({ role: "MEMBER" } as any);

        await expect(
            AdminLayout({ children: <div>Secret Admin Content</div> })
        ).rejects.toThrow("REDIRECT_TO:/dashboard");

        expect(redirect).toHaveBeenCalledWith("/dashboard");
    });

    it("renders admin shell for verified ADMIN role", async () => {
        vi.mocked(getAuthUser).mockResolvedValue({ id: "user-admin" } as any);
        vi.mocked(prisma.profile.findUnique).mockResolvedValue({ role: "ADMIN" } as any);

        const result = await AdminLayout({
            children: <div data-testid="admin-child">Admin Content</div>,
        });

        expect(redirect).not.toHaveBeenCalled();
        expect(result).toBeDefined();
    });
});
