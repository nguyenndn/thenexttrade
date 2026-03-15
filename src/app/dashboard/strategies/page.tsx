import { Metadata } from "next";
import { StrategyManager } from "@/components/strategies/StrategyManager";
import { getStrategies } from "@/actions/strategies";
import { TabBar } from "@/components/ui/TabBar";

export const metadata: Metadata = {
    title: "Strategies | Trading Dashboard",
    description: "Manage your trading strategies",
};

const playbookTabs = [
    { label: "Playbook", href: "/dashboard/playbook" },
    { label: "Strategies", href: "/dashboard/strategies" },
];

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
        <div className="space-y-4">
            <div className="mb-4">
                <p className="text-base text-primary font-semibold border-l-4 border-primary bg-primary/5 dark:bg-primary/10 rounded-r-lg px-4 py-2 w-fit">Track performance by trading strategy.</p>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                <TabBar tabs={playbookTabs} />
            </div>
            <StrategyManager initialStrategies={strategies} meta={meta} />
        </div>
    );
}
