// Journal Autopilot — AI writes the trading-psychology fields for EA-synced
// closed trades that arrive with them all empty (entryReason, exitReason,
// notesPsychology, mistakes, emotionBefore/After, followedPlan).
//
// Runs from the /api/cron/journal-autopilot route only (no per-trade manual
// button by design). Text-only calls routed through the central AI Gateway, so
// each entry costs a regular quota slot (Pro 100/day, Free 10/day) and is
// processed exactly once (autopilotStatus null → PROCESSED / FAILED).

import { prisma } from "@/lib/prisma";
import { getUserProAccess } from "@/lib/pro-access";
import { executeAiGateway } from "@/lib/ai-gateway/provider-router";
import { reserveAiRequest } from "@/lib/ai-gateway/quota-service";
import { randomUUID } from "node:crypto";
import { ALL_MISTAKES } from "@/lib/mistakes";
import psychologyData from "@/data/psychology.json";

export const JOURNAL_AUTOPILOT_PROMPT_VERSION = "1.0";

// How far back the sweep looks for un-processed EA-synced closed trades.
export const JOURNAL_AUTOPILOT_LOOKBACK_DAYS = 7;
// Max entries processed per user per cron run — bounds AI cost per user.
export const JOURNAL_AUTOPILOT_MAX_PER_USER = 20;
// DB status values written to JournalEntry.autopilot_status.
export const AUTOPILOT_STATUS_PROCESSED = "PROCESSED";
export const AUTOPILOT_STATUS_FAILED = "FAILED";

// ---------------------------------------------------------------------------
// Allowed emotion labels — must stay in sync with src/data/psychology.json so
// the AI output renders correctly in the existing EmotionSelector UI.
// ---------------------------------------------------------------------------
const EMOTION_LABELS = Array.from(
    new Set(
        Object.values(psychologyData).flatMap((phase) =>
            Object.values(phase).flatMap((group) =>
                group.map((item) => item.label)
            )
        )
    )
);

// Allowed mistake codes — from src/lib/mistakes.ts (20 canonical codes).
const MISTAKE_CODES = ALL_MISTAKES.map((m) => m.code);

// ---------------------------------------------------------------------------
// Settings toggle (stored in User.settings.journalAutopilot)
// ---------------------------------------------------------------------------

/** Read the toggle from a raw User.settings value. Corrupt value → false. */
export function getJournalAutopilot(settings: unknown): boolean {
    if (!settings || typeof settings !== "object") return false;
    const value = (settings as Record<string, unknown>).journalAutopilot;
    return typeof value === "boolean" ? value : false;
}

/** Persist the toggle, preserving every other settings key. */
export async function updateJournalAutopilot(
    userId: string,
    enabled: boolean
): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { settings: true },
    });
    const existingSettings =
        (user?.settings as Record<string, unknown> | null) || {};
    await prisma.user.update({
        where: { id: userId },
        data: { settings: { ...existingSettings, journalAutopilot: enabled } },
    });
}

// ---------------------------------------------------------------------------
// Prompt + response parsing
// ---------------------------------------------------------------------------

export interface AutopilotEntry {
    id: string;
    userId: string;
    symbol: string;
    type: string;
    entryPrice: number;
    exitPrice: number | null;
    stopLoss: number | null;
    takeProfit: number | null;
    lotSize: number;
    pnl: number | null;
    result: string | null;
    entryDate: Date;
    exitDate: Date | null;
}

export interface AutopilotResult {
    entryReason: string;
    exitReason: string;
    notesPsychology: string;
    mistakes: string[];
    emotionBefore: string | null;
    emotionAfter: string | null;
    followedPlan: boolean | null;
}

function stripCodeFences(content: string): string {
    const clean = content.trim();
    if (!clean.startsWith("```")) return clean;
    const firstLineEnd = clean.indexOf("\n");
    const withoutOpeningFence =
        firstLineEnd >= 0 ? clean.slice(firstLineEnd + 1) : clean;
    return withoutOpeningFence.replace(/```\s*$/, "").trim();
}

function asTrimmedString(value: unknown, maxLength: number): string | null {
    return typeof value === "string" && value.trim()
        ? value.trim().slice(0, maxLength)
        : null;
}

function toAllowedLabel(value: unknown): string | null {
    return typeof value === "string" &&
        EMOTION_LABELS.includes(value.trim())
        ? value.trim()
        : null;
}

function toAllowedMistakeCodes(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return Array.from(
        new Set(
            value
                .filter((code): code is string => typeof code === "string")
                .map((code) => code.trim())
                .filter((code) => MISTAKE_CODES.includes(code))
        )
    ).slice(0, 5);
}

function toOptionalBoolean(value: unknown): boolean | null {
    return typeof value === "boolean" ? value : null;
}

/**
 * Parse + validate the model's JSON into an AutopilotResult.
 * Returns null when the payload is not JSON or a required field is missing so
 * the caller can mark the entry FAILED instead of persisting garbage.
 * Optional fields are sanitized against the whitelists.
 */
export function parseAutopilotResponse(content: string): AutopilotResult | null {
    let parsed: unknown;
    try {
        parsed = JSON.parse(stripCodeFences(content));
    } catch (error) {
        console.warn("[Journal Autopilot] Invalid JSON response", error);
        return null;
    }
    if (!parsed || typeof parsed !== "object") return null;

    const raw = parsed as Record<string, unknown>;
    const entryReason = asTrimmedString(raw.entryReason, 500);
    const exitReason = asTrimmedString(raw.exitReason, 500);
    if (!entryReason || !exitReason) return null;

    return {
        entryReason,
        exitReason,
        notesPsychology:
            asTrimmedString(raw.notesPsychology, 1000) || "",
        mistakes: toAllowedMistakeCodes(raw.mistakes),
        emotionBefore: toAllowedLabel(raw.emotionBefore),
        emotionAfter: toAllowedLabel(raw.emotionAfter),
        followedPlan: toOptionalBoolean(raw.followedPlan),
    };
}

/** Build the system prompt for one EA-synced closed trade. */
export function buildAutopilotSystemPrompt(
    entry: AutopilotEntry
): string {
    const holdingMinutes =
        entry.entryDate && entry.exitDate
            ? Math.max(
                  1,
                  Math.round(
                      (new Date(entry.exitDate).getTime() -
                          new Date(entry.entryDate).getTime()) /
                          60000
                  )
              )
            : null;
    const risk =
        entry.stopLoss != null
            ? Math.abs(entry.entryPrice - entry.stopLoss)
            : null;
    const reward =
        entry.entryPrice != null && entry.exitPrice != null
            ? Math.abs(entry.exitPrice - entry.entryPrice)
            : null;
    const riskReward =
        risk && risk > 0 && reward != null
            ? Number((reward / risk).toFixed(2))
            : null;

    const trade = {
        symbol: entry.symbol,
        direction: entry.type,
        entryPrice: entry.entryPrice,
        exitPrice: entry.exitPrice,
        stopLoss: entry.stopLoss,
        takeProfit: entry.takeProfit,
        lotSize: entry.lotSize,
        pnl: entry.pnl,
        result: entry.result || "UNKNOWN",
        holdingMinutes,
        riskRewardRatio: riskReward,
    };

    return `You are TheNextTrade Journal Autopilot. A broker EA automatically imported the closed trade below, so the trader never wrote a psychology review for it. Write a brief, honest retrospective review in the trader's voice.

Rules:
- Write in clear, simple English. Do NOT give market predictions, Buy/Sell advice, or position-size advice.
- Base every statement only on the trade data provided. If something cannot be known from the data (e.g. the exact reason the trader opened), describe the most likely interpretation and keep it neutral — never invent unverifiable facts.
- "emotionBefore" and "emotionAfter" MUST each be one of the allowed emotion labels, or null.
- "mistakes" MUST be an array of allowed mistake codes (empty array if none clearly apply). Pick only codes that are well supported by the data.
- "followedPlan" is true when the trade structure suggests a rule-based entry with a stop loss; false when it looks impulsive or rule-breaking; null only if unclear.
- Do NOT include a field name outside the schema below. Return JSON only.

Allowed emotion labels: ${EMOTION_LABELS.join(", ")}

Allowed mistake codes: ${MISTAKE_CODES.join(", ")}

Respond with exactly this JSON shape:
{
  "entryReason": "string, under 80 words",
  "exitReason": "string, under 80 words",
  "notesPsychology": "string, under 150 words — one concise psychology note",
  "mistakes": ["allowed mistake codes"],
  "emotionBefore": "allowed label or null",
  "emotionAfter": "allowed label or null",
  "followedPlan": true or false or null
}

VERIFIED_TRADE
${JSON.stringify(trade, null, 2)}
END_VERIFIED_TRADE`;
}

// ---------------------------------------------------------------------------
// Per-entry processing
// ---------------------------------------------------------------------------

export type AutopilotOutcome = "filled" | "failed" | "quota";

/**
 * Run the AI autopilot for a single EA-synced closed entry.
 * - quota: daily quota hit → leaves autopilotStatus null so the next cron run
 *   retries (the reservation is NOT persisted, so no slot is burned).
 * - filled: gateway + parse succeeded → psychology fields written, status PROCESSED.
 * - failed: gateway error, unusable response, or DB write error → status FAILED
 *   (permanently marks the entry as attempted so it is not re-tried every run).
 */
export async function processAutopilotForEntry(
    entry: AutopilotEntry
): Promise<AutopilotOutcome> {
    const requestId = `jap_${randomUUID()}`;
    const reservation = await reserveAiRequest({
        requestId,
        userId: entry.userId,
        symbol: entry.symbol,
        analysisMode: "JOURNAL_AUTOPILOT",
        promptVersion: JOURNAL_AUTOPILOT_PROMPT_VERSION,
        taskKey: "JOURNAL_AUTOPILOT",
    });

    if (reservation.status === "QUOTA_EXCEEDED") {
        return "quota";
    }
    if (reservation.status !== "RESERVED") {
        await prisma.journalEntry.update({
            where: { id: entry.id },
            data: { autopilotStatus: AUTOPILOT_STATUS_FAILED },
        });
        return "failed";
    }

    const systemPrompt = buildAutopilotSystemPrompt(entry);

    try {
        const gatewayResult = await executeAiGateway({
            requestId,
            userId: entry.userId,
            snapshot: { trade: entry },
            systemPrompt,
            taskKey: "JOURNAL_AUTOPILOT",
            skipTradingSchemaValidation: true,
        });

        if (!gatewayResult.ok || !gatewayResult.rawResult) {
            console.error(
                "[Journal Autopilot] Gateway Error:",
                gatewayResult.message
            );
            await prisma.journalEntry.update({
                where: { id: entry.id },
                data: { autopilotStatus: AUTOPILOT_STATUS_FAILED },
            });
            return "failed";
        }

        const rawContent = gatewayResult.rawResult;
        const content =
            typeof rawContent === "string"
                ? rawContent
                : JSON.stringify(rawContent);
        const parsed = parseAutopilotResponse(content);
        if (!parsed) {
            await prisma.journalEntry.update({
                where: { id: entry.id },
                data: { autopilotStatus: AUTOPILOT_STATUS_FAILED },
            });
            return "failed";
        }

        await prisma.journalEntry.update({
            where: { id: entry.id },
            data: {
                entryReason: parsed.entryReason,
                exitReason: parsed.exitReason,
                notesPsychology: parsed.notesPsychology,
                mistakes: parsed.mistakes,
                emotionBefore: parsed.emotionBefore,
                emotionAfter: parsed.emotionAfter,
                followedPlan: parsed.followedPlan,
                autopilotStatus: AUTOPILOT_STATUS_PROCESSED,
            },
        });
        return "filled";
    } catch (error) {
        console.error("[Journal Autopilot] Processing Error:", error);
        await prisma.journalEntry.update({
            where: { id: entry.id },
            data: { autopilotStatus: AUTOPILOT_STATUS_FAILED },
        });
        return "failed";
    }
}

// ---------------------------------------------------------------------------
// Sweep (cron entry point)
// ---------------------------------------------------------------------------

export interface AutopilotSweepSummary {
    scanned: number;
    eligible: number;
    filled: number;
    failed: number;
    quotaExceeded: number;
    skippedNoToggle: number;
    skippedNoPro: number;
}

/**
 * Find EA-synced CLOSED trades from the last 7 days with empty psychology
 * fields and fill them via AI — once per trade, respecting the user's toggle
 * and Pro access, capped at 20 trades per user per run.
 */
export async function runJournalAutopilotSweep(): Promise<AutopilotSweepSummary> {
    const cutoff = new Date(
        Date.now() - JOURNAL_AUTOPILOT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000
    );

    const candidates = await prisma.journalEntry.findMany({
        where: {
            status: "CLOSED",
            syncSource: "EA_SYNC",
            autopilotStatus: null,
            exitDate: { gte: cutoff },
        },
        orderBy: { exitDate: "desc" },
        select: {
            id: true,
            userId: true,
            symbol: true,
            type: true,
            entryPrice: true,
            exitPrice: true,
            stopLoss: true,
            takeProfit: true,
            lotSize: true,
            pnl: true,
            result: true,
            entryDate: true,
            exitDate: true,
        },
    });

    const summary: AutopilotSweepSummary = {
        scanned: candidates.length,
        eligible: 0,
        filled: 0,
        failed: 0,
        quotaExceeded: 0,
        skippedNoToggle: 0,
        skippedNoPro: 0,
    };

    // Group candidates per user so the toggle / Pro check runs once per user.
    const byUser = new Map<string, AutopilotEntry[]>();
    for (const candidate of candidates) {
        const bucket = byUser.get(candidate.userId) || [];
        bucket.push(candidate as unknown as AutopilotEntry);
        byUser.set(candidate.userId, bucket);
    }

    for (const [userId, entries] of byUser) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { settings: true },
        });
        if (!user) {
            continue;
        }
        if (!getJournalAutopilot(user.settings)) {
            summary.skippedNoToggle += entries.length;
            continue;
        }
        const pro = await getUserProAccess(userId);
        if (!pro.isPro) {
            summary.skippedNoPro += entries.length;
            continue;
        }

        const capped = entries.slice(0, JOURNAL_AUTOPILOT_MAX_PER_USER);
        summary.eligible += capped.length;
        for (const entry of capped) {
            const outcome = await processAutopilotForEntry(entry);
            if (outcome === "filled") summary.filled += 1;
            else if (outcome === "failed") summary.failed += 1;
            else if (outcome === "quota") summary.quotaExceeded += 1;
        }
    }

    return summary;
}
