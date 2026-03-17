import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { PivotPointCalc } from "@/components/calculator/PivotPointCalc";
import { getToolBySlug } from "@/config/tools-data";
import type { Metadata } from "next";

const tool = getToolBySlug("pivot-point-calculator")!;

export const metadata: Metadata = {
    title: `${tool.title} | TheNextTrade`,
    description: tool.description,
};

export default function PivotPointCalculatorPage() {
    return (
        <ToolPageLayout tool={tool}>
            <PivotPointCalc />
        </ToolPageLayout>
    );
}
