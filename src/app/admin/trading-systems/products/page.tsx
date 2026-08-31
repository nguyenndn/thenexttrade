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
        const rawProducts = await prisma.eAProduct.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: {
                        downloads: true,
                        accessRecords: {
                            where: { status: "GRANTED" },
                        },
                    },
                },
                accessRecords: {
                    where: { status: "GRANTED" },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                                createdAt: true,
                            },
                        },
                        tradingAccount: {
                            select: {
                                accountNumber: true,
                                broker: true,
                                server: true,
                                platform: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        products = rawProducts.map((p) => {
            const activeUsers = p.accessRecords
                .filter((ar) => ar.user)
                .map((ar) => ({
                    id: ar.id,
                    userId: ar.user.id,
                    name: ar.user.name || ar.user.email?.split("@")[0] || "Trader",
                    email: ar.user.email || "",
                    image: ar.user.image,
                    accountNumber: ar.tradingAccount?.accountNumber || "—",
                    broker: ar.tradingAccount?.broker || "Custom Broker",
                    server: ar.tradingAccount?.server || null,
                    platform: ar.tradingAccount?.platform || "MT5",
                    status: ar.status,
                    grantedAt: ar.createdAt ? ar.createdAt.toISOString() : null,
                    lastUsedAt: ar.lastUsedAt ? ar.lastUsedAt.toISOString() : null,
                }));

            return {
                ...p,
                accessRecords: undefined,
                activeUsers,
                activeLicensesCount: activeUsers.length,
            };
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
