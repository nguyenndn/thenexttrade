"use client";

import { EAProduct } from "@/types/ea-license";
import { ProductForm } from "@/components/admin/ea/ProductForm";

interface EditProductViewProps {
    product: EAProduct;
}

export function EditProductView({ product }: EditProductViewProps) {
    return (
        <div className="w-full">
            <ProductForm initialData={product} />
        </div>
    );
}
