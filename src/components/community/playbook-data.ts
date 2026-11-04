import { BarChart3, Send, BookOpen, Cpu } from "lucide-react";

export interface PlaybookChapter {
    chapterNumber: string;
    leftPageNum: string;
    rightPageNum: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    teaserQuestion: string;
    description: string;
    highlights: string[];
    quote: string;
    cta: string;
    hrefKey: "analysis" | "telegram" | "journal" | "systems";
    external: boolean;
    icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const PLAYBOOK_CHAPTERS: PlaybookChapter[] = [
    {
        chapterNumber: "01",
        leftPageNum: "01",
        rightPageNum: "02",
        icon: BarChart3,
        eyebrow: "START THE DAY WITH CONTEXT",
        title: "Daily Market Analysis",
        subtitle: "Morning XAUUSD Bias & Liquidity Map",
        teaserQuestion:
            "How do we map XAUUSD buy/sell zones before London & NY sessions open?",
        description:
            "Fresh XAUUSD analysis every morning — buy/sell zones, key levels, and market context. All mapped out so you can start your day prepared.",
        highlights: [
            "XAUUSD daily & H4 structure breakdown",
            "High-probability Buy & Sell reaction zones",
            "Key liquidity pools & invalidation levels",
        ],
        quote: "Never enter a session blind. Map the levels first, then wait for price to come to your zone.",
        cta: "See today's analysis",
        hrefKey: "analysis",
        external: true,
    },
    {
        chapterNumber: "02",
        leftPageNum: "03",
        rightPageNum: "04",
        icon: Send,
        eyebrow: "CLEAR SETUPS, SHARED DAILY",
        title: "Free Trading Signals",
        subtitle: "Pre-Defined Entry, Hard SL & Split TP",
        teaserQuestion:
            "Once price reaches the zone, where is the exact Entry, Hard SL, and TP?",
        description:
            "No paywall for the basics. Free signals with clear entry, TP, and SL levels shared daily in the channel.",
        highlights: [
            "Exact entry trigger & hard stop-loss",
            "Strict 1-2% capital risk per setup",
            "Real-time trade management updates",
        ],
        quote: "Every setup carries a hard stop-loss and cold risk math — capital preservation comes before profit.",
        cta: "Join Telegram free",
        hrefKey: "telegram",
        external: true,
    },
    {
        chapterNumber: "03",
        leftPageNum: "05",
        rightPageNum: "06",
        icon: BookOpen,
        eyebrow: "TRACK & AUDIT EVERY TRADE",
        title: "Automated Trade Journal",
        subtitle: "MT5 EA Sync, Equity Curve & Behavioral Leak Radar",
        teaserQuestion:
            "How do you track every XAUUSD trade and spot where your discipline breaks?",
        description:
            "Sync your Demo or Live MT5 account via EA with zero password sharing. Every trade is logged automatically to expose revenge sizing, early exits, and session win rates.",
        highlights: [
            "Real-time MT5 sync via EA (Demo & Live)",
            "Behavioral leak & revenge-trade detection",
            "Session, strategy & R-multiple analytics",
        ],
        quote: "Signals give you setups; your trading journal shows you why you keep giving profits back.",
        cta: "Start Free Journal",
        hrefKey: "journal",
        external: false,
    },
    {
        chapterNumber: "04",
        leftPageNum: "07",
        rightPageNum: "08",
        icon: Cpu,
        eyebrow: "SYSTEMATIC & AUTOMATED TRADING",
        title: "Trading Systems & EAs",
        subtitle: "Automated MT5 Execution & Risk Guard",
        teaserQuestion:
            "Ready to automate execution and enforce hard drawdown rules on MT5?",
        description:
            "Explore automated MT5 EAs, strategy suites, and custom execution tools built for disciplined risk management and systematic trading.",
        highlights: [
            "GoldScalperNinja v3.1 & Shadow Matrix v1.0",
            "GSN Trade Manager v2.0 1-click execution",
            "Hard equity stop & automated pruning",
        ],
        quote: "Let code enforce the rules your emotions try to break during high-volatility XAUUSD spikes.",
        cta: "Explore Trading Systems",
        hrefKey: "systems",
        external: false,
    },
];

