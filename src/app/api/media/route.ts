import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import {
    isR2Configured,
    uploadPublicAsset,
} from "@/lib/storage/object-storage";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    try {
        const where = search
            ? {
                  OR: [
                      { filename: { contains: search, mode: "insensitive" } },
                      { alt: { contains: search, mode: "insensitive" } },
                  ],
              }
            : {};

        const [total, media] = await Promise.all([
            prisma.media.count({ where: where as any }),
            prisma.media.findMany({
                where: where as any,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
        ]);

        return NextResponse.json({
            media,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch media" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const user = auth.user;

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Import sharp explicitly inside the function to prevent build errors if missing at runtime
        const sharp = require("sharp");

        // Create filenames (always .webp)
        const timestamp = Date.now();
        const safeName = file.name
            .replace(/\.[^/.]+$/, "")
            .replace(/[^a-z0-9]/gi, "_")
            .toLowerCase();

        const mainFilename = `${timestamp}-${safeName}.webp`;
        const thumbFilename = `${timestamp}-${safeName}-thumb.webp`;

        // Process images in parallel
        // 1. Main Image: Resize if too large (>2560px), convert to WebP
        const mainBuffer = await sharp(buffer)
            .resize({ width: 2560, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer({ resolveWithObject: true });

        // 2. Thumbnail: Resize to 300px width, convert to WebP
        const thumbBuffer = await sharp(buffer)
            .resize({ width: 300 })
            .webp({ quality: 60 })
            .toBuffer({ resolveWithObject: true });

        let url = `/uploads/${mainFilename}`;
        let thumbnailUrl = `/uploads/${thumbFilename}`;

        if (isR2Configured) {
            // Upload to Cloudflare R2
            const mainR2Url = await uploadPublicAsset(
                mainBuffer.data,
                "uploads",
                mainFilename,
                "image/webp"
            );
            const thumbR2Url = await uploadPublicAsset(
                thumbBuffer.data,
                "uploads",
                thumbFilename,
                "image/webp"
            );

            if (mainR2Url && thumbR2Url) {
                url = mainR2Url;
                thumbnailUrl = thumbR2Url;
            } else {
                throw new Error("Failed to upload to Object Storage");
            }
        } else {
            // Fallback to local
            const uploadDir = path.join(process.cwd(), "public", "uploads");
            await mkdir(uploadDir, { recursive: true });

            await writeFile(
                path.join(uploadDir, mainFilename),
                mainBuffer.data
            );
            await writeFile(
                path.join(uploadDir, thumbFilename),
                thumbBuffer.data
            );
        }

        const mainInfo = mainBuffer.info;

        // Save to DB
        console.log("Saving to DB...", {
            filename: mainFilename,
            url,
            type: "image/webp",
            size: mainInfo.size,
            userId: user.id,
        });

        const media = await prisma.media.create({
            data: {
                filename: mainFilename, // Storing new .webp name
                url,
                thumbnailUrl,
                type: "image/webp",
                size: mainInfo.size,
                width: mainInfo.width,
                height: mainInfo.height,
                userId: user.id,
                alt: "",
                caption: "",
            },
        });

        console.log("DB Save Success:", media.id);
        return NextResponse.json(media);
    } catch (error) {
        console.error("Upload failed details:", error);
        return NextResponse.json(
            { error: "Upload failed: " + (error as any).message },
            { status: 500 }
        );
    }
}
