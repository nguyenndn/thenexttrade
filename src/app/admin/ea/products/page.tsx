
import { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { Bot, Download, Monitor, Plus, Edit, Power, Trash2, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge"; // Or just custom badge
import { EAType, PlatformType } from "@prisma/client";
import { toggleProductStatus } from "@/app/admin/ea/products/actions";
// Note: toggleProductStatus is a server action, cannot be called directly from onClick in Server Component.
// Buttons need to be wrapped in Client Component or use form actions.
// I'll create a Client Component for the Row Actions or the whole list.
// For simplicity, let's create `ProductList.tsx` client component.

import { ProductList } from "@/components/admin/ea/ProductList";

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
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 dark:border-white/10 pb-8">
                <div className="flex items-center gap-3">
                    <Link href="/admin/ea" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors shrink-0" title="Back to EA Dashboard">
                        <ArrowLeft size={20} className="text-gray-500" />
                    </Link>
                    <div className="w-1.5 h-8 bg-primary rounded-full shrink-0" aria-hidden="true"></div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                        EA Products
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin/ea/products/create">
                        <Button variant="primary" className="shadow-lg shadow-primary/30">
                            <Plus size={18} strokeWidth={2.5} />
                            Create Product
                        </Button>
                    </Link>
                </div>
            </div>

            <ProductList products={products} />
        </div>
    );
}
