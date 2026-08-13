import { NextResponse } from "next/server";

// OpenAPI 3.1 document backing the public AI plugin manifest
// (src/app/.well-known/ai-plugin.json). Covers only the genuinely public,
// unauthenticated GET endpoints the plugin description advertises
// (calculators, live rates, correlation, economic calendar).
export async function GET() {
    const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.com";

    const spec = {
        openapi: "3.1.0",
        info: {
            title: "TheNextTrade Public Tools API",
            description:
                "Free public endpoints for forex calculators, live market rates, pair correlation, and the economic calendar. No authentication required.",
            version: "1.0.0",
            contact: { email: "support@thenexttrade.com" },
        },
        servers: [{ url: baseUrl }],
        tags: [
            { name: "Tools", description: "Calculators and market data" },
            { name: "Calendar", description: "Economic calendar" },
        ],
        paths: {
            "/api/tools/rates": {
                get: {
                    tags: ["Tools"],
                    summary: "Get live quotes for one or more tickers",
                    description:
                        "Returns the current price, change, and change percent for Yahoo Finance symbols (e.g. EURUSD=X, XAUUSD=X, BTC-USD).",
                    operationId: "getRates",
                    parameters: [
                        {
                            name: "symbols",
                            in: "query",
                            required: true,
                            description:
                                "Comma-separated Yahoo Finance symbols, e.g. EURUSD=X,XAUUSD=X",
                            schema: { type: "string" },
                            example: "EURUSD=X,XAUUSD=X",
                        },
                    ],
                    responses: {
                        "200": {
                            description: "Live rates",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            success: { type: "boolean" },
                                            rates: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        symbol: {
                                                            type: "string",
                                                        },
                                                        name: {
                                                            type: "string",
                                                        },
                                                        price: {
                                                            type: "number",
                                                        },
                                                        change: {
                                                            type: "number",
                                                        },
                                                        changePercent: {
                                                            type: "number",
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        "400": {
                            description: "Missing symbols parameter",
                        },
                        "500": {
                            description: "Upstream quote provider failed",
                        },
                    },
                },
            },
            "/api/tools/convert": {
                get: {
                    tags: ["Tools"],
                    summary: "Convert an amount between two currencies",
                    description:
                        "Converts `amount` from `from` to `to` (ISO currency codes).",
                    operationId: "convertCurrency",
                    parameters: [
                        {
                            name: "from",
                            in: "query",
                            required: false,
                            description: "Source currency code, default USD",
                            schema: { type: "string" },
                            example: "USD",
                        },
                        {
                            name: "to",
                            in: "query",
                            required: false,
                            description: "Target currency code, default EUR",
                            schema: { type: "string" },
                            example: "EUR",
                        },
                        {
                            name: "amount",
                            in: "query",
                            required: false,
                            description: "Amount to convert, default 1",
                            schema: { type: "number" },
                            example: 1000,
                        },
                    ],
                    responses: {
                        "200": {
                            description: "Conversion result",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            success: { type: "boolean" },
                                            rate: { type: "number" },
                                            converted: { type: "number" },
                                        },
                                    },
                                },
                            },
                        },
                        "500": {
                            description: "Upstream quote provider failed",
                        },
                    },
                },
            },
            "/api/tools/correlation": {
                get: {
                    tags: ["Tools"],
                    summary: "Correlation matrix between currency pairs",
                    description:
                        "Computes a Pearson correlation matrix over the last `period` days for the given pairs (e.g. EUR/USD,GBP/USD).",
                    operationId: "correlationMatrix",
                    parameters: [
                        {
                            name: "pairs",
                            in: "query",
                            required: true,
                            description:
                                "Comma-separated currency pairs, e.g. EUR/USD,GBP/USD",
                            schema: { type: "string" },
                            example: "EUR/USD,GBP/USD",
                        },
                        {
                            name: "period",
                            in: "query",
                            required: false,
                            description: "Lookback days, default 30",
                            schema: { type: "integer" },
                            example: 30,
                        },
                    ],
                    responses: {
                        "200": {
                            description: "Correlation matrix",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            success: { type: "boolean" },
                                            matrix: {
                                                type: "array",
                                                description:
                                                    "NxN matrix, rows and columns follow the order of `pairs`",
                                                items: {
                                                    type: "array",
                                                    items: {
                                                        type: "number",
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        "400": {
                            description: "Missing pairs parameter",
                        },
                        "500": {
                            description: "Failed to calculate correlation",
                        },
                    },
                },
            },
            "/api/economic-events": {
                get: {
                    tags: ["Calendar"],
                    summary: "List economic calendar events",
                    description:
                        "Returns economic events filtered by impact, currency, and date range.",
                    operationId: "listEconomicEvents",
                    parameters: [
                        {
                            name: "impact",
                            in: "query",
                            required: false,
                            description:
                                "Comma-separated impact levels: HIGH, MEDIUM, LOW",
                            schema: {
                                type: "string",
                                enum: ["HIGH", "MEDIUM", "LOW"],
                            },
                        },
                        {
                            name: "currency",
                            in: "query",
                            required: false,
                            description:
                                "Comma-separated currency codes, e.g. USD,EUR",
                            schema: { type: "string" },
                        },
                        {
                            name: "startDate",
                            in: "query",
                            required: false,
                            description: "ISO date lower bound",
                            schema: { type: "string", format: "date" },
                        },
                        {
                            name: "endDate",
                            in: "query",
                            required: false,
                            description: "ISO date upper bound",
                            schema: { type: "string", format: "date" },
                        },
                    ],
                    responses: {
                        "200": {
                            description: "Events with data metadata",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            events: {
                                                type: "array",
                                                items: { type: "object" },
                                            },
                                            metadata: {
                                                type: "object",
                                                properties: {
                                                    status: {
                                                        type: "string",
                                                        enum: [
                                                            "CACHED",
                                                            "FALLBACK",
                                                            "UNAVAILABLE",
                                                        ],
                                                    },
                                                    lastSyncedAt: {
                                                        type: [
                                                            "string",
                                                            "null",
                                                        ],
                                                        format: "date-time",
                                                    },
                                                    message: {
                                                        type: "string",
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        "500": {
                            description: "Failed to fetch events",
                        },
                    },
                },
            },
        },
    };

    return NextResponse.json(spec, {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
    });
}
