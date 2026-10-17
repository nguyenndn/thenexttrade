import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FibonacciCalc } from "@/components/calculator/FibonacciCalc";
import { getToolBySlug, getToolMetadata } from "@/config/tools-data";
import type { Metadata } from "next";

const tool = getToolBySlug("fibonacci-calculator")!;

export const metadata: Metadata = getToolMetadata("fibonacci-calculator");

export const revalidate = 86400;

export default function FibonacciCalculatorPage() {
    return (
        <ToolPageLayout tool={tool}>
            <FibonacciCalc />
        </ToolPageLayout>
    );
}
