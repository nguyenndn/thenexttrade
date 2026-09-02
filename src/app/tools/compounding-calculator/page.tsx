import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { CompoundingCalc } from "@/components/calculator/CompoundingCalc";
import { getToolBySlug, getToolMetadata } from "@/config/tools-data";
import type { Metadata } from "next";

const tool = getToolBySlug("compounding-calculator")!;

export const metadata: Metadata = getToolMetadata("compounding-calculator");

export default function CompoundingCalculatorPage() {
    return (
        <ToolPageLayout tool={tool}>
            <CompoundingCalc />
        </ToolPageLayout>
    );
}
