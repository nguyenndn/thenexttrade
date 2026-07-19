import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { CompoundingCalc } from "@/components/calculator/CompoundingCalc";
import { getToolBySlug } from "@/config/tools-data";
import type { Metadata } from "next";

const tool = getToolBySlug("compounding-calculator")!;

export const metadata: Metadata = {
    title: `${tool.title} | TheNextTrade`,
    description: tool.description,
};

export default function CompoundingCalculatorPage() {
    return (
        <ToolPageLayout tool={tool}>
            <CompoundingCalc />
        </ToolPageLayout>
    );
}
