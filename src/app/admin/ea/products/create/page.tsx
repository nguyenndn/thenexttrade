import { Metadata } from "next";
import { ProductForm } from "@/components/admin/ea/ProductForm";

export const metadata: Metadata = {
    title: "Create Product | Admin",
    description: "Create a new EA product",
};

export default function CreateProductPage() {
    return (
        <div className="w-full">
            <ProductForm />
        </div>
    );
}
