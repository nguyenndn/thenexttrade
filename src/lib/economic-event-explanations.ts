export interface EventExplanation {
    title: string;
    category: string;
    impactDescription: string;
    tradingTakeaway: string;
    affectedAssets: string[];
}

export const EVENT_EXPLANATIONS: Record<string, EventExplanation> = {
    cpi: {
        title: "Consumer Price Index (CPI)",
        category: "Inflation",
        impactDescription:
            "Measures the average change over time in prices paid by urban consumers for goods and services. High CPI indicates rising inflation.",
        tradingTakeaway:
            "Higher than expected CPI generally strengthens the currency as central banks are likely to raise interest rates to curb inflation. Lower CPI weakens currency.",
        affectedAssets: ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "US Indices"],
    },
    fomc: {
        title: "Federal Open Market Committee (FOMC)",
        category: "Central Bank Policy",
        impactDescription:
            "The Fed's decision-making body on interest rates, monetary supply, and economic outlook for the United States.",
        tradingTakeaway:
            "Rate hikes or hawkish statements boost USD and press gold/stocks down. Rate cuts or dovish guidance weaken USD and boost gold/stocks.",
        affectedAssets: ["XAUUSD", "EURUSD", "USDJPY", "S&P 500", "US Treasury Yields"],
    },
    nfp: {
        title: "Non-Farm Payrolls (NFP)",
        category: "Employment",
        impactDescription:
            "Measures the monthly change in number of employed people in the US, excluding the farming industry.",
        tradingTakeaway:
            "Strong NFP (> forecast) signals economic strength, driving USD higher and gold lower. Weak NFP increases recession fears or rate cut expectations.",
        affectedAssets: ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD"],
    },
    gdp: {
        title: "Gross Domestic Product (GDP)",
        category: "Economic Output",
        impactDescription:
            "The broadest quantitative measure of a nation's total economic activity and growth rate.",
        tradingTakeaway:
            "Robust GDP growth suggests a healthy economy, supporting currency valuation. Negative growth triggers recession concerns.",
        affectedAssets: ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY"],
    },
    pce: {
        title: "Personal Consumption Expenditures (PCE)",
        category: "Inflation",
        impactDescription:
            "The Federal Reserve's preferred measure of consumer inflation, excluding volatile food and energy items in Core PCE.",
        tradingTakeaway:
            "Directly dictates Fed rate expectations. Higher Core PCE = Hawkish Fed = USD Bullish.",
        affectedAssets: ["XAUUSD", "EURUSD", "USDJPY"],
    },
    ppi: {
        title: "Producer Price Index (PPI)",
        category: "Inflation",
        impactDescription:
            "Measures average changes in selling prices received by domestic producers for their output. Leading indicator for CPI.",
        tradingTakeaway:
            "Higher PPI leads to higher CPI down the road, creating hawkish rate expectations.",
        affectedAssets: ["XAUUSD", "EURUSD", "USDJPY"],
    },
    retail: {
        title: "Retail Sales",
        category: "Consumer Spending",
        impactDescription:
            "Tracks total receipts of retail stores. Consumer spending accounts for nearly 70% of total US GDP.",
        tradingTakeaway:
            "Strong retail sales signal resilient consumer demand, strengthening the currency.",
        affectedAssets: ["XAUUSD", "EURUSD", "GBPUSD"],
    },
};

export function getEventExplanation(title: string): EventExplanation | null {
    const clean = title.toLowerCase();
    if (clean.includes("cpi") || clean.includes("consumer price")) return EVENT_EXPLANATIONS.cpi;
    if (clean.includes("fomc") || clean.includes("fed rate") || clean.includes("interest rate")) return EVENT_EXPLANATIONS.fomc;
    if (clean.includes("nfp") || clean.includes("non-farm") || clean.includes("payrolls")) return EVENT_EXPLANATIONS.nfp;
    if (clean.includes("gdp") || clean.includes("gross domestic")) return EVENT_EXPLANATIONS.gdp;
    if (clean.includes("pce") || clean.includes("personal consumption")) return EVENT_EXPLANATIONS.pce;
    if (clean.includes("ppi") || clean.includes("producer price")) return EVENT_EXPLANATIONS.ppi;
    if (clean.includes("retail sales")) return EVENT_EXPLANATIONS.retail;
    return null;
}
