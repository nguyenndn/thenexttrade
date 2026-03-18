
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const ids = searchParams.get("ids");

    try {
        // If IDs are provided, fetch those specific tags
        if (ids) {
            const idList = ids.split(",").filter(Boolean);
            const tags = await prisma.tag.findMany({
                where: { id: { in: idList } },
            });
            return NextResponse.json(tags);
        }

        // Otherwise, search by name
        const tags = await prisma.tag.findMany({
            where: {
                name: {
                    contains: query,
                    mode: "insensitive",
                },
            },
            take: 10,
        });

        return NextResponse.json(tags);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { name } = await request.json();

        // Simple slugify
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

        const tag = await prisma.tag.upsert({
            where: { slug },
            update: {},
            create: { name, slug },
        });

        return NextResponse.json(tag);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
    }
}
