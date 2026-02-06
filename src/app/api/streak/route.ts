import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { streak: true, lastCheckIn: true, checkInHistory: true }
        });

        if (!dbUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            streak: dbUser.streak,
            lastCheckIn: dbUser.lastCheckIn,
            checkInHistory: dbUser.checkInHistory || []
        });

    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch streak info" }, { status: 500 });
    }
}
