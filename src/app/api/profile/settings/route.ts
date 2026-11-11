import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/sanitize";
import {
    getEmailPreferences,
    DEFAULT_EMAIL_PREFERENCES,
} from "@/lib/email/preferences";

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
    const payoutWallet =
        (userSettings?.payoutWallet as {
            network: "BEP20" | "TRC20" | "ERC20";
            address: string;
        } | null) || null;

    if (!profile) {
        return NextResponse.json({ ...base, showTradingStyle, emailPreferences, payoutWallet });
    }

    return NextResponse.json({ ...profile, showTradingStyle, emailPreferences, payoutWallet });
}

export async function PUT(request: Request) {
    const user = await getAuthUser();
    if (!user)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    // Persist email preferences inside User.settings.emailPreferences,
    // merging with the stored blob so unrelated settings keys survive.
    if (body.emailPreferences && typeof body.emailPreferences === "object") {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { settings: true },
        });
        const settings = (dbUser?.settings as Record<string, unknown>) || {};
        const incoming = body.emailPreferences as Record<string, unknown>;
        const existing = getEmailPreferences(dbUser?.settings);
        const merged: Record<string, boolean> = { ...existing };
        for (const key of Object.keys(DEFAULT_EMAIL_PREFERENCES) as Array<
            keyof typeof DEFAULT_EMAIL_PREFERENCES
        >) {
            if (typeof incoming[key] === "boolean") {
                merged[key] = incoming[key];
            }
        }

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

    // Persist payout wallet inside User.settings ONLY when payoutWallet is explicitly sent,
    // merging with the stored blob so unrelated settings keys survive.
    if (body.payoutWallet !== undefined) {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { settings: true },
        });
        const settings = (dbUser?.settings as Record<string, unknown>) || {};

        let validWallet: {
            network: "BEP20" | "TRC20" | "ERC20";
            address: string;
        } | null = null;

        if (body.payoutWallet === null || body.payoutWallet === "") {
            validWallet = null;
        } else if (typeof body.payoutWallet === "string") {
            const trimmed = body.payoutWallet.trim();
            if (trimmed.length === 0) {
                validWallet = null;
            } else if (trimmed.length < 10) {
                return NextResponse.json(
                    {
                        error: "Payout wallet address must be at least 10 characters.",
                    },
                    { status: 400 }
                );
            } else {
                const inferredNetwork = trimmed.startsWith("T")
                    ? "TRC20"
                    : "BEP20";
                validWallet = {
                    network: inferredNetwork,
                    address: trimmed,
                };
            }
        } else if (typeof body.payoutWallet === "object") {
            const walletObj = body.payoutWallet as Record<string, unknown>;
            const rawAddress =
                typeof walletObj.address === "string"
                    ? walletObj.address.trim()
                    : "";
            if (rawAddress.length === 0) {
                validWallet = null;
            } else if (rawAddress.length < 10) {
                return NextResponse.json(
                    {
                        error: "Payout wallet address must be at least 10 characters.",
                    },
                    { status: 400 }
                );
            } else {
                const rawNet = String(
                    walletObj.network || "BEP20"
                ).toUpperCase();
                const network = (
                    ["BEP20", "TRC20", "ERC20"].includes(rawNet)
                        ? rawNet
                        : "BEP20"
                ) as "BEP20" | "TRC20" | "ERC20";
                validWallet = {
                    network,
                    address: rawAddress,
                };
            }
        } else {
            return NextResponse.json(
                { error: "Invalid payoutWallet payload." },
                { status: 400 }
            );
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                settings: {
                    ...settings,
                    payoutWallet: validWallet,
                },
            },
        });
    }

    const profileBooleanKeys = [
        "isPublicProfile",
        "showTradeScore",
        "showBadges",
        "showPairStats",
        "showSessionStats",
        "showMoney",
        "showBroker",
        "showAccountNumber",
        "showRealName",
        "showPercentMetrics",
    ] as const;

    const hasHeadline = "profileHeadline" in body || "headline" in body;
    const hasBio = "bio" in body;
    const hasDollarAlias = "showDollarMetrics" in body && !("showMoney" in body);

    const hasProfileFields =
        profileBooleanKeys.some((k) => k in body) ||
        hasDollarAlias ||
        hasHeadline ||
        hasBio;

    let updatedUsername: string | null = null;

    if (hasProfileFields) {
        const partialUpdate: Record<string, unknown> = {};
        for (const key of profileBooleanKeys) {
            if (key in body) {
                partialUpdate[key] = Boolean(body[key]);
            }
        }
        if (hasDollarAlias) {
            partialUpdate.showMoney = Boolean(body.showDollarMetrics);
        }
        if (hasHeadline) {
            const rawHeadline = body.profileHeadline ?? body.headline;
            const cleanHeadline = rawHeadline
                ? sanitizeInput(String(rawHeadline)).slice(0, 160)
                : "";
            partialUpdate.profileHeadline = cleanHeadline || null;
        }
        if (hasBio) {
            const cleanBio = body.bio
                ? sanitizeInput(String(body.bio)).slice(0, 200)
                : "";
            partialUpdate.bio = cleanBio || null;
        }

        const rawHeadlineForCreate = body.profileHeadline ?? body.headline;
        const cleanHeadlineForCreate = rawHeadlineForCreate
            ? sanitizeInput(String(rawHeadlineForCreate)).slice(0, 160)
            : null;
        const cleanBioForCreate =
            hasBio && body.bio
                ? sanitizeInput(String(body.bio)).slice(0, 200)
                : undefined;

        const upserted = await prisma.profile.upsert({
            where: { userId: user.id },
            update: partialUpdate,
            create: {
                userId: user.id,
                isPublicProfile: Boolean(body.isPublicProfile),
                showTradeScore: Boolean(body.showTradeScore),
                showBadges: "showBadges" in body ? Boolean(body.showBadges) : true,
                showPairStats: "showPairStats" in body ? Boolean(body.showPairStats) : true,
                showSessionStats: "showSessionStats" in body ? Boolean(body.showSessionStats) : true,
                profileHeadline: cleanHeadlineForCreate || null,
                ...(cleanBioForCreate !== undefined ? { bio: cleanBioForCreate || null } : {}),
                showMoney: hasDollarAlias
                    ? Boolean(body.showDollarMetrics)
                    : Boolean(body.showMoney),
                showBroker: Boolean(body.showBroker),
                showAccountNumber: Boolean(body.showAccountNumber),
                showRealName: Boolean(body.showRealName),
                showPercentMetrics: body.showPercentMetrics !== false,
            },
            select: { username: true },
        });
        updatedUsername = upserted.username;
    }

    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard/settings/profile");
    revalidatePath("/trader/[username]", "page");
    if (updatedUsername) {
        revalidatePath(`/trader/${updatedUsername}`);
    }

    return NextResponse.json({ success: true });
}
