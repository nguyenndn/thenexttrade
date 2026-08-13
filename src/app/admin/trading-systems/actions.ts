"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
    createEAProductSchema,
    updateEAProductSchema,
} from "@/lib/validations/ea-license";
import { ErrorCode } from "@/lib/errors/ea-license";
import { CreateEAProductInput, UpdateEAProductInput } from "@/types/ea-license";

async function checkAdmin() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { isAuthorized: false, user: null };
    }

    const { data: aal, error: aalError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (
        aalError ||
        (aal && aal.currentLevel === "aal1" && aal.nextLevel === "aal2")
    ) {
        return { isAuthorized: false, user: null };
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });

    if (profile?.role !== "ADMIN") {
        return { isAuthorized: false, user };
    }

    return { isAuthorized: true, user };
}

export async function createEAProduct(data: CreateEAProductInput) {
    try {
        const { isAuthorized, user } = await checkAdmin();
        if (!isAuthorized || !user)
            return { success: false, error: ErrorCode.NOT_ADMIN };

        const validated = createEAProductSchema.safeParse(data);
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message };
        }

        const newProduct = await prisma.eAProduct.create({
            data: {
                ...data,
                isActive: true,
                totalDownloads: 0,
            },
        });

        await prisma.auditLog.create({
            data: {
                adminId: user.id,
                action: "PRODUCT_CREATED",
                targetType: "EAProduct",
                targetId: newProduct.id,
                details: { name: newProduct.name, type: newProduct.type },
            },
        });

        revalidatePath("/admin/trading-systems");
        return { success: true, data: newProduct };
    } catch (error) {
        console.error("createEAProduct error:", error);
        return { success: false, error: ErrorCode.INTERNAL_ERROR };
    }
}

export async function updateEAProduct(
    productId: string,
    data: UpdateEAProductInput
) {
    try {
        const { isAuthorized, user } = await checkAdmin();
        if (!isAuthorized || !user)
            return { success: false, error: ErrorCode.NOT_ADMIN };

        const validated = updateEAProductSchema.safeParse(data);
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message };
        }

        const product = await prisma.eAProduct.findUnique({
            where: { id: productId },
        });
        if (!product)
            return { success: false, error: ErrorCode.PRODUCT_NOT_FOUND };

        await prisma.eAProduct.update({
            where: { id: productId },
            data: data,
        });

        await prisma.auditLog.create({
            data: {
                adminId: user.id,
                action: "PRODUCT_UPDATED",
                targetType: "EAProduct",
                targetId: productId,
                details: JSON.parse(JSON.stringify({ changes: data })),
            },
        });

        revalidatePath("/admin/trading-systems");
        revalidatePath(`/admin/trading-systems/${productId}`);
        return { success: true };
    } catch (error) {
        console.error("updateEAProduct error:", error);
        return { success: false, error: ErrorCode.INTERNAL_ERROR };
    }
}

export async function toggleProductStatus(productId: string) {
    try {
        const { isAuthorized, user } = await checkAdmin();
        if (!isAuthorized || !user)
            return { success: false, error: ErrorCode.NOT_ADMIN };

        const product = await prisma.eAProduct.findUnique({
            where: { id: productId },
        });
        if (!product)
            return { success: false, error: ErrorCode.PRODUCT_NOT_FOUND };

        const newStatus = !product.isActive;

        await prisma.eAProduct.update({
            where: { id: productId },
            data: { isActive: newStatus },
        });

        await prisma.auditLog.create({
            data: {
                adminId: user.id,
                action: "PRODUCT_STATUS_CHANGED",
                targetType: "EAProduct",
                targetId: productId,
                details: { isActive: newStatus },
            },
        });

        revalidatePath("/admin/trading-systems");
        return { success: true };
    } catch (error) {
        console.error("toggleProductStatus error:", error);
        return { success: false, error: ErrorCode.INTERNAL_ERROR };
    }
}

// Helper for file upload path generation
export async function uploadEAFile(
    productId: string,
    platform: "MT4" | "MT5" | "THUMBNAIL",
    formData: FormData
) {
    try {
        const { isAuthorized, user } = await checkAdmin();
        if (!isAuthorized || !user)
            return { success: false, error: ErrorCode.NOT_ADMIN };

        const file = formData.get("file") as File;
        if (!file) return { success: false, error: "No file provided" };

        const product = await prisma.eAProduct.findUnique({
            where: { id: productId },
        });
        if (!product)
            return { success: false, error: ErrorCode.PRODUCT_NOT_FOUND };

        const { uploadPublicAsset, uploadProtectedAsset } = await import("@/lib/storage/object-storage");

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const folder =
            platform === "MT4" ? "mt4" : platform === "MT5" ? "mt5" : "";
        const name = folder
            ? `${folder}/${file.name}`
            : `thumbnail_${file.name}`;
        
        let path = "";
        let finalUrl = "";

        if (platform === "THUMBNAIL") {
            const publicUrl = await uploadPublicAsset(buffer, `trading-systems/${productId}`, file.name, file.type || "image/png");
            if (!publicUrl) {
                return { success: false, error: "Thumbnail upload failed" };
            }
            finalUrl = publicUrl;
        } else {
            path = `trading-systems/${productId}/${name}`;
            const success = await uploadProtectedAsset(buffer, path, file.type || "application/octet-stream");
            if (!success) {
                return { success: false, error: "Protected file upload failed" };
            }
        }

        const updateData: any = {};
        if (platform === "MT4") updateData.fileMT4 = path;
        else if (platform === "MT5") updateData.fileMT5 = path;
        else if (platform === "THUMBNAIL") updateData.thumbnail = finalUrl;

        await prisma.eAProduct.update({
            where: { id: productId },
            data: updateData,
        });

        revalidatePath(`/admin/trading-systems/${productId}`);
        return { success: true, url: path || finalUrl };
    } catch (error) {
        console.error("uploadEAFile error:", error);
        return { success: false, error: ErrorCode.INTERNAL_ERROR };
    }
}

export async function deleteEAProduct(productId: string) {
    try {
        const { isAuthorized, user } = await checkAdmin();
        if (!isAuthorized || !user) return { success: false, error: ErrorCode.NOT_ADMIN };

        const product = await prisma.eAProduct.findUnique({ where: { id: productId } });
        if (!product) return { success: false, error: ErrorCode.PRODUCT_NOT_FOUND };

        await prisma.eAProduct.delete({ where: { id: productId } });

        await prisma.auditLog.create({
            data: {
                adminId: user.id,
                action: "PRODUCT_DELETED",
                targetType: "EAProduct",
                targetId: productId,
                details: { name: product.name },
            },
        });

        revalidatePath("/admin/trading-systems");
        return { success: true };
    } catch (error) {
        console.error("deleteEAProduct error:", error);
        return { success: false, error: ErrorCode.INTERNAL_ERROR };
    }
}
