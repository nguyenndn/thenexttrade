import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { PivotPointCalc } from "@/components/calculator/PivotPointCalc";
import { getToolBySlug, getToolMetadata } from "@/config/tools-data";
import type { Metadata } from "next";

const tool = getToolBySlug("pivot-point-calculator")!;

export const metadata: Metadata = getToolMetadata("pivot-point-calculator");

export default function PivotPointCalculatorPage() {
    return (
        <ToolPageLayout tool={tool}>
            <PivotPointCalc />
        </ToolPageLayout>
    );
}
