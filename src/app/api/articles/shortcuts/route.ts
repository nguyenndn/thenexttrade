import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const shortcuts = await prisma.contentShortcut.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                author: { select: { name: true, image: true } }
            }
        });

        return NextResponse.json(shortcuts);
    } catch (error) {
        console.error("Failed to fetch shortcuts", error);
        return NextResponse.json({ error: "Failed to fetch shortcuts" }, { status: 500 });
    }
}

export async function POST(request: Request) {
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

        const shortcut = await prisma.contentShortcut.create({
            data: {
                name,
                description,
                content,
                authorId: user.id
            }
        });

        return NextResponse.json(shortcut, { status: 201 });
    } catch (error) {
        console.error("Failed to create shortcut", error);
        return NextResponse.json({ error: "Failed to create shortcut" }, { status: 500 });
    }
}
