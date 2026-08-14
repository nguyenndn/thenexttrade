// Certificate share-card data helpers — power the public certificate pages
// (/certificate/[id], /certificate/master/[userId]) and their OG images.
//
// Privacy mirrors /share/[id]: real name is only shown when the owner enabled
// showRealName, otherwise the public @username, else a neutral "Trader".

import { prisma } from "@/lib/prisma";

export interface CertificateShareData {
    certificateId: string;
    displayName: string;
    username: string | null;
    userImage: string | null;
    levelTitle: string;
    levelOrder: number;
    levelDescription: string | null;
    score: number;
    earnedAt: string;
}

export interface MasterCertificateShareData {
    userId: string;
    displayName: string;
    username: string | null;
    userImage: string | null;
    avgScore: number;
    levelCount: number;
    earnedAt: string;
}

function resolveDisplayName(
    name: string | null | undefined,
    profile: { username: string | null; showRealName: boolean } | null | undefined
): string {
    if (profile?.showRealName && name) return name;
    if (profile?.username) return `@${profile.username}`;
    return "Trader";
}

/** Level certificate: fetches one Certificate row + the owner's privacy flags. */
export async function getCertificateShareData(
    certId: string
): Promise<CertificateShareData | null> {
    const certificate = await prisma.certificate.findUnique({
        where: { id: certId },
        include: {
            level: {
                select: { title: true, order: true, description: true },
            },
            user: {
                select: {
                    name: true,
                    image: true,
                    profile: {
                        select: { username: true, showRealName: true },
                    },
                },
            },
        },
    });

    if (!certificate) return null;

    return {
        certificateId: certificate.id,
        displayName: resolveDisplayName(
            certificate.user.name,
            certificate.user.profile
        ),
        username: certificate.user.profile?.username ?? null,
        userImage: certificate.user.image,
        levelTitle: certificate.level.title,
        levelOrder: certificate.level.order,
        levelDescription: certificate.level.description,
        score: certificate.score,
        earnedAt: certificate.earnedAt.toISOString(),
    };
}

/**
 * Master certificate: derived (no DB row) from all level certificates of a
 * user. Returns null when not every level is completed — same logic as the
 * certificates dashboard page.
 */
export async function getMasterCertificateShareData(
    userId: string
): Promise<MasterCertificateShareData | null> {
    const [levels, certificates, user] = await Promise.all([
        prisma.level.findMany({ select: { id: true, order: true } }),
        prisma.certificate.findMany({
            where: { userId },
            select: { score: true, earnedAt: true },
        }),
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                image: true,
                profile: {
                    select: { username: true, showRealName: true },
                },
            },
        }),
    ]);

    if (!user) return null;

    const totalLevels = levels.length;
    const earnedCount = certificates.length;
    const allLevelsCompleted = totalLevels > 0 && earnedCount >= totalLevels;
    if (!allLevelsCompleted) return null;

    const avgScore = Math.round(
        certificates.reduce((sum, c) => sum + c.score, 0) / certificates.length
    );
    const latestEarnedAt = certificates.reduce(
        (latest, c) => (c.earnedAt > latest ? c.earnedAt : latest),
        certificates[0].earnedAt
    );

    return {
        userId,
        displayName: resolveDisplayName(user.name, user.profile),
        username: user.profile?.username ?? null,
        userImage: user.image,
        avgScore,
        levelCount: totalLevels,
        earnedAt: latestEarnedAt.toISOString(),
    };
}
