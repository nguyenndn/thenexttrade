import { getAuthUser } from "@/lib/auth-cache";
import { getUserProAccess } from "@/lib/pro-access";
import { prisma } from "@/lib/prisma";
import { DashboardLayoutClient } from "./layout.client";
import { redirect } from "next/navigation";
import { isOnboardingDone } from "@/lib/onboarding/onboarding.server";
import { getUserTradingDataState } from "@/lib/trading-data-state";
import { dashboardMenuItems, dashboardMenuGroups } from "@/config/navigation";

export const dynamic = "force-dynamic";

const DEFAULT_ENABLED_FLAGS = new Set([
    "feature_loyalty",
    "feature_competitions",
]);

function collectDashboardFlagKeys(): string[] {
    const flagSet = new Set<string>();
    for (const item of dashboardMenuItems) {
        const flag = (item as { featureFlag?: string }).featureFlag;
        if (flag) flagSet.add(flag);
    }
    for (const group of dashboardMenuGroups) {
        for (const item of group.items) {
            const flag = (item as { featureFlag?: string }).featureFlag;
            if (flag) flagSet.add(flag);
        }
    }
    return Array.from(flagSet);
}

async function getDisabledDashboardFlags(): Promise<string[]> {
    const keys = collectDashboardFlagKeys();
    if (keys.length === 0) return [];

    try {
        const settings = await prisma.systemSetting.findMany({
            where: { key: { in: keys } },
        });
        const disabled: string[] = [];
        for (const key of keys) {
            const setting = settings.find((s) => s.key === key);
            const defaultEnabled = DEFAULT_ENABLED_FLAGS.has(key);
            const enabled =
                (setting?.value as { enabled?: boolean } | null)?.enabled ??
                defaultEnabled;
            if (!enabled) {
                disabled.push(key);
            }
        }
        return disabled;
    } catch {
        return [];
    }
}

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getAuthUser();

    if (user) {
        const onboardingDone = await isOnboardingDone(user.id);
        if (!onboardingDone) {
            const dataState = await getUserTradingDataState(user.id);
            if (dataState.accountCount === 0 && dataState.tradeCount === 0) {
                redirect("/onboarding");
            }
        }
    }

    const [initialProStatus, initialDisabledFlags] = await Promise.all([
        user
            ? Promise.all([
                  getUserProAccess(user.id),
                  prisma.profile.findUnique({
                      where: { userId: user.id },
                      select: { mainTradingAccountId: true },
                  }),
              ]).then(([r, profile]) => ({
                  isPro: r.isPro,
                  status: r.status,
                  source: r.source,
                  expiresAt: r.expiresAt?.toISOString() ?? null,
                  activeAccountCount: r.activeAccountCount,
                  mainAccountId: profile?.mainTradingAccountId ?? null,
                  accounts: r.accounts.map((a) => ({
                      tradingAccountId: a.tradingAccountId,
                      accountName: a.accountName,
                      broker: a.broker,
                      status: a.status,
                      isPro: a.isPro,
                      source: a.source,
                      expiresAt: a.expiresAt?.toISOString() ?? null,
                  })),
              }))
            : Promise.resolve(null),
        getDisabledDashboardFlags(),
    ]);

    return (
        <DashboardLayoutClient
            user={user}
            initialProStatus={initialProStatus}
            initialDisabledFlags={initialDisabledFlags}
        >
            {children}
        </DashboardLayoutClient>
    );
}
