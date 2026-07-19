import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { RiskOfRuinCalc } from "@/components/calculator/RiskOfRuinCalc";
import { getToolBySlug } from "@/config/tools-data";
import type { Metadata } from "next";

const tool = getToolBySlug("risk-of-ruin-calculator")!;

export const metadata: Metadata = {
    title: `${tool.title} | TheNextTrade`,
    description: tool.description,
};

export default function RiskOfRuinCalculatorPage() {
    return (
        <ToolPageLayout tool={tool}>
            <RiskOfRuinCalc />
        </ToolPageLayout>
    );
}
