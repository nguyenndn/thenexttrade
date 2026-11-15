import { PSYCH_POSTS } from "./psychology-posts";
import { RISK_RULES_POSTS } from "./risk-rules-posts";
import { SD_PA_TIPS_POSTS } from "./sd-pa-tips-posts";
import type { ShowcaseIndices, ShowcaseTabType } from "./types";

const DECK_STORAGE_KEY = "gsn_community_deck_v1";

interface TabDeckState {
    queue: number[];
    lastShown: number | null;
}

type StoredDeckMap = Record<ShowcaseTabType, TabDeckState>;

export const SHOWCASE_COUNTS: Readonly<Record<ShowcaseTabType, number>> = {
    psych: PSYCH_POSTS.length,
    mindset: RISK_RULES_POSTS.length,
    tips: SD_PA_TIPS_POSTS.length,
};

/**
 * Generates fresh random indices on the server per `/community` page visit.
 */
export function pickServerRandomIndices(
    rng: () => number = Math.random
): ShowcaseIndices {
    return {
        psych: Math.floor(rng() * SHOWCASE_COUNTS.psych),
        mindset: Math.floor(rng() * SHOWCASE_COUNTS.mindset),
        tips: Math.floor(rng() * SHOWCASE_COUNTS.tips),
    };
}

function buildShuffledQueue(
    count: number,
    avoidFirst: number | null,
    rng: () => number
): number[] {
    const arr = Array.from({ length: count }, (_, idx) => idx);
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    // Queue pops from the end; ensure the next popped index !== avoidFirst
    if (arr.length > 1 && avoidFirst !== null && arr[arr.length - 1] === avoidFirst) {
        const swapIdx = arr.length - 2;
        const tmp = arr[arr.length - 1];
        arr[arr.length - 1] = arr[swapIdx];
        arr[swapIdx] = tmp;
    }
    return arr;
}

function resolveSingleTabIndex(
    tabState: TabDeckState | undefined,
    count: number,
    incomingIndex: number | undefined,
    rng: () => number
): { chosen: number; nextState: TabDeckState } {
    const prevLast =
        typeof tabState?.lastShown === "number" &&
        tabState.lastShown >= 0 &&
        tabState.lastShown < count
            ? tabState.lastShown
            : null;

    let queue = Array.isArray(tabState?.queue)
        ? tabState.queue.filter((n) => Number.isInteger(n) && n >= 0 && n < count)
        : [];

    const hasValidIncoming =
        typeof incomingIndex === "number" &&
        incomingIndex >= 0 &&
        incomingIndex < count;

    // Fresh server render with a post different from the immediately preceding visit:
    // keep incomingIndex for 0ms hydration stability and remove it from the unseen deck.
    if (hasValidIncoming && incomingIndex !== prevLast) {
        if (queue.length === 0) {
            queue = buildShuffledQueue(count, incomingIndex, rng);
        }
        queue = queue.filter((idx) => idx !== incomingIndex);
        return {
            chosen: incomingIndex,
            nextState: { queue, lastShown: incomingIndex },
        };
    }

    // Router-cache hit, omitted seed, or 1/32 collision with lastShown:
    // pop the next unseen post from the Fisher-Yates deck so every visit rotates cleanly.
    if (queue.length === 0) {
        queue = buildShuffledQueue(count, prevLast, rng);
    }
    let next = queue.pop() ?? 0;
    if (count > 1 && next === prevLast) {
        if (queue.length === 0) {
            queue = buildShuffledQueue(count, prevLast, rng);
        }
        next = queue.pop() ?? ((prevLast + 1) % count);
    }
    return {
        chosen: next,
        nextState: { queue, lastShown: next },
    };
}

/**
 * Ensures every visit to `/community` displays random, non-repeating content across all 3 tabs.
 */
export function resolveVisitIndices(
    initialIndices?: ShowcaseIndices,
    storage?: Pick<Storage, "getItem" | "setItem"> | null,
    rng: () => number = Math.random
): ShowcaseIndices {
    const activeStorage =
        storage !== undefined
            ? storage
            : typeof window !== "undefined"
              ? window.sessionStorage
              : null;

    let parsed: Partial<StoredDeckMap> = {};
    if (activeStorage) {
        try {
            const raw = activeStorage.getItem(DECK_STORAGE_KEY);
            if (raw) {
                parsed = JSON.parse(raw) as Partial<StoredDeckMap>;
            }
        } catch {
            parsed = {};
        }
    }

    const psychRes = resolveSingleTabIndex(
        parsed.psych,
        SHOWCASE_COUNTS.psych,
        initialIndices?.psych,
        rng
    );
    const mindsetRes = resolveSingleTabIndex(
        parsed.mindset,
        SHOWCASE_COUNTS.mindset,
        initialIndices?.mindset,
        rng
    );
    const tipsRes = resolveSingleTabIndex(
        parsed.tips,
        SHOWCASE_COUNTS.tips,
        initialIndices?.tips,
        rng
    );

    if (activeStorage) {
        try {
            const toSave: StoredDeckMap = {
                psych: psychRes.nextState,
                mindset: mindsetRes.nextState,
                tips: tipsRes.nextState,
            };
            activeStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(toSave));
        } catch {
            // Ignore private-mode storage quota errors
        }
    }

    return {
        psych: psychRes.chosen,
        mindset: mindsetRes.chosen,
        tips: tipsRes.chosen,
    };
}
