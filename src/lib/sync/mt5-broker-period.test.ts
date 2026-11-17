import path from "path";
import { createRequire } from "module";
import { describe, it, expect } from "vitest";

const requireCjs = createRequire(import.meta.url);

interface TradeTypesModule {
    EntityHistoryPeriod: {
        TODAY: string;
        LAST_WEEK: string;
        LAST_MONTH: string;
        LAST_THREE_MONTHS: string;
        CUSTOM: string;
    };
    HistoryPeriodCalculator_Loh6: {
        b: (
            period: string,
            customFromMs?: number,
            customToMs?: number,
            brokerNowMs?: number | null
        ) => [number, number];
    };
}

const { EntityHistoryPeriod, HistoryPeriodCalculator_Loh6 } = requireCjs(
    path.join(process.cwd(), "mt5-cloud-sync", "apk", "types", "TradeTypes.js")
) as TradeTypesModule;

describe("MT5 App Broker Server Clock Today & Period alignment", () => {
    it("matches MT5 App Today (Nov 17) when Vietnam is past midnight (Nov 18 00:25 UTC+7) and GMT+2 broker is Nov 17 19:25", () => {
        // UTC: 2026-11-17T17:25:40Z | Vietnam (UTC+7): 2026-11-18 00:25:40 | MT5 Broker (GMT+2): 2026-11-17 19:25:40
        const utcMs = Date.parse("2026-11-17T17:25:40.000Z");
        const brokerTzMinutes = 120; // GMT+2
        const brokerNowMs = utcMs + brokerTzMinutes * 60_000;

        const [fromMs, toMs] = HistoryPeriodCalculator_Loh6.b(
            EntityHistoryPeriod.TODAY,
            0,
            0,
            brokerNowMs
        );

        expect(new Date(fromMs).toISOString()).toBe("2026-11-17T00:00:00.000Z");
        expect(new Date(toMs).toISOString()).toBe("2026-11-17T23:59:59.999Z");
    });

    it("matches MT5 App Today (Nov 18) when UTC is still Nov 17 22:30Z but GMT+2 broker has rolled over to Nov 18 00:30", () => {
        // UTC: 2026-11-17T22:30:00Z | Vietnam (UTC+7): 2026-11-18 05:30:00 | MT5 Broker (GMT+2): 2026-11-18 00:30:00
        const utcMs = Date.parse("2026-11-17T22:30:00.000Z");
        const brokerTzMinutes = 120; // GMT+2
        const brokerNowMs = utcMs + brokerTzMinutes * 60_000;

        const [fromMs, toMs] = HistoryPeriodCalculator_Loh6.b(
            EntityHistoryPeriod.TODAY,
            0,
            0,
            brokerNowMs
        );

        expect(new Date(fromMs).toISOString()).toBe("2026-11-18T00:00:00.000Z");
        expect(new Date(toMs).toISOString()).toBe("2026-11-18T23:59:59.999Z");
    });

    it("handles GMT+3 summer DST rollover at 21:15 UTC accurately", () => {
        // UTC: 2026-07-15T21:15:00Z | MT5 Broker (GMT+3 DST): 2026-07-16 00:15:00
        const utcMs = Date.parse("2026-07-15T21:15:00.000Z");
        const brokerTzMinutes = 180; // GMT+3
        const brokerNowMs = utcMs + brokerTzMinutes * 60_000;

        const [fromMs, toMs] = HistoryPeriodCalculator_Loh6.b(
            EntityHistoryPeriod.TODAY,
            0,
            0,
            brokerNowMs
        );

        expect(new Date(fromMs).toISOString()).toBe("2026-07-16T00:00:00.000Z");
        expect(new Date(toMs).toISOString()).toBe("2026-07-16T23:59:59.999Z");
    });

    it("computes LAST_WEEK and LAST_MONTH anchored to broker clock endOfToday", () => {
        const brokerNowMs = Date.parse("2026-11-17T18:45:00.000Z");

        const [weekFrom, weekTo] = HistoryPeriodCalculator_Loh6.b(
            EntityHistoryPeriod.LAST_WEEK,
            0,
            0,
            brokerNowMs
        );
        expect(new Date(weekFrom).toISOString()).toBe(
            "2026-11-10T00:00:00.000Z"
        );
        expect(new Date(weekTo).toISOString()).toBe(
            "2026-11-17T23:59:59.999Z"
        );
    });
});
