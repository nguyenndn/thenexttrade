import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import {
    getEmailPreferences,
    DEFAULT_EMAIL_PREFERENCES,
} from "@/lib/email/preferences";
import { getJournalAutopilot } from "@/lib/journal/autopilot.server";

export async function GET() {
    const user = await getAuthUser();
    if (!user)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { settings: true },
    });

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
            showMoney: true,
            showBroker: true,
            showAccountNumber: true,
            showRealName: true,
            showPercentMetrics: true,
        },
    });

    const base = {
        username: null,
        isPublicProfile: false,
        showTradeScore: false,
        showBadges: true,
        showPairStats: true,
        showSessionStats: true,
        showTradingStyle: true,
        profileHeadline: null,
        showMoney: false,
        showBroker: false,
        showAccountNumber: false,
        showRealName: false,
        showPercentMetrics: true,
    };

    const userSettings = (dbUser?.settings as Record<string, any>) || {};
    const showTradingStyle =
        (profile as any)?.showTradingStyle ??
        userSettings?.profileSettings?.showTradingStyle ??
        userSettings?.showTradingStyle ??
        true;

    const emailPreferences = getEmailPreferences(dbUser?.settings);
    const journalAutopilot = getJournalAutopilot(dbUser?.settings);

    if (!profile) {
        return NextResponse.json({ ...base, showTradingStyle, emailPreferences, journalAutopilot });
    }

    return NextResponse.json({ ...profile, showTradingStyle, emailPreferences, journalAutopilot });
}

export async function PUT(request: Request) {
    const user = await getAuthUser();
    if (!user)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    // Persist email preferences inside User.settings.emailPreferences,
    // merging with the stored blob so unrelated settings keys survive.
    if (body.emailPreferences && typeof body.emailPreferences === "object") {
        const incoming = body.emailPreferences as Record<string, unknown>;
        const existing = getEmailPreferences(undefined);
        const merged: Record<string, boolean> = { ...existing };
        for (const key of Object.keys(DEFAULT_EMAIL_PREFERENCES) as Array<
            keyof typeof DEFAULT_EMAIL_PREFERENCES
        >) {
            if (typeof incoming[key] === "boolean") {
                merged[key] = incoming[key];
            }
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { settings: true },
        });
        const settings = (dbUser?.settings as Record<string, unknown>) || {};
        await prisma.user.update({
            where: { id: user.id },
            data: {
                settings: {
                    ...settings,
                    emailPreferences: merged,
                },
            },
        });
    }

    // Persist the AI Journal Autopilot toggle inside User.settings, merging
    // with the stored blob so unrelated settings keys survive.
    if (typeof body.journalAutopilot === "boolean") {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { settings: true },
        });
        const settings = (dbUser?.settings as Record<string, unknown>) || {};
        await prisma.user.update({
            where: { id: user.id },
            data: {
                settings: {
                    ...settings,
                    journalAutopilot: body.journalAutopilot,
                },
            },
        });
    }

    // Persist the showTradingStyle toggle inside User.settings, merging
    // with the stored blob so unrelated settings keys survive.
    if (typeof body.showTradingStyle === "boolean") {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { settings: true },
        });
        const settings = (dbUser?.settings as Record<string, unknown>) || {};
        const profileSettings =
            (settings.profileSettings as Record<string, unknown>) || {};
        await prisma.user.update({
            where: { id: user.id },
            data: {
                settings: {
                    ...settings,
                    showTradingStyle: body.showTradingStyle,
                    profileSettings: {
                        ...profileSettings,
                        showTradingStyle: body.showTradingStyle,
                    },
                },
            },
        });
    }

    await prisma.profile.upsert({
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
            showMoney: Boolean(body.showMoney),
            showBroker: Boolean(body.showBroker),
            showAccountNumber: Boolean(body.showAccountNumber),
            showRealName: Boolean(body.showRealName),
            showPercentMetrics: body.showPercentMetrics !== false,
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
            showMoney: Boolean(body.showMoney),
            showBroker: Boolean(body.showBroker),
            showAccountNumber: Boolean(body.showAccountNumber),
            showRealName: Boolean(body.showRealName),
            showPercentMetrics: body.showPercentMetrics !== false,
        },
    });

    return NextResponse.json({ success: true });
}
