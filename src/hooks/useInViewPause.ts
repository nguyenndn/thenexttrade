"use client";

import { useState, useEffect, useRef } from "react";

interface UseInViewPauseOptions {
    threshold?: number;
}

export function useInViewPause<T extends HTMLElement = HTMLDivElement>(
    options: UseInViewPauseOptions = {}
): {
    containerRef: React.RefObject<T | null>;
    isInView: boolean;
} {
    const { threshold = 0.1 } = options;
    const [isInView, setIsInView] = useState(false);
    const containerRef = useRef<T>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el || typeof IntersectionObserver === "undefined") {
            setIsInView(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting);
            },
            { threshold }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold]);

    return { containerRef, isInView };
}
