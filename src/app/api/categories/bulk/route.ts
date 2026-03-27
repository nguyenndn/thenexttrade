import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true }
    });

    if (!profile || (profile.role !== "ADMIN" && profile.role !== "EDITOR")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { ids } = await request.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
        }

        await prisma.category.deleteMany({
            where: { id: { in: ids } }
        });

        return NextResponse.json({ success: true, count: ids.length });
    } catch (error) {
        console.error("Bulk category delete failed:", error);
        return NextResponse.json({ error: "Bulk action failed" }, { status: 500 });
    }
}
