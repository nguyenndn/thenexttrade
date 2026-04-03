import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const registrations = await prisma.copyTradingRegistration.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                fullName: true,
                email: true,
                telegramHandle: true,
                brokerName: true,
                customBrokerName: true,
                mt5Server: true,
                customServer: true,
                mt5AccountNumber: true,
                tradingCapital: true,
                status: true,
                rejectReason: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ registrations });
    } catch (error) {
        console.error("My Registrations Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
