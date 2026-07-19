import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { NotificationType, NotificationPriority } from "@prisma/client";
import { NOTIFICATION_ROUTES } from "@/lib/notification-routes";

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

        // Notify all admins about new feedback
        const admins = await prisma.profile.findMany({
            where: { role: "ADMIN" },
            select: { userId: true },
        });

        if (admins.length > 0) {
            const label =
                type === "BUG" ? "🐛 Bug Report" : "💡 Feature Request";
            const preview =
                message.trim().length > 80
                    ? message.trim().slice(0, 80) + "…"
                    : message.trim();

            await prisma.notification.createMany({
                data: admins.map((admin) => ({
                    userId: admin.userId,
                    type: NotificationType.FEEDBACK_RECEIVED,
                    title: `New Feedback: ${label}`,
                    message: preview,
                    priority: NotificationPriority.NORMAL,
                    link: NOTIFICATION_ROUTES.FEEDBACK_ADMIN,
                })),
            });
        }

        return NextResponse.json({ success: true, id: feedback.id });
    } catch (error) {
        console.error("Failed to create feedback:", error);
        return NextResponse.json(
            { error: "Failed to submit feedback" },
            { status: 500 }
        );
    }
}
