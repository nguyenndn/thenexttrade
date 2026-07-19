import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { CurrencyHeatMap } from "@/components/tools/CurrencyHeatMap";
import { getToolBySlug } from "@/config/tools-data";
import type { Metadata } from "next";

const tool = getToolBySlug("currency-heat-map")!;

export const metadata: Metadata = {
    title: tool.title,
    description: tool.description,
};

export default function CurrencyHeatMapPage() {
    return (
        <ToolPageLayout tool={tool}>
            <CurrencyHeatMap />
        </ToolPageLayout>
    );
}
