import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { TradingStyleDashboard } from "@/components/trading-style/TradingStyleDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "My Trading Style — Know Your Style | TheNextTrade",
    description:
        "Your saved trading archetype, dimension profile, and personalised next moves.",
};

export interface TradingStyleSaved {
    archetype: string;
    archetypeTitle: string;
    dimensions: Record<string, number>;
    answers: Record<string, string>;
    completedAt: string;
}

export default async function SettingsTradingStylePage() {
    const user = await getAuthUser();
    if (!user) {
        redirect("/auth/login");
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { settings: true },
    });
    const settings = (dbUser?.settings as Record<string, any>) || {};
    const saved = (settings.tradingStyle as TradingStyleSaved | null) ?? null;

    return <TradingStyleDashboard initialResult={saved} userId={user.id} />;
}
