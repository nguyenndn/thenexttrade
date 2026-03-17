import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { CorrelationMatrix } from "@/components/tools/CorrelationMatrix";
import { getToolBySlug } from "@/config/tools-data";
import type { Metadata } from "next";

const tool = getToolBySlug("correlation-matrix")!;

export const metadata: Metadata = {
    title: tool.title,
    description: tool.description,
};

export default function CorrelationMatrixPage() {
    return (
        <ToolPageLayout tool={tool}>
            <CorrelationMatrix />
        </ToolPageLayout>
    );
}
