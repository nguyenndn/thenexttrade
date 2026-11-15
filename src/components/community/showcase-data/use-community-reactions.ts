"use client";

import { useEffect, useState } from "react";
import type { ReactionCounts, ReactionKey } from "../TelegramReactionsBar";

const DEFAULT_REACTIONS: ReactionCounts = {
    flame: 492,
    rocket: 312,
    heart: 218,
    hundred: 185,
    handshake: 142,
};

export function useCommunityReactions() {
    const [visitorId, setVisitorId] = useState("");
    const [reactions, setReactions] = useState<ReactionCounts>(DEFAULT_REACTIONS);
    const [userReacted, setUserReacted] = useState<Record<string, boolean>>({});

    useEffect(() => {
        let storedId = "";
        try {
            storedId = localStorage.getItem("gsn_visitor_id") || "";
            if (!storedId) {
                storedId = `v_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
                localStorage.setItem("gsn_visitor_id", storedId);
            }
        } catch {
            storedId = `v_${Date.now()}`;
        }
        setVisitorId(storedId);

        fetch(`/api/community/reactions?visitorId=${encodeURIComponent(storedId)}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data?.success) {
                    setReactions(data.reactions);
                    setUserReacted(data.userReacted);
                }
            })
            .catch(() => {
                try {
                    const saved = localStorage.getItem("gsn_user_reactions");
                    if (saved) {
                        setUserReacted(JSON.parse(saved) as Record<string, boolean>);
                    }
                } catch {
                    // Ignore malformed local state
                }
            });
    }, []);

    const toggleReaction = async (key: ReactionKey) => {
        const isReacted = Boolean(userReacted[key]);
        setReactions((prev) => ({
            ...prev,
            [key]: isReacted ? Math.max(0, prev[key] - 1) : prev[key] + 1,
        }));
        const nextReacted = { ...userReacted, [key]: !isReacted };
        setUserReacted(nextReacted);
        try {
            localStorage.setItem("gsn_user_reactions", JSON.stringify(nextReacted));
        } catch {
            // Ignore private browsing storage error
        }

        try {
            const res = await fetch("/api/community/reactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, visitorId }),
            });
            const data = await res.json();
            if (data.success) {
                setReactions(data.reactions);
                setUserReacted(data.userReacted);
            }
        } catch {
            // Preserve optimistic update on network error
        }
    };

    return { reactions, userReacted, toggleReaction };
}
