'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getBrokers() {
    try {
        const brokers = await prisma.broker.findMany({
            orderBy: { order: 'asc' }
        });
        return { success: true, data: brokers };
    } catch (error) {
        console.error("Error fetching brokers:", error);
        return { success: false, error: "Failed to fetch brokers" };
    }
}

export async function getBroker(id: string) {
    try {
        const broker = await prisma.broker.findUnique({
            where: { id }
        });
        return { success: true, data: broker };
    } catch (error) {
        console.error("Error fetching broker:", error);
        return { success: false, error: "Failed to fetch broker" };
    }
}

export async function createBroker(data: {
    name: string;
    slug: string;
    logo: string;
    rating: number;
    summary?: string;
    features: string[];
    affiliateUrl?: string;
    isRecommended?: boolean;
    isVisible?: boolean;
}) {
    try {
        const broker = await prisma.broker.create({
            data: {
                ...data,
                features: data.features // Prisma handles array natively in Postgres
            }
        });
        revalidatePath('/brokers');
        revalidatePath('/admin/brokers');
        return { success: true, data: broker };
    } catch (error) {
        console.error("Error creating broker:", error);
        return { success: false, error: "Failed to create broker" };
    }
}

export async function updateBroker(id: string, data: any) {
    try {
        const broker = await prisma.broker.update({
            where: { id },
            data
        });
        revalidatePath('/brokers');
        revalidatePath('/admin/brokers');
        return { success: true, data: broker };
    } catch (error) {
        console.error("Error updating broker:", error);
        return { success: false, error: "Failed to update broker" };
    }
}

export async function deleteBroker(id: string) {
    try {
        await prisma.broker.delete({
            where: { id }
        });
        revalidatePath('/brokers');
        revalidatePath('/admin/brokers');
        return { success: true };
    } catch (error) {
        console.error("Error deleting broker:", error);
        return { success: false, error: "Failed to delete broker" };
    }
}
