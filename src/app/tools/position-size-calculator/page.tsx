import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { PositionSizeCalc } from "@/components/calculator/PositionSizeCalc";
import { getToolBySlug, getToolMetadata } from "@/config/tools-data";
import type { Metadata } from "next";

const tool = getToolBySlug("position-size-calculator")!;

export const metadata: Metadata = getToolMetadata("position-size-calculator");

export default function PositionSizeCalculatorPage() {
    return (
        <ToolPageLayout tool={tool}>
            <PositionSizeCalc />
        </ToolPageLayout>
    );
}
