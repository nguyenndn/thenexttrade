/**
 * Writes the catalog description for every Expert Advisor product.
 * Matches by slug so it is safe to re-run on local, staging, or production.
 *
 * Usage: node prisma/update-ea-product-descriptions.cjs
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DESCRIPTIONS = {
    "goldscalperninja-ea": [
        "GoldScalperNinja is an automated XAUUSD recovery EA for MetaTrader 5. Instead of firing a grid level immediately, it trails stop entries behind price and opens an order after a configured rebound. Five lot-ladder styles (A–E) control how volume grows along a recovery chain, and Smart Pruning pairs profitable positions with older losing positions to reduce the open chain exposure.",
        "Auto Trend Master reads the daily candle body and the previous daily close to restrict entries against a strong daily move. The panel separates direction permissions, new-cycle control and the EA ON/OFF state: CYCLE: OFF stops a fresh cycle while existing chains keep being managed, and the remote mobile ON/OFF command pauses or resumes trading without closing positions. Several protections ship disabled (lot caps, global stop loss and daily profit/loss limits set to 0); recovery trading can increase floating loss and margin use during a one-way move, and no pruning or filter guarantees a profitable exit.",
    ].join("\n\n"),
    "gsn-trade-manager": [
        "GSN Trade Manager is a manual execution and risk-management deck for MetaTrader 5 with five tabs: TRADE, GOLD ZONE, TREND, SEMI and SYNC. TRADE plans entry, stop loss and three weighted take-profits on draggable chart lines, then handles market or pending orders, partial closes at TP1–TP3, break-even moves and close-all with optional B/S/E/X hotkeys. GOLD ZONE maps supply and demand zones against the session Volume Profile with Daily POC, VAH and VAL.",
        "TREND scores six signal engines across seven timeframes into a buy/sell confluence matrix. SEMI offers an optional recovery engine with Break-Even-Lot or multiplier sizing, a draggable zone box, single/basket lot caps and Smart Shield hedging. SYNC checks the license and account on CONNECT and uploads closed-trade history only for the date range you select; the guide states a $200 minimum balance for real-account CONNECT (none for demo). Auto break-even at TP1, stale-pending cancellation and daily loss/gain limits (2% / 3% when enabled, OFF by default) keep manual trading disciplined.",
    ].join("\n\n"),
    "gsn-shadown-matrix": [
        "Shadow Matrix is a trend-seeded dual-grid system for XAUUSD. A single market seed is taken from one of six M5 filters — MA, SuperTrend, Ichimoku, ADX + RSI, Bollinger or MACD — and a lone position targets a fast +90-point scalp (about $0.90 on gold). A 250-point adverse move locks a counter-hedge in the opposite direction, after which the regular dual grid expands on a new M15 bar in 150-point steps.",
        "Winning sides scale at 1.05× and losing sides at 1.60×, with an optional EMA-34 reversal brake halving the new counter-trend lot. Recovery Corridor Trap pairs orders near the oldest BUY/SELL boundaries when price is at least one grid step from the newest order, and same-side pruning starts at five orders, pairing a profitable order with the deepest losing order for a $1 net surplus. The basket closes asynchronously at a $50 combined target. Tier count is not hard-capped, drawdown is displayed but not stopped, there is no news filter, and the hedge trigger is an entry threshold rather than a stop loss.",
    ].join("\n\n"),
    "gsn-snr-system": [
        "SNR System is a three-module limit-order EA for XAUUSD. Module 1 (MSNR) marks support and resistance from candle bodies — A-peaks, V-valleys and same-colour GAP junctions — validates freshness and engulfing confluence, and flips broken levels into RBS/SBR roles. Module 2 (ICT OTE) maps CHoCH/BOS structure, 0.618–0.786 optimal-trade-entry zones and fair-value-gap confluence. Module 3 (Dynamic S&R) is an optional swing-level and Bollinger 20/2.0 engine that ships disabled.",
        "Every order carries its own broker-side stop loss and take profit on a fixed base lot — there is no averaging, multiplier DCA, basket recovery or trailing. Untouched inputs apply chart-timeframe presets: H1 0.02 lot with $10 SL / $20 TP, M30 0.04 with $7.50 / $15, M15 0.02 with $5 / $10, M5 0.01 with $4 / $8, all at the declared 1:2 R:R, with $10 / $6 / $3.50 / $1.50 minimum spacing and six pending orders per module. Optional layers are a daily-equity drawdown gate, +1.3R break-even and H1 storyline telemetry; the on-chart Command Deck edits lot, SL, R:R, spacing and pending cap live, deletes or locks one side's pendings, rescans on demand and closes managed positions.",
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
