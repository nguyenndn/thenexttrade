import {
    ARCHETYPES,
    DIMENSIONS,
    QUESTIONS,
    type Archetype,
    type ArchetypeId,
    type DimensionId,
} from "@/config/trading-style-data";

/**
 * Trading Style Assessment — scoring engine.
 * Faithful port of the mmfx "Know Your Style" algorithm (extracted from its bundle):
 *   - special-case early exit for brand-new beginners
 *   - archetype counter over answered questions
 *   - max → tiebreak via q5's selected option → fallback first-in-iteration-order
 * Dimension scores are normalized to 0-100 against a fixed per-dimension
 * [min, max] range computed from the option deltas across all questions.
 */

const ARCHETYPE_IDS: ArchetypeId[] = [
    "reckless_gambler",
    "analysis_paralyser",
    "signal_dependent",
    "indicator_stacker",
    "emotional_revenge_trader",
    "news_trader",
    "system_hopper",
    "brand_new_beginner",
];

export interface DimensionScores {
    [key: string]: number;
}

interface DimensionRange {
    min: number;
    max: number;
}

/** Sum, per dimension, of the min/max option delta across every question. */
const DIMENSION_RANGES: Record<DimensionId, DimensionRange> = (() => {
    const ranges = {} as Record<DimensionId, DimensionRange>;
    for (const dim of DIMENSIONS) {
        let min = 0;
        let max = 0;
        for (const q of QUESTIONS) {
            const deltas = q.options.map(
                (o) => o.dimensions?.[dim.id] ?? 0,
            );
            min += Math.min(...deltas);
            max += Math.max(...deltas);
        }
        ranges[dim.id] = { min, max };
    }
    return ranges;
})();

export function computeArchetype(answers: Record<string, string>): ArchetypeId {
    // Brand new beginner special case: brand-new + no meaningful losses yet.
    if (answers.q1 === "a" && answers.q5 === "g" && answers.q7 === "e") {
        return "brand_new_beginner";
    }

    const counter = new Map<ArchetypeId, number>(
        ARCHETYPE_IDS.map((id) => [id, 0]),
    );

    for (const q of QUESTIONS) {
        const optionId = answers[q.id];
        if (!optionId) continue;
        const option = q.options.find((o) => o.id === optionId);
        if (!option) continue;
        for (const archetype of ARCHETYPE_IDS) {
            counter.set(
                archetype,
                (counter.get(archetype) ?? 0) + (option.scoring[archetype] ?? 0),
            );
        }
    }

    const max = Math.max(...ARCHETYPE_IDS.map((id) => counter.get(id) ?? 0));
    const winners = ARCHETYPE_IDS.filter((id) => counter.get(id) === max);

    if (winners.length > 1) {
        // Tiebreak: prefer the tied archetype with the highest q5 scoring weight.
        const q5Option = QUESTIONS.find((q) => q.id === "q5")?.options.find(
            (o) => o.id === answers.q5,
        );
        if (q5Option) {
            let best: ArchetypeId | null = null;
            let bestWeight = Number.NEGATIVE_INFINITY;
            for (const id of winners) {
                const weight = q5Option.scoring[id] ?? 0;
                if (weight > bestWeight) {
                    bestWeight = weight;
                    best = id;
                }
            }
            if (best) return best;
        }
    }

    return winners[0];
}

export function computeDimensionScores(
    answers: Record<string, string>,
): DimensionScores {
    const raw = {} as Record<DimensionId, number>;
    for (const dim of DIMENSIONS) raw[dim.id] = 0;

    for (const q of QUESTIONS) {
        const optionId = answers[q.id];
        if (!optionId) continue;
        const option = q.options.find((o) => o.id === optionId);
        if (!option) continue;
        for (const dim of DIMENSIONS) {
            raw[dim.id] += option.dimensions?.[dim.id] ?? 0;
        }
    }

    const scores: DimensionScores = {};
    for (const dim of DIMENSIONS) {
        const { min, max } = DIMENSION_RANGES[dim.id];
        const span = max - min;
        const normalized = span === 0 ? 50 : ((raw[dim.id] - min) / span) * 100;
        scores[dim.id] = Math.round(Math.min(100, Math.max(0, normalized)));
    }
    return scores;
}

export function getArchetype(id: ArchetypeId): Archetype {
    return ARCHETYPES[id];
}

export function buildReportMarkdown(
    archetype: Archetype,
    _dimensions: DimensionScores,
): string {
    const lines: string[] = [];

    lines.push(`## Your Trading Style: ${archetype.name}`);
    lines.push("");
    lines.push(archetype.summary);
    lines.push("");

    lines.push("### What's going well");
    lines.push("");
    for (const s of archetype.strengths) lines.push(`- ${s}`);
    lines.push("");

    lines.push("### What's holding you back");
    lines.push("");
    for (const w of archetype.weaknesses) lines.push(`- ${w}`);
    lines.push("");

    lines.push("### Your most common mistakes");
    lines.push("");
    for (const m of archetype.commonMistakes) lines.push(`- ${m}`);
    lines.push("");

    lines.push("### Where to focus");
    lines.push("");
    for (const f of archetype.focus) lines.push(`- ${f}`);
    lines.push("");

    lines.push("### Your first move");
    lines.push("");
    lines.push(`**${archetype.keystone.label}** — ${archetype.keystone.why}`);
    lines.push("");
    lines.push("### Keep going");
    lines.push("");
    for (const m of archetype.moves) {
        lines.push(`- **${m.label}** — ${m.why}`);
    }
    lines.push("");

    return lines.join("\n");
}
