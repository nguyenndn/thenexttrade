import { prisma } from "@/lib/prisma";
import { ImpactLevel } from "@prisma/client";
import fallbackEvents from "./fallback-economic-events.json";

const FF_URL =
    process.env.ECONOMIC_CALENDAR_PROVIDER_URL ||
    "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
const PROVIDER_ID = "forexfactory";
const SOURCE_NAME = "Forex Factory Calendar";

interface FFEvent {
    title: string;
    country: string;
    date: string; // ISO format
    impact: string; // "High", "Medium", "Low", "Holiday"
    forecast: string;
    previous: string;
    actual?: string;
}

interface ProviderFetchResult {
    events: FFEvent[];
    isFallback: boolean;
    fetchedAt: Date;
}

// Map country codes to currencies
const COUNTRY_TO_CURRENCY: Record<string, string> = {
    USD: "USD",
    EUR: "EUR",
    GBP: "GBP",
    JPY: "JPY",
    AUD: "AUD",
    CAD: "CAD",
    NZD: "NZD",
    CHF: "CHF",
    CNY: "CNY",
    ALL: "ALL", // Sometimes used for global events
};

// Map impact strings to Enums
const IMPACT_MAP: Record<string, ImpactLevel> = {
    High: "HIGH",
    Medium: "MEDIUM",
    Low: "LOW",
    Holiday: "LOW", // Treat holidays as low impact or handle separately? Schema only has H/M/L
};

async function fetchProviderEvents(): Promise<ProviderFetchResult> {
    try {
        const res = await fetch(FF_URL, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch from ForexFactory");

        const data: FFEvent[] = await res.json();
        if (!Array.isArray(data)) throw new Error("Invalid provider response");
        return { events: data, isFallback: false, fetchedAt: new Date() };
    } catch (error) {
        console.error("Error fetching FF events from network:", error);
        console.warn("Using local fallback events instead.");
        return {
            events: fallbackEvents as FFEvent[],
            isFallback: true,
            fetchedAt: new Date(),
        };
    }
}

export async function fetchForexFactoryEvents() {
    return (await fetchProviderEvents()).events;
}

function normalizeValue(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
}

function getEventStatus(eventDate: Date, actual: string | null) {
    if (actual) return "RELEASED";
    return eventDate.getTime() < Date.now() ? "UNAVAILABLE" : "SCHEDULED";
}

function getExternalId(title: string, currency: string, date: Date) {
    return `${PROVIDER_ID}:${currency}:${date.toISOString()}:${title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}`;
}

export async function syncEconomicEvents() {
    console.log("Starting Economic Event Sync...");
    const providerResult = await fetchProviderEvents();
    const events = providerResult.events;
    const syncedAt = providerResult.fetchedAt;

    if (events.length === 0) {
        console.log("No events found to sync.");
        return { success: false, message: "No data fetched" };
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const event of events) {
        // Skip events with no currency mapping if we want to be strict,
        // OR just use the country as currency if it matches (FF uses USD, JPY etc as country usually)
        // Actually FF JSON uses "USD", "JPY" in the 'country' field directly often.
        // Let's assume country == currency for simplicity, or fallback.

        const currency = COUNTRY_TO_CURRENCY[event.country] || event.country;

        // Skip if impact is invalid or missing?
        // Default to LOW if unknown
        const impact = IMPACT_MAP[event.impact] || "LOW";

        const eventDate = new Date(event.date);
        if (Number.isNaN(eventDate.getTime())) continue;

        const actual = normalizeValue(event.actual);
        const eventStatus = getEventStatus(eventDate, actual);
        const externalId = getExternalId(event.title, currency, eventDate);

        // We need a way to identify uniqueness.
        // Title + Date + Currency seems reasonable.

        // Create unique identifier for upsert if needed, or rely on composite constraint
        // Since we have @@unique([title, currency, date]), we can use it in 'where' for upsert.

        const existing = await prisma.economicEvent.findUnique({
            where: {
                title_currency_date: {
                    title: event.title,
                    currency: currency,
                    date: eventDate,
                },
            },
            select: { id: true },
        });

        await prisma.economicEvent.upsert({
            where: {
                title_currency_date: {
                    title: event.title,
                    currency: currency,
                    date: eventDate,
                },
            },
            update: {
                impact: impact,
                forecast: event.forecast,
                previous: event.previous,
                ...(actual ? { actual } : {}),
                provider: PROVIDER_ID,
                sourceName: SOURCE_NAME,
                sourceUrl: FF_URL,
                externalId,
                eventStatus,
                isFallback: providerResult.isFallback,
                lastSyncedAt: syncedAt,
            },
            create: {
                title: event.title,
                currency: currency,
                impact: impact,
                date: eventDate,
                forecast: event.forecast,
                previous: event.previous,
                actual,
                provider: PROVIDER_ID,
                sourceName: SOURCE_NAME,
                sourceUrl: FF_URL,
                externalId,
                eventStatus,
                isFallback: providerResult.isFallback,
                lastSyncedAt: syncedAt,
            },
        });

        if (existing) updatedCount++;
        else createdCount++;
    }

    console.log(
        `Sync Complete. Created: ${createdCount}, Updated: ${updatedCount}`
    );
    return {
        success: true,
        created: createdCount,
        updated: updatedCount,
        source: {
            provider: PROVIDER_ID,
            name: SOURCE_NAME,
            url: FF_URL,
            status: providerResult.isFallback ? "FALLBACK" : "LIVE",
            syncedAt,
        },
    };
}

export function extractCurrenciesFromSymbol(symbol: string): string[] {
    const clean = (symbol || "").toUpperCase();
    const knownCurrencies = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "NZD", "CHF", "CNY"];
    const matched = knownCurrencies.filter((c) => clean.includes(c));
    return matched.length > 0 ? matched : ["USD"];
}

export async function getMatchingEconomicEventsForTrade(
    symbol: string,
    tradeDate: Date | string,
    windowHours: number = 4
) {
    const targetDate = typeof tradeDate === "string" ? new Date(tradeDate) : tradeDate;
    if (isNaN(targetDate.getTime())) return [];

    const minDate = new Date(targetDate.getTime() - windowHours * 60 * 60 * 1000);
    const maxDate = new Date(targetDate.getTime() + windowHours * 60 * 60 * 1000);
    const currencies = extractCurrenciesFromSymbol(symbol);

    return await prisma.economicEvent.findMany({
        where: {
            currency: { in: currencies },
            date: { gte: minDate, lte: maxDate },
            impact: { in: ["HIGH", "MEDIUM"] },
        },
        orderBy: { date: "asc" },
        take: 5,
    });
}
