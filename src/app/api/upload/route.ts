import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { validateImageFile, MAX_FILE_SIZE } from "@/lib/storage/image-validation";
import { uploadPublicAsset, isR2Configured } from "@/lib/storage/object-storage";

const ALLOWED_PURPOSES = ["journal", "avatar"] as const;
type UploadPurpose = (typeof ALLOWED_PURPOSES)[number];

// Sharp resize config per purpose
const SHARP_CONFIG: Record<UploadPurpose, { width: number; height?: number; fit: "cover" | "inside" }> = {
    journal: { width: 1200, fit: "inside" }, // Preserve aspect ratio, max 1200px wide
    avatar: { width: 400, height: 400, fit: "cover" }, // Square crop
};

// R2 directory prefix per purpose
const getR2Directory = (purpose: UploadPurpose): string => {
    if (purpose === "avatar") return "avatars";
    return purpose; // "journal"
};

export async function POST(request: Request) {
    // 1. Auth check
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const purpose = (formData.get("purpose") as string) || "journal";

        // 2. Validate purpose
        if (!ALLOWED_PURPOSES.includes(purpose as UploadPurpose)) {
            return NextResponse.json(
                { error: `Invalid purpose. Allowed: ${ALLOWED_PURPOSES.join(", ")}` },
                { status: 400 }
            );
        }

        // 3. Validate file exists
        if (!file || file.size === 0) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        // 4. Client-reported size pre-check (fast reject before reading buffer)
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 1MB.` },
                { status: 400 }
            );
        }

        // 5. Read buffer and run deep validation (magic bytes + extension)
        const buffer = Buffer.from(await file.arrayBuffer());
        const validation = validateImageFile(buffer, file.name);
        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }

        // 6. Check R2 is configured
        if (!isR2Configured) {
            return NextResponse.json(
                { error: "Storage not configured. Please set up R2 credentials." },
                { status: 503 }
            );
        }

        // 7. Process image with sharp (resize + convert to WebP)
        const sharp = require("sharp");
        const config = SHARP_CONFIG[purpose as UploadPurpose];
        let processedBuffer: Buffer;
        try {
            let pipeline = sharp(buffer).rotate(); // Auto-rotate based on EXIF
            if (config.height) {
                pipeline = pipeline.resize({
                    width: config.width,
                    height: config.height,
                    fit: config.fit,
                });
            } else {
                pipeline = pipeline.resize({
                    width: config.width,
                    fit: config.fit,
                    withoutEnlargement: true, // Don't upscale small images
                });
            }
            processedBuffer = await pipeline.webp({ quality: 85 }).toBuffer();
        } catch {
            return NextResponse.json(
                { error: "Failed to process image. The file may be corrupted." },
                { status: 400 }
            );
        }

        // 8. Upload to R2
        const directory = getR2Directory(purpose as UploadPurpose);
        const prefix = purpose === "avatar" ? "av" : "js";
        const uniqueFilename = `${prefix}-${crypto.randomUUID()}.webp`;

        const publicUrl = await uploadPublicAsset(
            processedBuffer,
            directory,
            uniqueFilename,
            "image/webp"
        );

        if (!publicUrl) {
            return NextResponse.json(
                { error: "Upload failed. Please try again." },
                { status: 500 }
            );
        }

        return NextResponse.json({ url: publicUrl });
    } catch (error) {
        console.error("[Upload] Handler failed:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
