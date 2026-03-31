import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductDetailClient } from "./ProductDetailClient";

export const metadata: Metadata = {
    title: "Product Detail | Admin",
    description: "View and manage EA product details",
};

export default async function ProductDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    if (!id) return notFound();

    const product = await prisma.eAProduct.findUnique({
        where: { id },
        include: {
            downloads: {
                orderBy: { createdAt: "desc" },
                take: 20,
                include: {
                    user: {
                        select: { id: true, name: true, email: true, image: true },
                    },
                },
            },
            _count: {
                select: { downloads: true },
            },
        },
    });

    if (!product) return notFound();

    // Serialize dates for client component
    const serialized = JSON.parse(JSON.stringify(product));

    return <ProductDetailClient product={serialized} />;
}
