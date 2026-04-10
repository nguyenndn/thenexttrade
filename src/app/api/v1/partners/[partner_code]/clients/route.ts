import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validatePartnerAuth } from "@/lib/partner-auth";
import { NotificationType, NotificationPriority } from "@prisma/client";

/**
 * POST /api/v1/partners/[partner_code]/clients
 * Inbound Registration API — Partner sends new client registration
 */
export async function POST(
    request: NextRequest,
    props: { params: Promise<{ partner_code: string }> }
) {
    const { partner_code } = await props.params;

    try {
        // Authenticate partner
        const auth = await validatePartnerAuth(request, partner_code);
        if (!auth.success || !auth.partner) {
            return NextResponse.json(
                { success: false, error: auth.error },
                { status: auth.status || 401 }
            );
        }

        // Parse body
        const body = await request.json();
        const { clientName, email, phone, telegram, mt5Account, mt5Server, broker } = body;

        // Validate required fields
        if (!clientName?.trim() || !email?.trim() || !mt5Account?.trim() || !mt5Server?.trim() || !broker?.trim()) {
            return NextResponse.json(
                { success: false, error: "Missing required fields: clientName, email, mt5Account, mt5Server, broker" },
                { status: 400 }
            );
        }

        // Validate MT5 account format (digits only)
        if (!/^\d+$/.test(mt5Account.trim())) {
            return NextResponse.json(
                { success: false, error: "mt5Account must contain only digits" },
                { status: 400 }
            );
        }

        // Check for duplicate
        const existing = await prisma.copyTradingRegistration.findFirst({
            where: {
                mt5AccountNumber: mt5Account.trim(),
                brokerName: broker.trim(),
            }
        });

        if (existing) {
            return NextResponse.json(
                { success: false, error: "MT5 account already registered" },
                { status: 409 }
            );
        }

        // Create registration with partner code
        const registration = await prisma.copyTradingRegistration.create({
            data: {
                fullName: clientName.trim(),
                email: email.trim(),
                telegramHandle: telegram?.trim() || null,
                phone: phone?.trim() || null,
                tradingCapital: 0,
                brokerName: broker.trim(),
                mt5Server: mt5Server.trim(),
                mt5AccountNumber: mt5Account.trim(),
                partnerCode: partner_code,
                // No userId for partner-sourced registrations — link to a system placeholder
                userId: "00000000-0000-0000-0000-000000000000",
            }
        });

        // Notify admins
        const admins = await prisma.profile.findMany({
            where: { role: "ADMIN" },
            select: { userId: true },
        });

        if (admins.length > 0) {
            await prisma.notification.createMany({
                data: admins.map((admin) => ({
                    userId: admin.userId,
                    type: NotificationType.COPY_TRADING_REGISTERED,
                    title: `New Partner Registration (${auth.partner!.partnerName})`,
                    message: `${clientName} — ${broker} / ${mt5Account}`,
                    priority: NotificationPriority.HIGH,
                    link: "/admin/copy-trading",
                })),
            });
        }

        return NextResponse.json(
            {
                success: true,
                message: "Registration received",
                registrationId: registration.id,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("[Partner API] Registration error:", error);

        if (error.code === "P2002") {
            return NextResponse.json(
                { success: false, error: "MT5 account already registered" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
