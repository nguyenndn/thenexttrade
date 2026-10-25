import { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { ProductList } from "@/components/admin/trading-systems/ProductList";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requireAdminPageAccess } from "@/lib/admin/auth.server";
import { buildProductFarmData } from "@/lib/admin/trading-systems/ea-farm-stats.server";

export const metadata: Metadata = {
    title: "EA Products | Admin",
    description: "Manage EA products, telemetry, and farm capital",
};

export const dynamic = "force-dynamic";

const ACCOUNT_SELECT = {
    id: true,
    accountNumber: true,
    broker: true,
    server: true,
    platform: true,
    accountType: true,
    balance: true,
    equity: true,
    currency: true,
    status: true,
    lastHeartbeat: true,
    lastSync: true,
} as const;

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
                                tradingAccounts: {
                                    select: ACCOUNT_SELECT,
                                },
                            },
                        },
                        tradingAccount: {
                            select: ACCOUNT_SELECT,
                        },
                    },
                    orderBy: { createdAt: "desc" },
                },
                usageEvents: {
                    orderBy: { occurredAt: "desc" },
                    take: 250,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                                tradingAccounts: {
                                    select: ACCOUNT_SELECT,
                                },
                            },
                        },
                        tradingAccount: {
                            select: ACCOUNT_SELECT,
                        },
                    },
                },
                downloads: {
                    orderBy: { createdAt: "desc" },
                    take: 250,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                                tradingAccounts: {
                                    select: ACCOUNT_SELECT,
                                },
                            },
                        },
                    },
                },
            },
        });

        products = rawProducts.map((p) => {
            const { activeUsers, farmStats } = buildProductFarmData(p);

            return {
                ...p,
                accessRecords: undefined,
                usageEvents: undefined,
                downloads: undefined,
                activeUsers,
                farmStats,
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
                description="Manage EA products, live MT4/MT5 account telemetry, and EA Farm capital."
                backHref="/admin/trading-systems"
            >
                <Link href="/admin/trading-systems/create">
                    <Button
                        variant="primary"
                        className="shadow-lg shadow-amber-500/30"
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
