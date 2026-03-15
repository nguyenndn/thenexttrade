import { Metadata } from "next";
import { StrategyManager } from "@/components/strategies/StrategyManager";
import { getStrategies } from "@/actions/strategies";

export const metadata: Metadata = {
    title: "Strategies | Trading Dashboard",
    description: "Manage your trading strategies",
};

export default async function StrategiesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    const page = typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page) : 1;
    const limit = typeof resolvedParams.limit === "string" ? parseInt(resolvedParams.limit) : 12;

    const { strategies, meta } = await getStrategies(page, limit);

    return (
        <StrategyManager initialStrategies={strategies} meta={meta} />
    );
}
