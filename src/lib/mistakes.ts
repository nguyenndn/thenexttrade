
export interface Mistake {
    code: string;
    category: string;
    name: string;
    description: string;
    severity: "low" | "medium" | "high";
    emoji: string;
}

export const MISTAKE_CATEGORIES = [
    "Entry",
    "Exit",
    "Position",
    "Psychology",
    "Rules",
] as const;

export const MISTAKES: Record<string, Mistake[]> = {
    Entry: [
        {
            code: "ENTRY_EARLY",
            category: "Entry",
            name: "Entered Too Early",
            description: "Did not wait for confirmation",
            severity: "medium",
            emoji: "⏰",
        },
        {
            code: "ENTRY_LATE",
            category: "Entry",
            name: "Entered Too Late",
            description: "Missed optimal entry point",
            severity: "low",
            emoji: "🐢",
        },
        {
            code: "ENTRY_CHASED",
            category: "Entry",
            name: "Chased Price",
            description: "Entered after price already moved",
            severity: "medium",
            emoji: "🏃",
        },
        {
            code: "ENTRY_FOMO",
            category: "Entry",
            name: "FOMO Entry",
            description: "Fear of missing out entry",
            severity: "high",
            emoji: "😱",
        },
    ],
    Exit: [
        {
            code: "EXIT_EARLY",
            category: "Exit",
            name: "Exited Too Early",
            description: "Closed position before target",
            severity: "medium",
            emoji: "🚪",
        },
        {
            code: "EXIT_LATE",
            category: "Exit",
            name: "Exited Too Late",
            description: "Held position too long",
            severity: "medium",
            emoji: "⏳",
        },
        {
            code: "EXIT_MOVED_SL",
            category: "Exit",
            name: "Moved Stop Loss",
            description: "Widened SL during trade",
            severity: "high",
            emoji: "🚫",
        },
        {
            code: "EXIT_TIGHT_TRAIL",
            category: "Exit",
            name: "Trailed Too Tight",
            description: "Trailing SL was too close",
            severity: "low",
            emoji: "📏",
        },
    ],
    Position: [
        {
            code: "POS_OVERSIZE",
            category: "Position",
            name: "Oversized Position",
            description: "Position too large for risk",
            severity: "high",
            emoji: "📈",
        },
        {
            code: "POS_UNDERSIZE",
            category: "Position",
            name: "Undersized Position",
            description: "Position too small",
            severity: "low",
            emoji: "📉",
        },
        {
            code: "POS_ADD_LOSER",
            category: "Position",
            name: "Added to Loser",
            description: "Averaged down on losing trade",
            severity: "high",
            emoji: "💸",
        },
        {
            code: "POS_CUT_WINNER",
            category: "Position",
            name: "Cut Winner Early",
            description: "Closed winning trade too soon",
            severity: "medium",
            emoji: "✂️",
        },
    ],
    Psychology: [
        {
            code: "PSY_REVENGE",
            category: "Psychology",
            name: "Revenge Trade",
            description: "Trading to recover losses",
            severity: "high",
            emoji: "😡",
        },
        {
            code: "PSY_FEAR",
            category: "Psychology",
            name: "Fear Exit",
            description: "Exited due to fear, not plan",
            severity: "medium",
            emoji: "😨",
        },
        {
            code: "PSY_GREED",
            category: "Psychology",
            name: "Greed Hold",
            description: "Held too long due to greed",
            severity: "medium",
            emoji: "🤑",
        },
        {
            code: "PSY_IMPATIENT",
            category: "Psychology",
            name: "Impatient Entry",
            description: "Entered without waiting",
            severity: "medium",
            emoji: "⚡",
        },
    ],
    Rules: [
        {
            code: "RULE_BROKE",
            category: "Rules",
            name: "Broke Trading Rules",
            description: "Violated trading plan",
            severity: "high",
            emoji: "❌",
        },
        {
            code: "RULE_TIMEFRAME",
            category: "Rules",
            name: "Wrong Timeframe",
            description: "Used incorrect timeframe",
            severity: "medium",
            emoji: "📊",
        },
        {
            code: "RULE_SESSION",
            category: "Rules",
            name: "Wrong Session",
            description: "Traded outside planned session",
            severity: "low",
            emoji: "🌙",
        },
        {
            code: "RULE_NO_CONFIRM",
            category: "Rules",
            name: "No Confirmation",
            description: "Entered without confirmation",
            severity: "medium",
            emoji: "❓",
        },
    ],
};

export const ALL_MISTAKES = Object.values(MISTAKES).flat();

export function getMistakeByCode(code: string): Mistake | undefined {
    return ALL_MISTAKES.find(m => m.code === code);
}

export function getMistakeSeverityColor(severity: string): string {
    switch (severity) {
        case "high": return "text-red-500 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20";
        case "medium": return "text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20";
        case "low": return "text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20";
        default: return "text-gray-500 bg-gray-50 dark:bg-gray-500/10 border-gray-200 dark:border-gray-500/20";
    }
}
