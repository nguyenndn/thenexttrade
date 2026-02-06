
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors/response";
import { ErrorCode } from "@/lib/errors/ea-license";

// GET /api/user/notifications?limit=10&page=1
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(createErrorResponse(ErrorCode.UNAUTHORIZED), { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "10");
        const page = parseInt(searchParams.get("page") || "1");
        const skip = (page - 1) * limit;

        const [notifications, unreadCount, total] = await Promise.all([
            prisma.notification.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: skip,
            }),
            prisma.notification.count({
                where: { userId: user.id, isRead: false },
            }),
            prisma.notification.count({
                where: { userId: user.id },
            }),
        ]);

        return NextResponse.json(createSuccessResponse({
            notifications,
            unreadCount,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        }));
    } catch (error) {
        console.error("GET Notifications Error:", error);
        return NextResponse.json(createErrorResponse(ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
}

// PATCH /api/user/notifications (Mark as read)
// Body: { id: "notification_id" | "ALL" }
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(createErrorResponse(ErrorCode.UNAUTHORIZED), { status: 401 });
        }

        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json(createErrorResponse(ErrorCode.ID_REQUIRED), { status: 400 });
        }

        if (id === "ALL") {
            await prisma.notification.updateMany({
                where: { userId: user.id, isRead: false },
                data: { isRead: true },
            });
        } else {
            await prisma.notification.update({
                where: { id: id, userId: user.id }, // Ensure ownership
                data: { isRead: true },
            });
        }

        return NextResponse.json(createSuccessResponse({ success: true }));

    } catch (error) {
        console.error("PATCH Notifications Error:", error);
        return NextResponse.json(createErrorResponse(ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
}
