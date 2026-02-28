"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { EAType, PlatformType } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";

// ==========================================
// EA PRODUCTS ACTIONS
// ==========================================

export async function createEAProduct(data: {
    name: string;
    description: string;
    type: EAType;
    platform: PlatformType;
    version: string;
    changelog: string;
    fileMT4?: string;
    fileMT5?: string;
    thumbnail?: string;
    isActive: boolean;
    isFree: boolean;
}) {
    try {
        let slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

        // Ensure slug is unique
        const existing = await prisma.eAProduct.findUnique({ where: { slug } });
        if (existing) {
            slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
        }

        const product = await prisma.eAProduct.create({
            data: {
                ...data,
                slug,
            },
        });

        revalidatePath("/admin/ea/products");
        return { success: true, data: product };
    } catch (error) {
        console.error("Failed to create product:", error);
        return { success: false, error: "Failed to create product (likely duplicate name/slug)" };
    }
}

export async function updateEAProduct(id: string, data: {
    name: string;
    description: string;
    type: EAType;
    platform: PlatformType;
    version: string;
    changelog: string;
    fileMT4?: string;
    fileMT5?: string;
    thumbnail?: string;
    isActive: boolean;
    isFree: boolean;
    slug?: string;
}) {
    try {
        const product = await prisma.eAProduct.update({
            where: { id },
            data,
        });

        revalidatePath("/admin/ea/products");
        return { success: true, data: product };
    } catch (error) {
        console.error("Failed to update product:", error);
        return { success: false, error: "Failed to update product" };
    }
}

export async function deleteEAProduct(id: string) {
    try {
        await prisma.eAProduct.delete({
            where: { id },
        });

        revalidatePath("/admin/ea/products");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete product:", error);
        return { success: false, error: "Failed to delete product" };
    }
}

// ==========================================
// EA LICENSES ACTIONS
// ==========================================

export async function approveLicense(id: string, adminId: string, data: {
    expiryDate?: Date;
    note?: string;
}) {
    try {
        const license = await prisma.eALicense.update({
            where: { id },
            data: {
                status: "APPROVED",
                startDate: new Date(),
                expiryDate: data.expiryDate,
                note: data.note,
                approvedBy: adminId,
                approvedAt: new Date(),
            },
        });

        // TODO: Send Notification (Phase 31.6)

        revalidatePath("/admin/ea/accounts");
        return { success: true, data: license };
    } catch (error) {
        console.error("Failed to approve license:", error);
        return { success: false, error: "Failed to approve license" };
    }
}

export async function rejectLicense(id: string, adminId: string, reason: string) {
    try {
        const license = await prisma.eALicense.update({
            where: { id },
            data: {
                status: "REJECTED",
                rejectedBy: adminId,
                rejectedAt: new Date(),
                rejectReason: reason,
            },
        });

        // TODO: Send Notification (Phase 31.6)

        revalidatePath("/admin/ea/accounts");
        return { success: true, data: license };
    } catch (error) {
        console.error("Failed to reject license:", error);
        return { success: false, error: "Failed to reject license" };
    }
}

export async function deleteLicense(id: string) {
    try {
        await prisma.eALicense.delete({
            where: { id },
        });

        revalidatePath("/admin/ea/accounts");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete license:", error);
        return { success: false, error: "Failed to delete license" };
    }
}
