import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { MarginCalc } from "@/components/calculator/MarginCalc";
import { getToolBySlug } from "@/config/tools-data";
import type { Metadata } from "next";

const tool = getToolBySlug("margin-calculator")!;

export const metadata: Metadata = {
    title: `${tool.title} | TheNextTrade`,
    description: tool.description,
};

export default function MarginCalculatorPage() {
    return (
        <ToolPageLayout tool={tool}>
            <MarginCalc />
        </ToolPageLayout>
    );
}
