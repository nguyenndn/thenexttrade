import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { LiveMarketRates } from "@/components/tools/LiveMarketRates";
import { getToolBySlug } from "@/config/tools-data";
import type { Metadata } from "next";

const tool = getToolBySlug("live-market-rates")!;

export const metadata: Metadata = {
    title: tool.title,
    description: tool.description,
};

export default function LiveMarketRatesPage() {
    return (
        <ToolPageLayout tool={tool}>
            <LiveMarketRates />
        </ToolPageLayout>
    );
}
