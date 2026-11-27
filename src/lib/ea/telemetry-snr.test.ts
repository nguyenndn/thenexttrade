import { beforeEach, describe, expect, it, vi } from "vitest";

const findProduct = vi.hoisted(() => vi.fn());
const findAccount = vi.hoisted(() => vi.fn());

interface ProductLookup {
    where: {
        OR?: Array<{
            slug?: { in?: string[] };
            id?: string;
            name?: { contains?: string };
        }>;
    };
}

vi.mock("@/lib/prisma", () => ({
    prisma: {
        tradingAccount: { findUnique: findAccount },
        eAProduct: { findFirst: findProduct },
        eAProductAccess: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
            create: vi.fn(),
        },
        eAProductUsageEvent: { findFirst: vi.fn(), create: vi.fn() },
    },
}));
vi.mock("@/lib/admin/ib/capital.server", () => ({
    captureCapitalSnapshot: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { buildCandidateProductSlugs } from "./user-license-access.server";
import { recordEaProductTelemetry } from "./telemetry.server";

const product = {
    id: "764eef7e-4400-4411-801d-98a3d1127421",
    slug: "gsn-snr-system",
    name: "SNR System",
};

describe("SNR telemetry with the production product slug", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        findAccount.mockResolvedValue({
            broker: "StarTrader",
            server: "STARTRADERFinancial-Demo",
            accountType: "DEMO",
            status: "CONNECTED",
        });
        // Match the actual lookup against a product whose ID is a UUID,
        // rather than a legacy ID equal to its canonical slug.
        findProduct.mockImplementation(async (query: ProductLookup) => {
            const matches = (query.where.OR || []).some((condition) =>
                condition.slug?.in?.includes(product.slug) ||
                condition.id === product.id ||
                (condition.name?.contains && product.name.toLowerCase().includes(
                    condition.name.contains.toLowerCase()
                ))
            );
            return matches ? product : null;
        });
        // No account grant exists for this account; telemetry must still
        // record usage, without creating or reactivating a license grant.
        vi.mocked(prisma.eAProductAccess.findMany).mockResolvedValue([]);
        vi.mocked(prisma.eAProductAccess.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.eAProductUsageEvent.findFirst).mockResolvedValue(null);
    });

    it.each(["snr-system", "gsn-snr-system", " GSN-SNR-SYSTEM "])(
        "resolves both SNR slugs from %s", (slug) => {
            expect(buildCandidateProductSlugs(slug)).toEqual([
                "snr-system", "gsn-snr-system",
            ]);
        }
    );

    it.each(["HEARTBEAT", "SYNC"] as const)(
        "records %s for account 1610076507 under the SNR UUID", async (eventType) => {
            await recordEaProductTelemetry({
                userId: "test-user",
                tradingAccountId: "test-account",
                accountNumber: "1610076507",
                eventType,
                productSlug: "gsn-snr-system",
                eaName: "GoldScalperNinja_SNR",
                eaVersion: "1.0.0",
                balance: 128900.41,
                accountType: "DEMO",
            });

            expect(prisma.eAProductUsageEvent.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    productId: product.id,
                    tradingAccountId: "test-account",
                    eventType,
                    metadata: expect.objectContaining({
                        accountNumber: "1610076507",
                        productSlug: "gsn-snr-system",
                    }),
                }),
            });
            expect(prisma.eAProductAccess.create).not.toHaveBeenCalled();
            expect(prisma.eAProductAccess.update).not.toHaveBeenCalled();
        }
    );
});
