import { Metadata } from "next";
import { StrategyManager } from "@/components/strategies/StrategyManager";
import { getStrategies, getStrategyPerformance } from "@/actions/strategies";

export const metadata: Metadata = {
    title: "Trading Playbooks & Strategy Benchmarking | TheNextTrade",
    description:
        "Define systematic trade setups, track edge expectancy, and benchmark strategy performance.",
};

export default async function StrategiesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    const page =
        typeof resolvedParams.page === "string"
            ? parseInt(resolvedParams.page) || 1
            : 1;
    const limit =
        typeof resolvedParams.limit === "string"
            ? parseInt(resolvedParams.limit) || 12
            : 12;

    const [{ strategies, meta }, perfResult] = await Promise.all([
        getStrategies(page, limit),
        getStrategyPerformance(),
    ]);

    return (
        <StrategyManager
            initialStrategies={strategies}
            meta={meta}
            initialPerformance={perfResult.performance || []}
            initialSummary={perfResult.summary}
        />
    );
}
