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
const visitorReactionsMap = new Map<string, Record<string, boolean>>();

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const visitorId = searchParams.get("visitorId") || "";

    const userReactions = visitorId ? visitorReactionsMap.get(visitorId) || {} : {};

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

        if (!key || !liveReactions.hasOwnProperty(key)) {
            return NextResponse.json({ error: "Invalid reaction key" }, { status: 400 });
        }

        const id = visitorId || "anonymous_guest";
        const currentVisitorState = visitorReactionsMap.get(id) || {};
        const isAlreadyReacted = !!currentVisitorState[key];

        // Toggle logic: +1 if not reacted, -1 if already reacted
        if (isAlreadyReacted) {
            liveReactions[key as keyof typeof liveReactions] = Math.max(0, liveReactions[key as keyof typeof liveReactions] - 1);
            currentVisitorState[key] = false;
        } else {
            liveReactions[key as keyof typeof liveReactions] += 1;
            currentVisitorState[key] = true;
        }

        visitorReactionsMap.set(id, currentVisitorState);

        return NextResponse.json({
            success: true,
            reactions: liveReactions,
            userReacted: currentVisitorState,
        });
    } catch {
        return NextResponse.json({ error: "Failed to process reaction" }, { status: 500 });
    }
}
