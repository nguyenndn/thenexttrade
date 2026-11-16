import { AccountStatus, type EAProduct } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SHADOW_MATRIX_SLUG_ALIASES = [
    "gsn-phoenix-grid",
    "gsn-shadown-matrix",
    "shadown-matrix",
    "shadow-matrix",
];

export function buildCandidateProductSlugs(rawSlug: string): string[] {
    const trimmed = rawSlug.trim().toLowerCase();
    const normalized = trimmed.replace(/[^a-z0-9]/g, "");

    if (
        normalized === "gsnphoenixgrid" ||
        normalized === "gsnshadowmatrix" ||
        normalized === "gsnshadownmatrix" ||
        normalized === "shadowmatrix" ||
        normalized === "shadownmatrix"
    ) {
        return SHADOW_MATRIX_SLUG_ALIASES;
    }

    return [trimmed];
}

export async function findActiveDashboardEaProduct(
    slugOrId: string
): Promise<EAProduct | null> {
    const candidateSlugs = buildCandidateProductSlugs(slugOrId);

    const bySlug = await prisma.eAProduct.findFirst({
        where: {
            isActive: true,
            slug: { in: candidateSlugs },
        },
    });
    if (bySlug) return bySlug;

    return prisma.eAProduct.findFirst({
        where: {
            isActive: true,
            id: slugOrId.trim(),
        },
    });
}

export async function getUserHasApprovedEaLicense(
    userId: string
): Promise<boolean> {
    const now = new Date();

    const [approvedLicense, activeProEntitlement, verifiedIbAccount] =
        await Promise.all([
            prisma.eALicense.findFirst({
                where: {
                    userId,
                    status: AccountStatus.APPROVED,
                    OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
                },
                select: { id: true },
            }),
            prisma.proEntitlement.findFirst({
                where: {
                    userId,
                    status: { in: ["ACTIVE", "GRACE"] },
                    OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
                },
                select: { id: true },
            }),
            prisma.tradingAccount.findFirst({
                where: {
                    userId,
                    accountNumber: { not: null },
                    ibAttribution: { in: ["VERIFIED", "CONFIRMED"] },
                },
                select: { id: true },
            }),
        ]);

    return Boolean(
        approvedLicense || activeProEntitlement || verifiedIbAccount
    );
}
