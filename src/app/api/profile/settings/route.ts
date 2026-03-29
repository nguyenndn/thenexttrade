import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: {
            username: true,
            isPublicProfile: true,
            showTradeScore: true,
            showBadges: true,
            showPairStats: true,
            showSessionStats: true,
            profileHeadline: true,
        },
    });

    if (!profile) {
        return NextResponse.json({
            username: null,
            isPublicProfile: false,
            showTradeScore: false,
            showBadges: true,
            showPairStats: true,
            showSessionStats: true,
            profileHeadline: null,
        });
    }

    return NextResponse.json(profile);
}

export async function PUT(request: Request) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    const profile = await prisma.profile.upsert({
        where: { userId: user.id },
        update: {
            isPublicProfile: Boolean(body.isPublicProfile),
            showTradeScore: Boolean(body.showTradeScore),
            showBadges: Boolean(body.showBadges),
            showPairStats: Boolean(body.showPairStats),
            showSessionStats: Boolean(body.showSessionStats),
            profileHeadline: body.profileHeadline
                ? String(body.profileHeadline).slice(0, 160)
                : null,
        },
        create: {
            userId: user.id,
            isPublicProfile: Boolean(body.isPublicProfile),
            showTradeScore: Boolean(body.showTradeScore),
            showBadges: Boolean(body.showBadges),
            showPairStats: Boolean(body.showPairStats),
            showSessionStats: Boolean(body.showSessionStats),
            profileHeadline: body.profileHeadline
                ? String(body.profileHeadline).slice(0, 160)
                : null,
        },
    });

    return NextResponse.json({ success: true });
}
