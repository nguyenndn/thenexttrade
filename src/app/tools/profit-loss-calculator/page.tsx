import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { ProfitLossCalc } from "@/components/calculator/ProfitLossCalc";
import { getToolBySlug } from "@/config/tools-data";
import type { Metadata } from "next";

const tool = getToolBySlug("profit-loss-calculator")!;

export const metadata: Metadata = {
    title: `${tool.title} | TheNextTrade`,
    description: tool.description,
};

export default function ProfitLossCalculatorPage() {
    return (
        <ToolPageLayout tool={tool}>
            <ProfitLossCalc />
        </ToolPageLayout>
    );
}
