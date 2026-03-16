
import { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { ProductList } from "@/components/admin/ea/ProductList";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata: Metadata = {
    title: "EA Products | Admin",
    description: "Manage EA products and versions",
};

export default async function EAProductsPage() {
    let products: any[] = [];
    try {
        products = await prisma.eAProduct.findMany({
            orderBy: { createdAt: "desc" },
        });
    } catch (error) {
        console.error("Failed to load EA products:", error);
    }

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="EA Products"
                description="Manage EA products and versions."
                backHref="/admin/ea"
            >
                <Link href="/admin/ea/products/create">
                    <Button variant="primary" className="shadow-lg shadow-primary/30">
                        <Plus size={18} strokeWidth={2.5} />
                        Create Product
                    </Button>
                </Link>
            </AdminPageHeader>

            <ProductList products={products} />
        </div>
    );
}

