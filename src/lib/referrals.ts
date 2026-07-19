import { prisma } from "@/lib/prisma";
import { awardEdgeOnce } from "@/lib/edge-awards";
import type { Prisma } from "@prisma/client";

export const REFERRAL_EDGE_REWARD = 100;
export const REFERRAL_EVENT_TYPE = "REFERRAL_QUALIFIED";
export const REFERRAL_SOURCE_TYPE = "UserReferral";

type ReferralMetadata = {
    referredUserId?: string;
    referredEmail?: string;
    referredName?: string;
    referralCode?: string;
    qualifiedAt?: string;
};

const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readReferralMetadata(
    metadata: Prisma.JsonValue | null
): ReferralMetadata {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
        return {};
    }

    return metadata as ReferralMetadata;
}

function maskEmail(email?: string | null) {
    if (!email || !email.includes("@")) return "Verified trader";

    const [name, domain] = email.split("@");
    if (!name || !domain) return "Verified trader";

    return `${name.slice(0, 2)}***@${domain}`;
}

export async function resolveReferrerByCode(
    referralCode: string | null,
    newUserEmail?: string | null
) {
    const code = referralCode?.trim();
    if (!code) return null;

    const lookup: Prisma.UserWhereInput[] = [
        {
            profile: {
                username: {
                    equals: code,
                    mode: "insensitive",
                },
            },
        },
    ];

    if (uuidPattern.test(code)) {
        lookup.push({ id: code });
    }

    const referrer = await prisma.user.findFirst({
        where: {
            OR: lookup,
            ...(newUserEmail ? { email: { not: newUserEmail } } : {}),
        },
        select: {
            id: true,
            email: true,
            name: true,
            profile: {
                select: {
                    username: true,
                },
            },
        },
    });

    return referrer;
}

export async function recordQualifiedReferral(params: {
    referrerId: string;
    referredUserId: string;
    referredEmail?: string | null;
    referredName?: string | null;
    referralCode?: string | null;
}) {
    if (!params.referrerId || params.referrerId === params.referredUserId) {
        return { awarded: false, xp: 0 };
    }

    return awardEdgeOnce(
        params.referrerId,
        REFERRAL_EVENT_TYPE,
        REFERRAL_EDGE_REWARD,
        REFERRAL_SOURCE_TYPE,
        params.referredUserId,
        {
            referredUserId: params.referredUserId,
            referredEmail: params.referredEmail || null,
            referredName: params.referredName || null,
            referralCode: params.referralCode || null,
            qualifiedAt: new Date().toISOString(),
        }
    );
}

export async function getReferralDashboardData(userId: string) {
    const events = await prisma.edgeEvent.findMany({
        where: {
            userId,
            eventType: REFERRAL_EVENT_TYPE,
            sourceType: REFERRAL_SOURCE_TYPE,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    const edgeEarned = events.reduce((sum, event) => sum + event.xpAwarded, 0);

    return {
        totalReferrals: events.length,
        edgeEarned,
        rewardPerReferral: REFERRAL_EDGE_REWARD,
        qualifiedDefinition:
            "A referral is counted after the invited trader verifies their email and their account is created.",
        referrals: events.map((event) => {
            const metadata = readReferralMetadata(event.metadata);

            return {
                id: event.id,
                displayName:
                    metadata.referredName || maskEmail(metadata.referredEmail),
                email: maskEmail(metadata.referredEmail),
                qualifiedAt: event.createdAt.toISOString(),
                status: "Qualified",
                edgeAwarded: event.xpAwarded,
            };
        }),
    };
}

export type ReferralDashboardData = Awaited<
    ReturnType<typeof getReferralDashboardData>
>;
