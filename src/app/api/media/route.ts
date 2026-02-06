
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    try {
        const where = search ? {
            OR: [
                { filename: { contains: search, mode: "insensitive" } },
                { alt: { contains: search, mode: "insensitive" } },
            ]
        } : {};

        const [total, media] = await Promise.all([
            prisma.media.count({ where: where as any }),
            prisma.media.findMany({
                where: where as any,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            })
        ]);

        return NextResponse.json({
            media,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // In a real app, restrict upload to authorized users
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Import sharp explicitly inside the function to prevent build errors if missing at runtime
        const sharp = require('sharp');

        // Create filenames (always .webp)
        const timestamp = Date.now();
        const safeName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9]/gi, '_').toLowerCase();

        const mainFilename = `${timestamp}-${safeName}.webp`;
        const thumbFilename = `${timestamp}-${safeName}-thumb.webp`;

        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await mkdir(uploadDir, { recursive: true });

        const mainPath = path.join(uploadDir, mainFilename);
        const thumbPath = path.join(uploadDir, thumbFilename);

        // Process images in parallel
        // 1. Main Image: Resize if too large (>2560px), convert to WebP
        const mainTask = sharp(buffer)
            .resize({ width: 2560, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(mainPath);

        // 2. Thumbnail: Resize to 300px width, convert to WebP
        const thumbTask = sharp(buffer)
            .resize({ width: 300 })
            .webp({ quality: 60 })
            .toFile(thumbPath);

        const [mainInfo, thumbInfo] = await Promise.all([mainTask, thumbTask]);

        // Public URLs
        const url = `/uploads/${mainFilename}`;
        const thumbnailUrl = `/uploads/${thumbFilename}`;

        // Save to DB
        console.log("Saving to DB...", { filename: mainFilename, url, type: 'image/webp', size: mainInfo.size, userId: user.id });

        const media = await prisma.media.create({
            data: {
                filename: mainFilename, // Storing new .webp name
                url,
                thumbnailUrl,
                type: 'image/webp',
                size: mainInfo.size,
                width: mainInfo.width,
                height: mainInfo.height,
                userId: user.id,
                alt: "",
                caption: ""
            }
        });

        console.log("DB Save Success:", media.id);
        return NextResponse.json(media);
    } catch (error) {
        console.error("Upload failed details:", error);
        return NextResponse.json({ error: "Upload failed: " + (error as any).message }, { status: 500 });
    }
}
