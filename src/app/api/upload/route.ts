
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const supabase = await createClient();

    // 1. Check Auth (Security)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // 2. Validate File Size/Type (Basic)
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            return NextResponse.json({ error: "File too large (Max 5MB)" }, { status: 400 });
        }

        // 3. Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `articles/${fileName}`; // Organize in 'articles' folder

        const { data, error } = await supabase
            .storage
            .from('uploads') // Bucket name
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error("Supabase Storage Error:", error);
            return NextResponse.json({ error: "Upload to storage failed" }, { status: 500 });
        }

        // 4. Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('uploads')
            .getPublicUrl(filePath);

        return NextResponse.json({ url: publicUrl });
    } catch (error) {
        console.error("Upload handler failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
