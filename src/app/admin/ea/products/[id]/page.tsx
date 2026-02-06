
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EAProductForm } from "@/components/admin/ea/EAProductForm";
import { UploadVersionModal } from "@/components/admin/ea/UploadVersionModal";
// Note: UploadVersionModal is client component, but I cannot render it directly here if state is needed trigger.
// I'll create `EditProductView.tsx` Client Component wrapping the form and modal logic.
import { EditProductView } from "@/components/admin/ea/EditProductView";

export const metadata: Metadata = {
    title: "Edit Product | Admin",
    description: "Edit EA product details and versions",
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = await prisma.eAProduct.findUnique({
        where: { id },
    });

    if (!product) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <EditProductView product={product} />
        </div>
    );
}
