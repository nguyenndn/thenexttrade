
import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { alt, caption } = body;

        const media = await prisma.media.update({
            where: { id: params.id },
            data: { alt, caption }
        });

        return NextResponse.json(media);
    } catch (error) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Get media to find file path
        const media = await prisma.media.findUnique({
            where: { id: params.id }
        });

        if (!media) {
            return NextResponse.json({ error: "Media not found" }, { status: 404 });
        }

        // Delete from DB
        await prisma.media.delete({
            where: { id: params.id }
        });

        // Try deleting file (ignore if missing)
        try {
            // URL is like /uploads/filename.ext
            const relativePath = media.url.replace(/^\//, '').replace(/\//g, path.sep); // uploads\filename.ext
            const absolutePath = path.join(process.cwd(), "public", relativePath);
            await unlink(absolutePath);
        } catch (err) {
            console.warn("Could not delete file from disk:", err);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
