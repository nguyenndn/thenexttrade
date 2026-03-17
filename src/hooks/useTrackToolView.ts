"use client";

import { useEffect } from "react";

export function useTrackToolView(slug: string) {
    useEffect(() => {
        const key = `tool_viewed_${slug}`;
        if (sessionStorage.getItem(key)) return;

        sessionStorage.setItem(key, "1");

        fetch("/api/tools/views", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
        }).catch(() => {});
    }, [slug]);
}
