"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ==========================================
// EA BROKER ACTIONS
// ==========================================

export async function getEABrokers() {
    try {
        const brokers = await prisma.eABroker.findMany({
            orderBy: { order: "asc" },
        });
        return { success: true, data: brokers };
    } catch (error) {
        console.error("Failed to fetch EA brokers:", error);
        return { success: false, error: "Failed to fetch brokers", data: [] };
    }
}

export async function getActiveEABrokers() {
    try {
        const brokers = await prisma.eABroker.findMany({
            where: { isActive: true },
            orderBy: { order: "asc" },
        });
        return brokers;
    } catch (error) {
        console.error("Failed to fetch active EA brokers:", error);
        return [];
    }
}

export async function createEABroker(data: {
    name: string;
    slug: string;
    logo: string;
    affiliateUrl?: string;
    ibCode?: string | null;
    color?: string;
    isActive?: boolean;
    order?: number;
}) {
    try {
        const broker = await prisma.eABroker.create({
            data: {
                name: data.name,
                slug: data.slug.toUpperCase(),
                logo: data.logo,
                affiliateUrl: data.affiliateUrl || null,
                ibCode: data.ibCode || null,
                color: data.color || "#00C888",
                isActive: data.isActive ?? true,
                order: data.order ?? 0,
            }
        });

        revalidatePath("/admin/ea");
        revalidatePath("/admin/ea/brokers");
        revalidatePath("/dashboard/trading-systems");
        return { success: true, data: broker };
    } catch (error: any) {
        console.error("Failed to create EA broker:", error);
        if (error?.code === "P2002") {
            return { success: false, error: "A broker with this slug already exists" };
        }
        return { success: false, error: "Failed to create broker" };
    }
}

export async function updateEABroker(id: string, data: {
    name?: string;
    slug?: string;
    logo?: string;
    affiliateUrl?: string | null;
    ibCode?: string | null;
    color?: string;
    isActive?: boolean;
    order?: number;
}) {
    try {
        const updateData: any = { ...data };
        if (data.slug) updateData.slug = data.slug.toUpperCase();

        const broker = await prisma.eABroker.update({
            where: { id },
            data: updateData,
        });

        revalidatePath("/admin/ea");
        revalidatePath("/admin/ea/brokers");
        revalidatePath("/dashboard/trading-systems");
        return { success: true, data: broker };
    } catch (error: any) {
        console.error("Failed to update EA broker:", error);
        if (error?.code === "P2002") {
            return { success: false, error: "A broker with this slug already exists" };
        }
        return { success: false, error: "Failed to update broker" };
    }
}

export async function deleteEABroker(id: string) {
    try {
        await prisma.eABroker.delete({ where: { id } });

        revalidatePath("/admin/ea");
        revalidatePath("/admin/ea/brokers");
        revalidatePath("/dashboard/trading-systems");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete EA broker:", error);
        return { success: false, error: "Failed to delete broker" };
    }
}
