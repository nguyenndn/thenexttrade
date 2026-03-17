import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { PositionSizeCalc } from "@/components/calculator/PositionSizeCalc";
import { getToolBySlug } from "@/config/tools-data";
import type { Metadata } from "next";

const tool = getToolBySlug("position-size-calculator")!;

export const metadata: Metadata = {
    title: `${tool.title} | TheNextTrade`,
    description: tool.description,
};

export default function PositionSizeCalculatorPage() {
    return (
        <ToolPageLayout tool={tool}>
            <PositionSizeCalc />
        </ToolPageLayout>
    );
}
