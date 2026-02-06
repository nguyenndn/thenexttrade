
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { createEAProductSchema, updateEAProductSchema, uploadVersionSchema } from "@/lib/validations/ea-license";
import { ErrorCode } from "@/lib/errors/ea-license";
import { CreateEAProductInput, UpdateEAProductInput } from "@/types/ea-license";

async function checkAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { isAuthorized: false, user: null };
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });

    if (profile?.role !== "ADMIN" && profile?.role !== "EDITOR") {
        return { isAuthorized: false, user };
    }

    return { isAuthorized: true, user };
}

export async function createEAProduct(data: CreateEAProductInput) {
    try {
        const { isAuthorized, user } = await checkAdmin();
        if (!isAuthorized || !user) return { success: false, error: ErrorCode.NOT_ADMIN };

        const validated = createEAProductSchema.safeParse(data);
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message };
        }

        const newProduct = await prisma.eAProduct.create({
            data: {
                ...data,
                isActive: true, // Default active
                totalDownloads: 0,
                // files are uploaded separately or passed as null initially if not handled here.
                // Spec 21 says submit creates product + uploads files.
                // Usually we might receive URLs here if files uploaded client side to signed URL, 
                // OR we handle file upload in this action (need FormData).
                // Since input is defined as CreateEAProductInput (params), I assume URLs are not yet there OR passed as string optional?
                // createEAProductSchema has no file fields.
                // The implementation details in Section 21 might clarify.
                // Assuming we handle file uploads separately using uploadEAFile action after creation or concurrently.
                // OR the data object should have generic fileMT4/fileMT5 urls.
                // The Prisma model has fileMT4, fileMT5.
                // I will assume for now they are null and updated later, or strictly passed if schema allowed.
                // Schema doesn't validate urls.
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

        revalidatePath("/admin/ea/products");
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
        if (!isAuthorized || !user) return { success: false, error: ErrorCode.NOT_ADMIN };

        const validated = updateEAProductSchema.safeParse(data);
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message };
        }

        const product = await prisma.eAProduct.findUnique({ where: { id: productId } });
        if (!product) return { success: false, error: ErrorCode.PRODUCT_NOT_FOUND };

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

        revalidatePath("/admin/ea/products");
        revalidatePath(`/admin/ea/products/${productId}`);
        return { success: true };
    } catch (error) {
        console.error("updateEAProduct error:", error);
        return { success: false, error: ErrorCode.INTERNAL_ERROR };
    }
}

export async function toggleProductStatus(productId: string) {
    try {
        const { isAuthorized, user } = await checkAdmin();
        if (!isAuthorized || !user) return { success: false, error: ErrorCode.NOT_ADMIN };

        const product = await prisma.eAProduct.findUnique({ where: { id: productId } });
        if (!product) return { success: false, error: ErrorCode.PRODUCT_NOT_FOUND };

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

        revalidatePath("/admin/ea/products");
        return { success: true };
    } catch (error) {
        console.error("toggleProductStatus error:", error);
        return { success: false, error: ErrorCode.INTERNAL_ERROR };
    }
}

// Helper for file upload path generation
// logic to process FormData would be here if we use server action upload.
// Section 7.3 says `uploadEAFile(productId, platform, file)`.
// Server Actions take basic types or FormData. passing `File` object implies using FormData in client.
export async function uploadEAFile(
    productId: string,
    platform: "MT4" | "MT5" | "THUMBNAIL",
    formData: FormData
) {
    try {
        const { isAuthorized, user } = await checkAdmin();
        if (!isAuthorized || !user) return { success: false, error: ErrorCode.NOT_ADMIN };

        const file = formData.get("file") as File;
        if (!file) return { success: false, error: "No file provided" };

        const product = await prisma.eAProduct.findUnique({ where: { id: productId } });
        if (!product) return { success: false, error: ErrorCode.PRODUCT_NOT_FOUND };

        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const folder = platform === "MT4" ? "mt4" : platform === "MT5" ? "mt5" : "";
        const name = folder ? `${folder}/${file.name}` : `thumbnail_${file.name}`;
        const path = `${productId}/${name}`;

        const { data: uploadData, error: uploadError } = await supabaseAdmin
            .storage
            .from("ea-products")
            .upload(path, file, {
                upsert: true,
                contentType: file.type || "application/octet-stream",
            });

        if (uploadError) {
            console.error("Upload Error:", uploadError);
            return { success: false, error: "Storage upload failed: " + uploadError.message };
        }

        const updateData: any = {};
        if (platform === "MT4") updateData.fileMT4 = path;
        else if (platform === "MT5") updateData.fileMT5 = path;
        else if (platform === "THUMBNAIL") updateData.thumbnail = supabaseAdmin.storage.from("ea-products").getPublicUrl(path).data.publicUrl;

        await prisma.eAProduct.update({
            where: { id: productId },
            data: updateData,
        });

        revalidatePath(`/admin/ea/products/${productId}`);
        return { success: true, url: path };

    } catch (error) {
        console.error("uploadEAFile error:", error);
        return { success: false, error: ErrorCode.INTERNAL_ERROR };
    }
}
