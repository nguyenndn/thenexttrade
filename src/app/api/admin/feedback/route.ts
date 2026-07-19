import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

async function isAdmin() {
    const user = await getAuthUser();
    if (!user) return null;
    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });
    if (profile?.role !== "ADMIN" && profile?.role !== "EDITOR") return null;
    return user;
}

export async function GET() {
    const user = await isAdmin();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const [feedbacks, stats] = await Promise.all([
            prisma.feedback.findMany({
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: { name: true, email: true, image: true },
                    },
                },
            }),
            prisma.feedback.groupBy({
                by: ["status"],
                _count: { id: true },
            }),
        ]);

        const statusCounts: Record<string, number> = {
            OPEN: 0,
            IN_PROGRESS: 0,
            RESOLVED: 0,
            CLOSED: 0,
        };
        stats.forEach((s: { status: string; _count: { id: number } }) => {
            statusCounts[s.status] = s._count.id;
        });

        return NextResponse.json({ feedbacks, stats: statusCounts });
    } catch (error) {
        console.error("Failed to fetch feedbacks:", error);
        return NextResponse.json(
            { error: "Failed to fetch feedbacks" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    const user = await isAdmin();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id, status } = await req.json();

        if (!id || !status) {
            return NextResponse.json(
                { error: "ID and status are required" },
                { status: 400 }
            );
        }

        if (!["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)) {
            return NextResponse.json(
                { error: "Invalid status" },
                { status: 400 }
            );
        }

        const feedback = await prisma.feedback.update({
            where: { id },
            data: { status },
        });

        return NextResponse.json({ success: true, feedback });
    } catch (error) {
        console.error("Failed to update feedback:", error);
        return NextResponse.json(
            { error: "Failed to update feedback" },
            { status: 500 }
        );
    }
}
