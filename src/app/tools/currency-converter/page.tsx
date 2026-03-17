import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { CurrencyConverter } from "@/components/tools/CurrencyConverter";
import { getToolBySlug } from "@/config/tools-data";
import type { Metadata } from "next";

const tool = getToolBySlug("currency-converter")!;

export const metadata: Metadata = {
    title: tool.title,
    description: tool.description,
};

export default function CurrencyConverterPage() {
    return (
        <ToolPageLayout tool={tool}>
            <CurrencyConverter />
        </ToolPageLayout>
    );
}
