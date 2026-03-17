import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { RiskRewardCalc } from "@/components/calculator/RiskRewardCalc";
import { getToolBySlug } from "@/config/tools-data";
import type { Metadata } from "next";

const tool = getToolBySlug("risk-reward-calculator")!;

export const metadata: Metadata = {
    title: `${tool.title} | TheNextTrade`,
    description: tool.description,
};

export default function RiskRewardCalculatorPage() {
    return (
        <ToolPageLayout tool={tool}>
            <RiskRewardCalc />
        </ToolPageLayout>
    );
}
