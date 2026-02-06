
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { ids, action, value } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
        }

        if (action === "delete") {
            await prisma.article.deleteMany({
                where: { id: { in: ids } }
            });
            return NextResponse.json({ success: true, count: ids.length });
        }

        if (action === "updateStatus") {
            if (!["DRAFT", "PUBLISHED", "PENDING", "ARCHIVED"].includes(value)) {
                return NextResponse.json({ error: "Invalid status" }, { status: 400 });
            }
            await prisma.article.updateMany({
                where: { id: { in: ids } },
                data: { status: value }
            });
            return NextResponse.json({ success: true, count: ids.length });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Bulk action failed:", error);
        return NextResponse.json({ error: "Bulk action failed" }, { status: 500 });
    }
}
