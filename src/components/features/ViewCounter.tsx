
"use client";

import { useEffect, useRef } from "react";

export function ViewCounter({ articleId }: { articleId: string }) {
    const hasCounted = useRef(false);

    useEffect(() => {
        if (hasCounted.current) return;

        // Use sessionStorage to prevent duplicate counts in same session (basic prevention)
        const storageKey = `viewed_${articleId}`;
        if (sessionStorage.getItem(storageKey)) {
            hasCounted.current = true;
            return;
        }

        const incrementView = async () => {
            // Prevent race condition in React Strict Mode by marking as counted immediately
            hasCounted.current = true;

            try {
                await fetch("/api/analytics/views", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ articleId })
                });
                sessionStorage.setItem(storageKey, "true");
            } catch (err) {
                console.error("View count failed", err);
                hasCounted.current = false; // Reset on failure? Maybe not to avoid loop.
            }
        };

        incrementView();
    }, [articleId]);

    return null; // Invisible component
}
