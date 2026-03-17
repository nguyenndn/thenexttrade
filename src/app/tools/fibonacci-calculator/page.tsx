import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FibonacciCalc } from "@/components/calculator/FibonacciCalc";
import { getToolBySlug } from "@/config/tools-data";
import type { Metadata } from "next";

const tool = getToolBySlug("fibonacci-calculator")!;

export const metadata: Metadata = {
    title: `${tool.title} | TheNextTrade`,
    description: tool.description,
};

export default function FibonacciCalculatorPage() {
    return (
        <ToolPageLayout tool={tool}>
            <FibonacciCalc />
        </ToolPageLayout>
    );
}
