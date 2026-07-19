import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const supabase = await createClient();

    // 1. Check Auth (Security)
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        // 2. Validate and process image via sharp
        const buffer = Buffer.from(await file.arrayBuffer());
        const sharp = require("sharp");
        let processedBuffer: Buffer;
        try {
            processedBuffer = await sharp(buffer)
                .resize({ width: 250, height: 250, fit: "cover" })
                .webp({ quality: 85 })
                .toBuffer();
        } catch (err) {
            return NextResponse.json(
                { error: "Invalid image format" },
                { status: 400 }
            );
        }

        // 3. Upload WebP to Supabase Storage
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
        const filePath = `${user.id}/${fileName}`; // Organize in user's folder to pass RLS policy

        const { data, error } = await supabase.storage
            .from("avatars") // Use the existing 'avatars' bucket to guarantee RLS rules work
            .upload(filePath, processedBuffer, {
                cacheControl: "3600",
                contentType: "image/webp",
                upsert: false,
            });

        if (error) {
            console.error("Supabase Storage Error:", error);
            return NextResponse.json(
                { error: "Upload to storage failed" },
                { status: 500 }
            );
        }

        // 4. Get Public URL
        const {
            data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath);

        return NextResponse.json({ url: publicUrl });
    } catch (error) {
        console.error("Upload handler failed:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
