import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { NotificationType, NotificationPriority } from "@prisma/client";
import { NOTIFICATION_ROUTES } from "@/lib/notification-routes";
import { checkAuthRateLimit } from "@/lib/security/auth-rate-limit";
import { AUTH_ERRORS } from "@/lib/security/auth-errors";

const createFeedbackSchema = z.object({
    type: z.enum(["BUG", "FEATURE"], {
        message: "Invalid type. Must be BUG or FEATURE",
    }),
    message: z
        .string()
        .trim()
        .min(5, "Message must be at least 5 characters")
        .max(1000, "Message must be at most 1000 characters"),
});

async function getClientIP(): Promise<string> {
    const h = await headers();
    const realIp = h.get("x-real-ip")?.trim();
    if (realIp) return realIp;
    const vercelIp = h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
    if (vercelIp) return vercelIp;
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
}

export async function POST(req: Request) {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = await getClientIP();
    if (await checkAuthRateLimit("feedback", ip, user.email ?? undefined)) {
        return NextResponse.json(
            { error: AUTH_ERRORS.RATE_LIMIT_GENERIC },
            { status: 429 }
        );
    }

    try {
        const body = await req.json();
        const parsed = createFeedbackSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error:
                        parsed.error.issues[0]?.message ||
                        "Type and message (5–1000 characters) are required",
                },
                { status: 400 }
            );
        }

        const { type, message } = parsed.data;

        const feedback = await prisma.feedback.create({
            data: {
                type,
                message,
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
                type === "BUG" ? "Bug Report" : "Feature Request";
            const preview =
                message.length > 80
                    ? message.slice(0, 80) + "…"
                    : message;

            await prisma.notification.createMany({
                data: admins.map((admin) => ({
                    userId: admin.userId,
                    type: NotificationType.FEEDBACK_RECEIVED,
                    title: `New Feedback: ${label}`,
                    message: preview,
                    priority: NotificationPriority.NORMAL,
                    link: NOTIFICATION_ROUTES.FEEDBACK_ADMIN,
                    dedupeKey: `admin-feedback-${feedback.id}-${admin.userId}`,
                })),
                skipDuplicates: true,
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
