
// Map of broker names to identifying patterns in server names or company names
const BROKER_PATTERNS: Record<string, string[]> = {
    "IC Markets": ["ICMarkets", "ICMarketsEU", "ICMarkets-Live", "International Capital Markets"],
    "Pepperstone": ["Pepperstone", "PepperstoneUK", "Pepperstone-Edge"],
    "FTMO": ["FTMO", "FTMODemo", "FTMO-Server"],
    "Exness": ["Exness", "Exness-Real", "Exness-Trial"],
    "XM": ["XMGlobal", "XM.COM", "XM-Real", "XM-Demo"],
    "FxPro": ["FxPro", "FxPro.com", "FxPro-Real"],
    "Tickmill": ["Tickmill", "TickmillEU", "Tickmill-Live"],
    "MyForexFunds": ["MyForexFunds", "MFF"],
    "The5ers": ["The5ers", "5ers"],
    "ThinkMarkets": ["ThinkMarkets", "ThinkForex"],
    "FBS": ["FBS", "FBS-Real"],
    "OANDA": ["OANDA", "OANDA-Live"],
    "Eightcap": ["Eightcap", "Eightcap-Real"],
    "Axi": ["Axi", "AxiTrader", "AxiCorp"],
    "Vantage": ["Vantage", "VantageFX"],
    "RoboForex": ["RoboForex"],
    "JustMarkets": ["JustMarkets", "JustForex"],
};

export function detectBroker(server: string, company: string): string | null {
    // Normalize inputs
    const combined = `${server} ${company}`.toLowerCase();

    // Check against known patterns
    for (const [broker, patterns] of Object.entries(BROKER_PATTERNS)) {
        for (const pattern of patterns) {
            if (combined.includes(pattern.toLowerCase())) {
                return broker;
            }
        }
    }

    // Fallback 1: If company name looks like a broker (ignoring "Ltd", "LLC", etc)
    if (company) {
        const cleanCompany = company
            .replace(/\s+(Ltd|LLC|Pty|Corp|Inc|Limited)\.?$/i, "")
            .trim();

        if (cleanCompany.length > 2) { // Avoid short acronyms
            return cleanCompany;
        }
    }

    // Fallback 2: Extract from server name (e.g. "SomeBroker-Live")
    if (server) {
        const parts = server.split("-");
        if (parts.length > 0 && parts[0].length > 2) {
            return parts[0];
        }
    }

    return null;
}
