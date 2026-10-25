import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductDetailClient } from "./ProductDetailClient";
import { requireAdminPageAccess } from "@/lib/admin/auth.server";
import { buildProductFarmData } from "@/lib/admin/trading-systems/ea-farm-stats.server";

export const metadata: Metadata = {
    title: "Product Detail | Admin",
    description: "View and manage EA product details, farm capital, and active users",
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

export default async function ProductDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await requireAdminPageAccess();
    const { id } = await params;
    if (!id) return notFound();

    const product = await prisma.eAProduct.findUnique({
        where: { id },
        include: {
            downloads: {
                orderBy: { createdAt: "desc" },
                take: 100,
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
            accessRecords: {
                where: { status: "GRANTED" },
                orderBy: { createdAt: "desc" },
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
            _count: {
                select: { downloads: true, accessRecords: true },
            },
        },
    });

    if (!product) return notFound();

    const { activeUsers, farmStats } = buildProductFarmData(product);

    // Serialize dates for client component
    const serialized = JSON.parse(
        JSON.stringify({
            ...product,
            usageEvents: undefined,
            activeUsers,
            farmStats,
            activeLicensesCount: activeUsers.length,
        })
    );

    return <ProductDetailClient product={serialized} />;
}
