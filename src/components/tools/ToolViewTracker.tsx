"use client";

import { useTrackToolView } from "@/hooks/useTrackToolView";

export function ToolViewTracker({ slug }: { slug: string }) {
    useTrackToolView(slug);
    return null;
}
