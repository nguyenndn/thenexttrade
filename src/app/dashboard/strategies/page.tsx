import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { StrategyManager, StrategiesHubTab } from "@/components/strategies/StrategyManager";
import { getStrategies, getStrategyPerformance } from "@/actions/strategies";
import { getTradingRulesList, getRulesComplianceStats } from "@/actions/rulebook";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Strategies & Trading Rulebook | TheNextTrade",
    description:
        "Define systematic trade setups, enforce global risk rules, and audit strategy compliance.",
};

const VALID_TABS: ReadonlySet<StrategiesHubTab> = new Set([
    "strategies",
    "templates",
    "global-rules",
    "compliance",
]);

export default async function StrategiesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const user = await getAuthUser();
    if (!user) {
        redirect("/auth/login");
    }

    const resolvedParams = await searchParams;
    const page =
        typeof resolvedParams.page === "string"
            ? parseInt(resolvedParams.page) || 1
            : 1;
    const limit =
        typeof resolvedParams.limit === "string"
            ? parseInt(resolvedParams.limit) || 15
            : 15;
    const rawAccountId =
        typeof resolvedParams.accountId === "string"
            ? resolvedParams.accountId
            : undefined;
    const rawTab =
        typeof resolvedParams.tab === "string" ? resolvedParams.tab : undefined;
    const initialTab: StrategiesHubTab =
        rawTab && VALID_TABS.has(rawTab as StrategiesHubTab)
            ? (rawTab as StrategiesHubTab)
            : "strategies";

    const [{ strategies, meta }, perfResult, rules, complianceStats, accounts] =
        await Promise.all([
            getStrategies(page, limit),
            getStrategyPerformance(rawAccountId),
            getTradingRulesList(),
            getRulesComplianceStats(rawAccountId),
            prisma.tradingAccount.findMany({
                where: { userId: user.id },
                select: { id: true, name: true, accountNumber: true },
                orderBy: { createdAt: "asc" },
            }),
        ]);

    return (
        <StrategyManager
            initialStrategies={strategies}
            meta={meta}
            initialPerformance={perfResult.performance || []}
            initialSummary={perfResult.summary}
            currency={perfResult.currency || "USD"}
            initialTab={initialTab}
            initialRules={rules}
            initialComplianceStats={complianceStats}
            accounts={accounts}
        />
    );
}
