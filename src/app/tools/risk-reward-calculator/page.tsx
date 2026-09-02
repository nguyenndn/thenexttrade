import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { RiskRewardCalc } from "@/components/calculator/RiskRewardCalc";
import { getToolBySlug, getToolMetadata } from "@/config/tools-data";
import type { Metadata } from "next";

const tool = getToolBySlug("risk-reward-calculator")!;

export const metadata: Metadata = getToolMetadata("risk-reward-calculator");

export default function RiskRewardCalculatorPage() {
    return (
        <ToolPageLayout tool={tool}>
            <RiskRewardCalc />
        </ToolPageLayout>
    );
}
