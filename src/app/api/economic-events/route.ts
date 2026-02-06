
import { prisma } from "@/lib/prisma";
import { ImpactLevel } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const impact = searchParams.get("impact")?.split(",") as ImpactLevel[] || undefined;
    const currency = searchParams.get("currency")?.split(",") || undefined;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};

    if (impact && impact.length > 0) {
        where.impact = { in: impact };
    }

    if (currency && currency.length > 0) {
        where.currency = { in: currency };
    }

    if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
    }

    // Lazy Sync: Check if we have events for the upcoming week
    // If not (e.g., new week started and no one synced yet), trigger sync.
    // We check for events from "today" onwards.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureEventsCount = await prisma.economicEvent.count({
        where: {
            date: { gte: today }
        }
    });

    if (futureEventsCount === 0) {
        console.log("Lazy Sync Triggered: No future events found. Syncing...");
        try {
            const { syncEconomicEvents } = await import("@/lib/services/economic-calendar");
            await syncEconomicEvents();
        } catch (syncError) {
            console.error("Lazy Sync Failed:", syncError);
            // Continue to serve whatever old data we might have (or empty) to avoid breaking the page
        }
    }

    try {
        const events = await prisma.economicEvent.findMany({
            where,
            orderBy: {
                date: 'asc',
            },
        });

        return NextResponse.json(events);
    } catch (error) {
        console.error("Error fetching economic events:", error);
        return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }
}
