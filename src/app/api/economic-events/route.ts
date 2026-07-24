import { prisma } from "@/lib/prisma";
import { ImpactLevel } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const impact =
        (searchParams.get("impact")?.split(",") as ImpactLevel[]) || undefined;
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
            date: { gte: today },
        },
    });

    let syncResult: Awaited<
        ReturnType<typeof import("@/lib/services/economic-calendar").syncEconomicEvents>
    > | null = null;

    if (futureEventsCount === 0) {
        console.log("Lazy Sync Triggered: No future events found. Syncing...");
        try {
            const { syncEconomicEvents } =
                await import("@/lib/services/economic-calendar");
            syncResult = await syncEconomicEvents();
        } catch (syncError) {
            console.error("Lazy Sync Failed:", syncError);
            // Continue to serve whatever old data we might have (or empty) to avoid breaking the page
        }
    }

    try {
        const events = await prisma.economicEvent.findMany({
            where,
            orderBy: {
                date: "asc",
            },
        });

        const fallbackCount = events.filter((event) => event.isFallback).length;
        const lastSyncedAt = events.reduce<Date | null>((latest, event) => {
            if (!latest || event.lastSyncedAt > latest) return event.lastSyncedAt;
            return latest;
        }, null);
        const status =
            events.length === 0
                ? "UNAVAILABLE"
                : fallbackCount === events.length
                  ? "FALLBACK"
                  : "CACHED";
        const source = events[0]
            ? {
                  provider: events[0].provider,
                  name: events[0].sourceName,
                  url: events[0].sourceUrl,
              }
            : syncResult?.source || null;

        return NextResponse.json({
            events,
            metadata: {
                status,
                source,
                lastSyncedAt,
                message:
                    status === "FALLBACK"
                        ? "The provider could not be reached. These records are fallback data and may be stale."
                        : status === "UNAVAILABLE"
                          ? "Calendar data is currently unavailable."
                          : "Calendar data is stored from the configured provider.",
            },
        });
    } catch (error) {
        console.error("Error fetching economic events:", error);
        return NextResponse.json(
            { error: "Failed to fetch events" },
            { status: 500 }
        );
    }
}
