
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
    const products = await prisma.eAProduct.findMany({
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/ea" className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-gray-500 transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            EA Products
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Manage trading robots and indicators
                        </p>
                    </div>
                </div>
                <Link href="/admin/ea/products/create">
                    <Button variant="primary" className="bg-primary hover:bg-[#00B078] text-white">
                        <Plus size={18} className="mr-2" />
                        Create Product
                    </Button>
                </Link>
            </div>

            <ProductList products={products} />
        </div>
    );
}
