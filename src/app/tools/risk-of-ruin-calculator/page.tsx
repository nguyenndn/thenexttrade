import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { RiskOfRuinCalc } from "@/components/calculator/RiskOfRuinCalc";
import { getToolBySlug, getToolMetadata } from "@/config/tools-data";
import type { Metadata } from "next";

const tool = getToolBySlug("risk-of-ruin-calculator")!;

export const metadata: Metadata = getToolMetadata("risk-of-ruin-calculator");

export default function RiskOfRuinCalculatorPage() {
    return (
        <ToolPageLayout tool={tool}>
            <RiskOfRuinCalc />
        </ToolPageLayout>
    );
}
