import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { LeverageCalc } from "@/components/calculator/LeverageCalc";
import { getToolBySlug } from "@/config/tools-data";
import type { Metadata } from "next";

const tool = getToolBySlug("leverage-calculator")!;

export const metadata: Metadata = {
    title: `${tool.title} | TheNextTrade`,
    description: tool.description,
};

export default function LeverageCalculatorPage() {
    return (
        <ToolPageLayout tool={tool}>
            <LeverageCalc />
        </ToolPageLayout>
    );
}
