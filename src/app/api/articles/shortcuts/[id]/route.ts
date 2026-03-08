import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await prisma.contentShortcut.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete shortcut", error);
        return NextResponse.json({ error: "Failed to delete shortcut" }, { status: 500 });
    }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, description, content } = body;

        if (!name || !content) {
            return NextResponse.json({ error: "Name and content are required" }, { status: 400 });
        }

        const updatedShortcut = await prisma.contentShortcut.update({
            where: { id: params.id },
            data: {
                name,
                description,
                content
            }
        });

        return NextResponse.json(updatedShortcut);
    } catch (error) {
        console.error("Failed to update shortcut", error);
        return NextResponse.json({ error: "Failed to update shortcut" }, { status: 500 });
    }
}
