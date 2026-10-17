import { NextResponse } from "next/server";

// Default base reaction counts
const defaultReactions = {
    flame: 492,
    rocket: 312,
    heart: 218,
    hundred: 185,
    handshake: 142,
};

// Global in-memory storage for live reactions count & visitor reaction logs
// (Will persist during server lifetime and sync across all clients)
let liveReactions = { ...defaultReactions };
const MAX_VISITOR_ENTRIES = 1000;
const visitorReactionsMap = new Map<string, Record<string, boolean>>();

function getVisitorState(id: string): Record<string, boolean> {
    const state = visitorReactionsMap.get(id);
    if (!state) return {};
    // Refresh LRU order on access
    visitorReactionsMap.delete(id);
    visitorReactionsMap.set(id, state);
    return state;
}

function setVisitorState(id: string, state: Record<string, boolean>) {
    const sanitizedId = typeof id === "string" ? id.slice(0, 64) : "anonymous_guest";
    if (visitorReactionsMap.has(sanitizedId)) {
        visitorReactionsMap.delete(sanitizedId);
    } else if (visitorReactionsMap.size >= MAX_VISITOR_ENTRIES) {
        // Evict oldest entry to prevent heap memory exhaustion DoS
        const oldestKey = visitorReactionsMap.keys().next().value;
        if (oldestKey !== undefined) {
            visitorReactionsMap.delete(oldestKey);
        }
    }
    visitorReactionsMap.set(sanitizedId, state);
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const rawId = searchParams.get("visitorId") || "";
    const visitorId = rawId ? rawId.slice(0, 64) : "";

    const userReactions = visitorId ? getVisitorState(visitorId) : {};

    return NextResponse.json({
        success: true,
        reactions: liveReactions,
        userReacted: userReactions,
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { key, visitorId } = body;

        if (!key || !Object.prototype.hasOwnProperty.call(liveReactions, key)) {
            return NextResponse.json({ error: "Invalid reaction key" }, { status: 400 });
        }

        const rawId =
            typeof visitorId === "string" && visitorId.trim()
                ? visitorId.trim().slice(0, 64)
                : "anonymous_guest";
        const currentVisitorState = { ...getVisitorState(rawId) };
        const isAlreadyReacted = !!currentVisitorState[key];

        // Toggle logic: +1 if not reacted, -1 if already reacted
        if (isAlreadyReacted) {
            liveReactions[key as keyof typeof liveReactions] = Math.max(0, liveReactions[key as keyof typeof liveReactions] - 1);
            currentVisitorState[key] = false;
        } else {
            liveReactions[key as keyof typeof liveReactions] += 1;
            currentVisitorState[key] = true;
        }

        setVisitorState(rawId, currentVisitorState);

        return NextResponse.json({
            success: true,
            reactions: liveReactions,
            userReacted: currentVisitorState,
        });
    } catch {
        return NextResponse.json({ error: "Failed to process reaction" }, { status: 500 });
    }
}
