import { prisma } from "@/lib/prisma";
import { ImpactLevel } from "@prisma/client";

const FF_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";

interface FFEvent {
    title: string;
    country: string;
    date: string; // ISO format
    impact: string; // "High", "Medium", "Low", "Holiday"
    forecast: string;
    previous: string;
}

// Map country codes to currencies
const COUNTRY_TO_CURRENCY: Record<string, string> = {
    "USD": "USD",
    "EUR": "EUR",
    "GBP": "GBP",
    "JPY": "JPY",
    "AUD": "AUD",
    "CAD": "CAD",
    "NZD": "NZD",
    "CHF": "CHF",
    "CNY": "CNY",
    "ALL": "ALL" // Sometimes used for global events
};

// Map impact strings to Enums
const IMPACT_MAP: Record<string, ImpactLevel> = {
    "High": "HIGH",
    "Medium": "MEDIUM",
    "Low": "LOW",
    "Holiday": "LOW" // Treat holidays as low impact or handle separately? Schema only has H/M/L
};

export async function fetchForexFactoryEvents() {
    try {
        const res = await fetch(FF_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error("Failed to fetch from ForexFactory");

        const data: FFEvent[] = await res.json();
        return data;
    } catch (error) {
        console.error("Error fetching FF events:", error);
        return [];
    }
}

export async function syncEconomicEvents() {
    console.log("Starting Economic Event Sync...");
    const events = await fetchForexFactoryEvents();

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

        // We need a way to identify uniqueness. 
        // Title + Date + Currency seems reasonable.

        // Create unique identifier for upsert if needed, or rely on composite constraint
        // Since we have @@unique([title, currency, date]), we can use it in 'where' for upsert.

        await prisma.economicEvent.upsert({
            where: {
                title_currency_date: {
                    title: event.title,
                    currency: currency,
                    date: eventDate
                }
            },
            update: {
                impact: impact,
                forecast: event.forecast,
                previous: event.previous,
                // Only update actual if it has a value, otherwise keep existing?
                // actually FF might clear it or update it. Let's trust the feed.
                // But wait, if feed has empty actual, and we have one, should we overwrite?
                // Ideally yes, trust the feed.
                // actual: event.actual 
            },
            create: {
                title: event.title,
                currency: currency,
                impact: impact,
                date: eventDate,
                forecast: event.forecast,
                previous: event.previous,
                actual: ""
            }
        });

        // Count represents processed, distinction between created/updated is harder with bulk upsert loop
        // but for now we just count processed.
        updatedCount++;
    }

    console.log(`Sync Complete. Created: ${createdCount}, Updated: ${updatedCount}`);
    return { success: true, created: createdCount, updated: updatedCount };
}
