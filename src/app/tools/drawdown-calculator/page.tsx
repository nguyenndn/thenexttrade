import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { DrawdownCalc } from "@/components/calculator/DrawdownCalc";
import { getToolBySlug, getToolMetadata } from "@/config/tools-data";
import type { Metadata } from "next";

const tool = getToolBySlug("drawdown-calculator")!;

export const metadata: Metadata = getToolMetadata("drawdown-calculator");

export default function DrawdownCalculatorPage() {
    return (
        <ToolPageLayout tool={tool}>
            <DrawdownCalc />
        </ToolPageLayout>
    );
}
