import { z } from "zod";

export const CAMPAIGN_SEGMENTS = [
    "ALL_USERS",
    "FREE_TRIAL",
    "VIP_PRO",
    "HAS_MT5",
    "NO_MT5",
    "CUSTOM_LIST",
] as const;

export type CampaignSegmentId = (typeof CAMPAIGN_SEGMENTS)[number];

export interface SegmentSummaryCount {
    total: number;
    optedIn: number;
    skipped: number;
}

export type AudienceCountsMap = Record<
    Exclude<CampaignSegmentId, "CUSTOM_LIST">,
    SegmentSummaryCount
>;

export const campaignComposeSchema = z.object({
    campaignTitle: z.string().trim().max(120).optional(),
    badgeText: z.string().trim().max(48).optional(),
    subject: z
        .string()
        .trim()
        .min(3, "Subject must be at least 3 characters")
        .max(160, "Subject must be at most 160 characters"),
    preheader: z.string().trim().max(180).optional(),
    heading: z
        .string()
        .trim()
        .min(3, "Heading must be at least 3 characters")
        .max(160, "Heading must be at most 160 characters"),
    bodyContent: z
        .string()
        .trim()
        .min(10, "Email body must be at least 10 characters")
        .max(8000, "Email body is too long"),
    highlightTitle: z.string().trim().max(100).optional(),
    highlightItemsRaw: z.string().max(2500).optional(),
    ctaLabel: z.string().trim().max(60).optional(),
    ctaUrl: z.string().trim().max(500).optional(),
    secondaryCtaLabel: z.string().trim().max(60).optional(),
    secondaryCtaUrl: z.string().trim().max(500).optional(),
    footerNote: z.string().trim().max(400).optional(),
    segment: z.enum(CAMPAIGN_SEGMENTS),
    customEmailsRaw: z.string().max(20000).optional(),
});

export type CampaignComposeInput = z.infer<typeof campaignComposeSchema>;

export interface CampaignPreset {
    id: string;
    label: string;
    segment: CampaignSegmentId;
    badgeText: string;
    subject: string;
    preheader: string;
    heading: string;
    bodyContent: string;
    highlightTitle: string;
    highlightItemsRaw: string;
    ctaLabel: string;
    ctaUrl: string;
    secondaryCtaLabel: string;
    secondaryCtaUrl: string;
    footerNote: string;
}

export const CAMPAIGN_PRESETS: readonly CampaignPreset[] = [
    {
        id: "activate_mt5_sync",
        label: "Activate MT5 Sync",
        segment: "NO_MT5",
        badgeText: "MT5 TELEMETRY SETUP",
        subject: "{{name}}, connect your MT5 account in 60 seconds (no master password)",
        preheader:
            "Auto-log every entry, stop-loss, and exit straight from MetaTrader 5.",
        heading: "Stop logging trades by hand after a red day",
        bodyContent:
            "Hi {{name}},\n\nYour **TheNextTrade** workspace is active, but no MT5 account is connected yet. Spreadsheets always break right after an emotional loss — automated telemetry keeps your risk math honest.\n\nConnect any Demo, Live, or Prop Firm MT5 account using **Trade Manager EA** (Sync Key) or **Cloud Sync** (read-only investor password) to start tracking your Behavioral Leak Radar automatically.",
        highlightTitle: "What unlocks immediately after your first sync:",
        highlightItemsRaw:
            "Live MT5 trade telemetry with zero master password sharing\nBehavioral Leak Radar flagging revenge sizing and moved stop-losses\nSession win-rate breakdown across Asian, London, and New York hours",
        ctaLabel: "Connect My MT5 Account →",
        ctaUrl: "/dashboard/accounts",
        secondaryCtaLabel: "Setup Guide",
        secondaryCtaUrl: "/get-started",
        footerNote:
            "Works with Demo, Live, and Prop Firm accounts across regulated MT5 brokers.",
    },
    {
        id: "keep_vip_zero_fee",
        label: "Zero-Fee VIP Path",
        segment: "FREE_TRIAL",
        badgeText: "BROKER-FUNDED VIP",
        subject: "Keep full VIP & MT5 EAs for $0 subscription cost",
        preheader:
            "Your trading capital stays 100% in your own broker account.",
        heading: "Why pay $49/month for a trading journal?",
        bodyContent:
            "Hi {{name}},\n\nAt **TheNextTrade**, you never pay monthly subscription, course, or signal fees. Our AI Weekly Coach, Behavioral Leak Radar, and MT5 Expert Advisors stay permanently open when you trade on an eligible partner broker account.\n\nYour deposit (**$200+**) stays 100% in your own name at Tier-1 regulated brokers, and you can withdraw principal or profits anytime.",
        highlightTitle: "Included with Verified Partner VIP:",
        highlightItemsRaw:
            "Unlimited MT5 account sync & AI Behavioral Leak Radar\n10-Trade Discipline Sprint coaching after every 10 closed trades\nLifetime licenses for GoldScalperNinja & Trade Manager EAs",
        ctaLabel: "View Partner Brokers →",
        ctaUrl: "/brokers",
        secondaryCtaLabel: "Check VIP Status",
        secondaryCtaUrl: "/dashboard/trading-systems",
        footerNote:
            "Already have an Exness, Vantage, XM, or RoboForex account? You can link an existing profile or sub-account.",
    },
    {
        id: "weekly_risk_briefing",
        label: "Weekly Risk Briefing",
        segment: "ALL_USERS",
        badgeText: "WEEKLY DESK BRIEFING",
        subject: "New Trading Week: Check red-folder news & lock your lot size",
        preheader:
            "Review high-impact USD events and pre-calculate your hard stop-loss before London open.",
        heading: "Protect your capital before the first candle opens",
        bodyContent:
            "Hi {{name}},\n\nBefore placing your first XAUUSD or FX order this week, check the high-impact news schedule and lock your maximum risk per trade (**0.5% – 1.0%**).\n\nOne oversized revenge trade during CPI or NFP wipes out two weeks of disciplined execution. Run your cold risk math first, then execute your playbook.",
        highlightTitle: "Pre-Session Checklist:",
        highlightItemsRaw:
            "Check high-impact USD & central bank releases on the Economic Calendar\nCalculate exact lot size from your hard stop-loss distance\nReview your active 10-Trade Sprint rule inside the Journal",
        ctaLabel: "Open Position Size Calculator →",
        ctaUrl: "/tools/position-size-calculator",
        secondaryCtaLabel: "Economic Calendar",
        secondaryCtaUrl: "/tools/economic-calendar",
        footerNote:
            "Discipline is built one 10-trade sprint at a time — protect your downside first.",
    },
];

export function interpolateRecipientVars(
    template: string,
    recipientName?: string | null
): string {
    const cleanName = (recipientName || "").trim() || "Trader";
    return template.replace(/\{\{\s*name\s*\}\}/gi, cleanName);
}

export function resolveSafeEmailUrl(
    rawUrl: string | undefined,
    appUrl: string
): string | null {
    const trimmed = (rawUrl || "").trim();
    if (!trimmed) return null;

    const base = appUrl.replace(/\/+$/, "");
    if (trimmed.startsWith("/")) {
        return `${base}${trimmed}`;
    }
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }
    return null;
}

export function parseHighlightItems(raw: string | undefined): string[] {
    if (!raw) return [];
    return raw
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map((line) => line.replace(/^[-*•\s]+/, "").trim())
        .filter((line) => line.length > 0);
}

const singleEmailSchema = z.string().email();

export interface ParsedCustomEmails {
    validEmails: string[];
    invalidEntries: string[];
}

export function parseCustomRecipientList(
    raw: string | undefined
): ParsedCustomEmails {
    if (!raw || !raw.trim()) {
        return { validEmails: [], invalidEntries: [] };
    }

    const tokens = raw
        .split(/[\n,;]+/)
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

    const seen = new Set<string>();
    const validEmails: string[] = [];
    const invalidEntries: string[] = [];

    for (const token of tokens) {
        if (seen.has(token)) continue;
        seen.add(token);

        if (singleEmailSchema.safeParse(token).success) {
            validEmails.push(token);
        } else {
            invalidEntries.push(token);
        }
    }

    return { validEmails, invalidEntries };
}
