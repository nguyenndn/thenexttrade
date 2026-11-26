// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetUser = vi.fn();
const mockGetAal = vi.fn();
const mockProfileFindUnique = vi.fn();
const mockProductFindUnique = vi.fn();
const mockProductFindFirst = vi.fn();
const mockProductUpdate = vi.fn();
const mockAuditCreate = vi.fn();
const mockHasR2Credentials = vi.fn();
const mockUploadProtectedAsset = vi.fn();
const mockUploadPublicAsset = vi.fn();

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn(async () => ({
        auth: {
            getUser: mockGetUser,
            mfa: {
                getAuthenticatorAssuranceLevel: mockGetAal,
            },
        },
    })),
}));

vi.mock("@/lib/prisma", () => ({
    prisma: {
        profile: {
            findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
        },
        eAProduct: {
            findUnique: (...args: unknown[]) => mockProductFindUnique(...args),
            findFirst: (...args: unknown[]) => mockProductFindFirst(...args),
            update: (...args: unknown[]) => mockProductUpdate(...args),
        },
        auditLog: {
            create: (...args: unknown[]) => mockAuditCreate(...args),
        },
    },
}));

vi.mock("@/lib/storage/object-storage", () => ({
    hasR2Credentials: () => mockHasR2Credentials(),
    isR2Configured: true,
    resolveStorageDirectory: (dir: string) => dir,
    uploadProtectedAsset: (...args: unknown[]) =>
        mockUploadProtectedAsset(...args),
    uploadPublicAsset: (...args: unknown[]) => mockUploadPublicAsset(...args),
}));

import { POST } from "./route";
import { PATCH } from "../route";

describe("Admin EA Product Upload & Update API Routes", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
        mockGetAal.mockResolvedValue({
            data: { currentLevel: "aal2", nextLevel: "aal2" },
            error: null,
        });
        mockProfileFindUnique.mockResolvedValue({ role: "ADMIN" });
        mockProductFindUnique.mockResolvedValue({
            id: "prod-snr",
            slug: "snr-system",
            name: "SNR System",
        });
        mockProductFindFirst.mockResolvedValue(null);
        mockProductUpdate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
            id: "prod-snr",
            slug: (data.slug as string) || "snr-system",
            ...data,
        }));
        mockAuditCreate.mockResolvedValue({ id: "audit-1" });
        mockHasR2Credentials.mockReturnValue(true);
        mockUploadProtectedAsset.mockResolvedValue(true);
        mockUploadPublicAsset.mockResolvedValue(
            "https://cdn.thenexttrade.app/trading-systems/prod-snr/thumb.png"
        );
    });

    it("rejects non-admin users with 403", async () => {
        mockProfileFindUnique.mockResolvedValueOnce({ role: "USER" });

        const formData = new FormData();
        formData.append("platform", "MT5");
        formData.append(
            "file",
            new File([new Uint8Array([1, 2, 3])], "GoldScalperNinja_SNR.ex5")
        );

        const req = new NextRequest(
            "https://thenexttrade.app/api/admin/trading-systems/prod-snr/upload",
            { method: "POST", body: formData }
        );

        const res = await POST(req, { params: Promise.resolve({ id: "prod-snr" }) });
        expect(res.status).toBe(403);
        expect(mockUploadProtectedAsset).not.toHaveBeenCalled();
    });

    it("rejects non-.ex5 files when platform is MT5", async () => {
        const formData = new FormData();
        formData.append("platform", "MT5");
        formData.append(
            "file",
            new File([new Uint8Array([1, 2, 3])], "wrong-extension.zip")
        );

        const req = new NextRequest(
            "https://thenexttrade.app/api/admin/trading-systems/prod-snr/upload",
            { method: "POST", body: formData }
        );

        const res = await POST(req, { params: Promise.resolve({ id: "prod-snr" }) });
        const body = await res.json();
        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error).toContain(".ex5");
    });

    it("uploads >1MB .ex5 binary to R2 and updates EAProduct.fileMT5", async () => {
        // 1.5 MB binary (> old 1MB Server Action limit)
        const largeBinary = new Uint8Array(1.5 * 1024 * 1024);
        largeBinary[0] = 0x45;
        largeBinary[1] = 0x58;
        largeBinary[2] = 0x35;

        const formData = new FormData();
        formData.append("platform", "MT5");
        formData.append(
            "file",
            new File([largeBinary], "GoldScalperNinja_SNR.ex5", {
                type: "application/octet-stream",
            })
        );

        const req = new NextRequest(
            "https://thenexttrade.app/api/admin/trading-systems/prod-snr/upload",
            { method: "POST", body: formData }
        );

        const res = await POST(req, { params: Promise.resolve({ id: "prod-snr" }) });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual({
            success: true,
            url: "trading-systems/prod-snr/mt5/GoldScalperNinja_SNR.ex5",
        });
        expect(mockUploadProtectedAsset).toHaveBeenCalledTimes(1);
        expect(mockProductUpdate).toHaveBeenCalledWith({
            where: { id: "prod-snr" },
            data: {
                fileMT5: "trading-systems/prod-snr/mt5/GoldScalperNinja_SNR.ex5",
            },
        });
        expect(mockAuditCreate).toHaveBeenCalledTimes(1);
    });

    it("updates product slug via PATCH without RSC redirect failure", async () => {
        const req = new NextRequest(
            "https://thenexttrade.app/api/admin/trading-systems/prod-snr",
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "SNR System",
                    slug: "gsn-snr-system",
                    version: "1.0.1",
                    type: "SEMI_AUTO",
                    platform: "MT5",
                    isActive: true,
                    isFree: false,
                }),
            }
        );

        const res = await PATCH(req, {
            params: Promise.resolve({ id: "prod-snr" }),
        });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual({
            success: true,
            data: { id: "prod-snr", slug: "gsn-snr-system" },
        });
        expect(mockProductUpdate).toHaveBeenCalledTimes(1);
    });
});
