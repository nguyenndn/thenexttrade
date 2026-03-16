import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { type, message } = await req.json();

        if (!type || !message?.trim()) {
            return NextResponse.json(
                { error: "Type and message are required" },
                { status: 400 }
            );
        }

        if (!["BUG", "FEATURE"].includes(type)) {
            return NextResponse.json(
                { error: "Invalid type. Must be BUG or FEATURE" },
                { status: 400 }
            );
        }

        const feedback = await prisma.feedback.create({
            data: {
                type,
                message: message.trim(),
                userId: user.id,
            },
        });

        return NextResponse.json({ success: true, id: feedback.id });
    } catch (error) {
        console.error("Failed to create feedback:", error);
        return NextResponse.json(
            { error: "Failed to submit feedback" },
            { status: 500 }
        );
    }
}
