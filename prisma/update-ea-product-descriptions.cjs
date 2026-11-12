/**
 * Writes the catalog description for every Expert Advisor product.
 * Matches by slug so it is safe to re-run on local, staging, or production.
 *
 * Usage: node prisma/update-ea-product-descriptions.cjs
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DESCRIPTIONS = {
    goldscalperninja: [
        "GoldScalperNinja is a multi-order XAUUSD grid Expert Advisor that waits for a turn instead of catching a falling knife. Each side keeps a trailing Buy Stop or Sell Stop one grid step away from price; when the stop fills on a reversal, an order chain begins with a configurable lot ladder (default 0.01, ×1.5 every 2 orders) and controlled spacing. The Trend Master D1 band decides whether BUY, SELL or both sides may open, and the two-phase pruning logic banks winners first while cutting losing orders only when the basket still covers the loss.",
        "Five safety layers keep every chain inside your limits: per-order and total lot caps, a global stop loss, a daily profit target and maximum loss, a high-impact news filter with a trading schedule, and a safe-close cycle. The neon on-chart panel reports both chains, floating P/L, drawdown and licence state, exposes CLOSE BUY, CLOSE SELL, CLOSE ALL and CYCLE commands, and a pending order at price 999 lets you disable or re-enable the EA remotely from your phone. Magic number 888 keeps its trades separate.",
    ].join("\n\n"),
    "trade-manager": [
        "GSN Trade Manager is a manual execution and risk-management desk for XAUUSD scalpers, not an auto-trader. Its five-tab command deck covers the full workflow: plan Entry, Stop Loss and three weighted take-profits on draggable chart lines with live dollar risk and R:R, then fire one-click market or pending orders, partial closes at TP1–TP3, break-even moves and close-all with optional B/S/E/X hotkeys.",
        "The remaining tabs map institutional supply and demand zones against the session Volume Profile (POC magnet, VAH and VAL walls) with snap-to-POC targets, score 42 signals across six engines and seven timeframes into an equal-weight buy/sell power matrix, and run an optional semi-auto DCA engine with BE-Lot or Martingale sizing, a draggable Zone Box, hard single/basket lot caps and Smart Shield breakout hedging. An on-demand sync tab sends closed deals to the dashboard. Auto break-even at TP1, automatic cancellation of stale pendings and daily loss/gain limits keep manual trading disciplined.",
    ].join("\n\n"),
    "gsn-phoenix-grid": [
        "Shadow Matrix is a trend-seeded dual-grid system for XAUUSD. An M5 seed order is filtered by one of six entry engines (EMA, SuperTrend, Ichimoku, ADX + RSI, Bollinger or MACD); the first order takes a fast scalp at +90 points, while an adverse move locks a counter-hedge at −250 points before the M15 grid expands on both sides every 150 points. Winning sides scale at 1.05× and losing sides at 1.60×, but the EMA-34 reversal brake halves counter-trend lots so a one-way gold move does not multiply the wrong side.",
        "A Recovery Corridor Trap seeds pairs at the earliest BUY/SELL boundaries, Same-Side Smart Pruning pairs the newest winner with the oldest loser once a side holds five orders, and the basket closes asynchronously the moment combined floating profit reaches the $50 target (up to 8 tiers). The Obsidian on-chart panel shows account telemetry, both grids and a monthly profit heatmap, with CLOSE ALL, LAST ROUND and editable strategy/risk settings that persist across restarts.",
    ].join("\n\n"),
    "snr-system": [
        "SNR System is a three-module Malaysian support-and-resistance EA that trades XAUUSD and major FX pairs with BUY LIMIT and SELL LIMIT orders. Module 1 marks levels from candle bodies — A-peaks, V-valleys and same-colour GAP junctions — validates freshness (MISS) and engulfing confluence (EG / Bystra), applies resistance-becomes-support and support-becomes-resistance flips, then places limit orders inside a configurable minimum spacing and pending cap.",
        "Module 2 adds ICT structure: fractal swing highs and lows, CHoCH / BOS breaks and a Fibonacci OTE 0.618–0.786 zone with single-entry (move to break-even at 1R) or DCA recovery. Module 3 projects major swing S&R and Bollinger 20/2.0 extremes with the same single/DCA modes and multi-step trailing. Every order carries a hard stop loss and configurable risk-reward, and the on-chart Command Deck edits base lot, SL distance, R:R, spacing, pending cap, DCA step and trailing, deletes one side's pendings, or rescans M15 / H1 / H4 without reopening inputs.",
    ].join("\n\n"),
};

async function main() {
    const slugs = Object.keys(DESCRIPTIONS);
    const products = await prisma.eAProduct.findMany({
        where: { slug: { in: slugs } },
        select: { id: true, name: true, slug: true },
    });

    for (const product of products) {
        await prisma.eAProduct.update({
            where: { id: product.id },
            data: { description: DESCRIPTIONS[product.slug] },
        });
        console.log(`Updated description for "${product.name}" (${product.slug}).`);
    }

    const foundSlugs = new Set(products.map((product) => product.slug));
    const missingSlugs = slugs.filter((slug) => !foundSlugs.has(slug));
    if (missingSlugs.length > 0) {
        console.error(`Products not found: ${missingSlugs.join(", ")}`);
        process.exitCode = 1;
    }
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
