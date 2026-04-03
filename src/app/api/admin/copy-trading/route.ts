import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CopyTradingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Admin check
        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { role: true },
        });

        if (profile?.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const status = searchParams.get("status") as CopyTradingStatus | null;
        const q = searchParams.get("q") || "";
        const skip = (page - 1) * limit;

        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (q) {
            where.OR = [
                { fullName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { mt5AccountNumber: { contains: q, mode: "insensitive" } },
                { brokerName: { contains: q, mode: "insensitive" } },
            ];
        }

        const [registrations, total, pendingCount] = await Promise.all([
            prisma.copyTradingRegistration.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    user: {
                        select: { name: true, email: true, image: true },
                    },
                },
            }),
            prisma.copyTradingRegistration.count({ where }),
            prisma.copyTradingRegistration.count({ where: { status: "PENDING" } }),
        ]);

        return NextResponse.json({
            registrations,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                total,
            },
            pendingCount,
        });
    } catch (error) {
        console.error("Admin Copy Trading GET Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
