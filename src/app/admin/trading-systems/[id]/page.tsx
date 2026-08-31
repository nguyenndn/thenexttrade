import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductDetailClient } from "./ProductDetailClient";
import { requireAdminPageAccess } from "@/lib/admin/auth.server";

export const metadata: Metadata = {
    title: "Product Detail | Admin",
    description: "View and manage EA product details",
};

export const dynamic = "force-dynamic";

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
                take: 50,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
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
            },
            _count: {
                select: { downloads: true, accessRecords: true },
            },
        },
    });

    if (!product) return notFound();

    const activeUsers = product.accessRecords
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

    // Serialize dates for client component
    const serialized = JSON.parse(
        JSON.stringify({
            ...product,
            activeUsers,
            activeLicensesCount: activeUsers.length,
        })
    );

    return <ProductDetailClient product={serialized} />;
}
