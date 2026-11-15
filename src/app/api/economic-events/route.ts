import { prisma } from "@/lib/prisma";
import { ImpactLevel, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

const VALID_IMPACTS = new Set<string>([
    ImpactLevel.HIGH,
    ImpactLevel.MEDIUM,
    ImpactLevel.LOW,
]);
const CURRENCY_REGEX = /^[A-Z]{2,5}$/;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const rawImpact = searchParams.get("impact");
    const rawCurrency = searchParams.get("currency");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Prisma.EconomicEventWhereInput = {};

    if (rawImpact !== null && rawImpact.trim() !== "") {
        const impactList = rawImpact
            .split(",")
            .map((item) => item.trim().toUpperCase())
            .filter(Boolean);

        if (
            impactList.length === 0 ||
            impactList.some((item) => !VALID_IMPACTS.has(item))
        ) {
            return NextResponse.json(
                {
                    error: "Invalid impact parameter. Allowed values: HIGH, MEDIUM, LOW.",
                },
                { status: 400 }
            );
        }

        where.impact = { in: impactList as ImpactLevel[] };
    }

    if (rawCurrency !== null && rawCurrency.trim() !== "") {
        const currencyList = rawCurrency
            .split(",")
            .map((item) => item.trim().toUpperCase())
            .filter(Boolean);

        if (
            currencyList.length === 0 ||
            currencyList.some((code) => !CURRENCY_REGEX.test(code))
        ) {
            return NextResponse.json(
                { error: "Invalid currency parameter." },
                { status: 400 }
            );
        }

        where.currency = { in: currencyList };
    }

    if (startDate || endDate) {
        const dateFilter: Prisma.DateTimeFilter = {};

        if (startDate) {
            const parsedStart = new Date(startDate);
            if (Number.isNaN(parsedStart.getTime())) {
                return NextResponse.json(
                    { error: "Invalid startDate parameter." },
                    { status: 400 }
                );
            }
            dateFilter.gte = parsedStart;
        }

        if (endDate) {
            const parsedEnd = new Date(endDate);
            if (Number.isNaN(parsedEnd.getTime())) {
                return NextResponse.json(
                    { error: "Invalid endDate parameter." },
                    { status: 400 }
                );
            }
            dateFilter.lte = parsedEnd;
        }

        if (
            dateFilter.gte instanceof Date &&
            dateFilter.lte instanceof Date &&
            dateFilter.gte > dateFilter.lte
        ) {
            return NextResponse.json(
                { error: "startDate cannot be after endDate." },
                { status: 400 }
            );
        }

        where.date = dateFilter;
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
