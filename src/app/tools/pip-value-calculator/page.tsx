import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { PipValueCalc } from "@/components/calculator/PipValueCalc";
import { getToolBySlug, getToolMetadata } from "@/config/tools-data";
import type { Metadata } from "next";

const tool = getToolBySlug("pip-value-calculator")!;

export const metadata: Metadata = getToolMetadata("pip-value-calculator");

export default function PipValueCalculatorPage() {
    return (
        <ToolPageLayout tool={tool}>
            <PipValueCalc />
        </ToolPageLayout>
    );
}
