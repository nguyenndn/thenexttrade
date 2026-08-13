import { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { ProductList } from "@/components/admin/trading-systems/ProductList";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requireAdminPageAccess } from "@/lib/admin/auth.server";

export const metadata: Metadata = {
    title: "EA Products | Admin",
    description: "Manage EA products and versions",
};

export const dynamic = "force-dynamic";

export default async function EAProductsPage() {
    await requireAdminPageAccess();
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
                title="Trading Systems Catalog"
                description="Manage EA products, indicators, and file versions."
                backHref="/admin/trading-systems"
            >
                <Link href="/admin/trading-systems/create">
                    <Button
                        variant="primary"
                        className="shadow-lg shadow-primary/30"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        Create Product
                    </Button>
                </Link>
            </AdminPageHeader>

            <ProductList products={products} />
        </div>
    );
}
