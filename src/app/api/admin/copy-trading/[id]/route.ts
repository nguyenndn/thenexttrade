import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NotificationType, NotificationPriority } from "@prisma/client";

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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

        const { id } = await context.params;
        const body = await request.json();
        const { action, rejectReason, adminNote } = body;

        if (!action || !["approve", "reject"].includes(action)) {
            return NextResponse.json({ error: "Invalid action. Must be 'approve' or 'reject'" }, { status: 400 });
        }

        const registration = await prisma.copyTradingRegistration.findUnique({
            where: { id },
        });

        if (!registration) {
            return NextResponse.json({ error: "Registration not found" }, { status: 404 });
        }

        if (registration.status !== "PENDING") {
            return NextResponse.json({ error: `Registration is already ${registration.status}` }, { status: 400 });
        }

        const isApprove = action === "approve";

        // Update registration status
        const updated = await prisma.copyTradingRegistration.update({
            where: { id },
            data: {
                status: isApprove ? "APPROVED" : "REJECTED",
                reviewedBy: user.id,
                reviewedAt: new Date(),
                rejectReason: isApprove ? null : (rejectReason || null),
                adminNote: adminNote || null,
            },
        });

        // Notify user
        const brokerDisplay = registration.brokerName === "Any Broker"
            ? registration.customBrokerName || "Custom Broker"
            : registration.brokerName;

        await prisma.notification.create({
            data: {
                userId: registration.userId,
                type: isApprove ? NotificationType.COPY_TRADING_APPROVED : NotificationType.COPY_TRADING_REJECTED,
                title: isApprove ? "Copy Trading Approved ✅" : "Copy Trading Registration Rejected",
                message: isApprove
                    ? `Your copy trading registration for ${brokerDisplay} (${registration.mt5AccountNumber}) has been approved! You will be connected shortly.`
                    : `Your copy trading registration for ${brokerDisplay} (${registration.mt5AccountNumber}) was rejected.${rejectReason ? ` Reason: ${rejectReason}` : ""}`,
                priority: isApprove ? NotificationPriority.NORMAL : NotificationPriority.HIGH,
                link: "/dashboard/copy-trading",
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                adminId: user.id,
                action: isApprove ? "COPY_TRADING_APPROVED" : "COPY_TRADING_REJECTED",
                targetType: "CopyTradingRegistration",
                targetId: id,
                details: {
                    brokerName: registration.brokerName,
                    mt5AccountNumber: registration.mt5AccountNumber,
                    rejectReason: rejectReason || null,
                },
            },
        });

        return NextResponse.json({ success: true, registration: updated });
    } catch (error) {
        console.error("Admin Copy Trading PATCH Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
