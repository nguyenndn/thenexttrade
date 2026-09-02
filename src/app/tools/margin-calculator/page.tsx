import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { MarginCalc } from "@/components/calculator/MarginCalc";
import { getToolBySlug, getToolMetadata } from "@/config/tools-data";
import type { Metadata } from "next";

const tool = getToolBySlug("margin-calculator")!;

export const metadata: Metadata = getToolMetadata("margin-calculator");

export default function MarginCalculatorPage() {
    return (
        <ToolPageLayout tool={tool}>
            <MarginCalc />
        </ToolPageLayout>
    );
}
