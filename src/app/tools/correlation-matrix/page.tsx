import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { CorrelationMatrix } from "@/components/tools/CorrelationMatrix";
import { getToolBySlug, getToolMetadata } from "@/config/tools-data";
import type { Metadata } from "next";

const tool = getToolBySlug("correlation-matrix")!;

export const metadata: Metadata = getToolMetadata("correlation-matrix");

export default function CorrelationMatrixPage() {
    return (
        <ToolPageLayout tool={tool}>
            <CorrelationMatrix />
        </ToolPageLayout>
    );
}
