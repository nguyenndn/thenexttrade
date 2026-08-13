import { Metadata } from "next";
import { ProductForm } from "@/components/admin/trading-systems/ProductForm";
import { requireAdminPageAccess } from "@/lib/admin/auth.server";

export const metadata: Metadata = {
    title: "Create Product | Admin",
    description: "Create a new EA product",
};

export default async function CreateProductPage() {
    await requireAdminPageAccess();

    return (
        <div className="w-full">
            <ProductForm />
        </div>
    );
}
