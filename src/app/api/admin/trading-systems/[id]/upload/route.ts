import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ErrorCode } from "@/lib/errors/ea-license";
import {
    hasR2Credentials,
    isR2Configured,
    resolveStorageDirectory,
    uploadProtectedAsset,
    uploadPublicAsset,
} from "@/lib/storage/object-storage";
import { checkAdminApiAccess } from "@/lib/admin/trading-systems/check-admin-api.server";

const MAX_EX5_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_THUMBNAIL_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_THUMBNAIL_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await checkAdminApiAccess();
        if (!auth.isAuthorized || !auth.user) {
            return NextResponse.json(
                { success: false, error: ErrorCode.NOT_ADMIN },
                { status: auth.status }
            );
        }

        const { id: productId } = await params;
        const product = await prisma.eAProduct.findUnique({
            where: { id: productId },
        });
        if (!product) {
            return NextResponse.json(
                { success: false, error: ErrorCode.PRODUCT_NOT_FOUND },
                { status: 404 }
            );
        }

        const formData = await request.formData();
        const rawFile = formData.get("file");
        const platform = String(formData.get("platform") || "MT5");

        if (platform !== "MT5" && platform !== "THUMBNAIL") {
            return NextResponse.json(
                { success: false, error: "Invalid upload target" },
                { status: 400 }
            );
        }

        if (
            !rawFile ||
            typeof rawFile !== "object" ||
            typeof (rawFile as Blob).arrayBuffer !== "function" ||
            typeof (rawFile as File).name !== "string" ||
            (rawFile as Blob).size === 0
        ) {
            return NextResponse.json(
                { success: false, error: "No file provided" },
                { status: 400 }
            );
        }
        const file = rawFile as File;

        const safeFileName = (file.name.split(/[\\/]/).pop() || "").replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );
        if (!safeFileName) {
            return NextResponse.json(
                { success: false, error: "Invalid file name" },
                { status: 400 }
            );
        }

        if (platform === "MT5") {
            if (!safeFileName.toLowerCase().endsWith(".ex5")) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "Only compiled MetaTrader 5 (.ex5) files are accepted",
                    },
                    { status: 400 }
                );
            }
            if (file.size > MAX_EX5_SIZE_BYTES) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `MT5 file is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 25 MB.`,
                    },
                    { status: 413 }
                );
            }
            if (!hasR2Credentials()) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "Object storage (Cloudflare R2) credentials are not configured on this server",
                    },
                    { status: 503 }
                );
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const baseDir = resolveStorageDirectory(
                `trading-systems/${product.id}`
            );
            const storageKey = `${baseDir}/mt5/${safeFileName}`;
            const uploaded = await uploadProtectedAsset(
                buffer,
                storageKey,
                "application/octet-stream"
            );
            if (!uploaded) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "Failed to write .ex5 binary to Cloudflare R2 storage",
                    },
                    { status: 502 }
                );
            }

            await prisma.eAProduct.update({
                where: { id: productId },
                data: { fileMT5: storageKey },
            });

            await prisma.auditLog.create({
                data: {
                    adminId: auth.user.id,
                    action: "PRODUCT_FILE_UPLOADED",
                    targetType: "EAProduct",
                    targetId: productId,
                    details: {
                        platform: "MT5",
                        fileName: safeFileName,
                        sizeBytes: buffer.length,
                        storageKey,
                    },
                },
            });

            revalidateProductRoutes(product.id, product.slug);
            return NextResponse.json({ success: true, url: storageKey });
        }

        const extIndex = safeFileName.lastIndexOf(".");
        const ext =
            extIndex >= 0 ? safeFileName.slice(extIndex).toLowerCase() : "";
        if (!ALLOWED_THUMBNAIL_EXT.has(ext)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Thumbnail must be a JPG, PNG, or WebP image",
                },
                { status: 400 }
            );
        }
        if (file.size > MAX_THUMBNAIL_SIZE_BYTES) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Thumbnail is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`,
                },
                { status: 413 }
            );
        }
        if (!isR2Configured) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Public CDN storage (Cloudflare R2) is not configured on this server",
                },
                { status: 503 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const publicUrl = await uploadPublicAsset(
            buffer,
            `trading-systems/${product.id}`,
            safeFileName,
            file.type || "image/png"
        );
        if (!publicUrl) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Failed to upload thumbnail image to Cloudflare R2",
                },
                { status: 502 }
            );
        }

        await prisma.eAProduct.update({
            where: { id: productId },
            data: { thumbnail: publicUrl },
        });

        await prisma.auditLog.create({
            data: {
                adminId: auth.user.id,
                action: "PRODUCT_FILE_UPLOADED",
                targetType: "EAProduct",
                targetId: productId,
                details: {
                    platform: "THUMBNAIL",
                    fileName: safeFileName,
                    sizeBytes: buffer.length,
                    url: publicUrl,
                },
            },
        });

        revalidateProductRoutes(product.id, product.slug);
        return NextResponse.json({ success: true, url: publicUrl });
    } catch (error) {
        console.error("[Admin EA API] File upload failed:", error);
        return NextResponse.json(
            { success: false, error: ErrorCode.INTERNAL_ERROR },
            { status: 500 }
        );
    }
}

function revalidateProductRoutes(productId: string, slug: string) {
    revalidatePath("/admin/trading-systems");
    revalidatePath("/admin/trading-systems/products");
    revalidatePath(`/admin/trading-systems/${productId}`);
    revalidatePath(`/admin/trading-systems/${slug}`);
    revalidatePath("/dashboard/trading-systems");
    revalidatePath(`/dashboard/trading-systems/${slug}`);
    revalidatePath("/trading-systems");
    revalidatePath(`/trading-systems/${slug}`);
}
