import ProfileClient from "./ProfileClient";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage() {
    const user = await getAuthUser();

    if (!user) {
        return (
            <div className="py-8 text-center text-gray-600 dark:text-gray-300">
                <p>Please log in to access profile settings.</p>
            </div>
        );
    }

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

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { settings: true },
    });
    const userSettings = (dbUser?.settings as Record<string, any>) || {};
    const showTradingStyle =
        (profile as any)?.showTradingStyle ??
        userSettings?.profileSettings?.showTradingStyle ??
        userSettings?.showTradingStyle ??
        true;
    const userTradingStyle = (userSettings?.tradingStyle as any) ?? null;

    const settings = {
        username: profile?.username ?? null,
        isPublicProfile: profile?.isPublicProfile ?? false,
        showTradeScore: profile?.showTradeScore ?? false,
        showBadges: profile?.showBadges ?? true,
        showPairStats: profile?.showPairStats ?? true,
        showSessionStats: profile?.showSessionStats ?? true,
        showTradingStyle,
        profileHeadline: profile?.profileHeadline ?? null,
        showMoney: profile?.showMoney ?? false,
        showBroker: profile?.showBroker ?? false,
        showAccountNumber: profile?.showAccountNumber ?? false,
        showRealName: profile?.showRealName ?? false,
        showPercentMetrics: profile?.showPercentMetrics ?? true,
    };

    return (
        <ProfileClient
            initialSettings={settings}
            userDisplayName={user.name}
            userJoinedDate={user.createdAt}
            userTradingStyle={userTradingStyle}
        />
    );
}
