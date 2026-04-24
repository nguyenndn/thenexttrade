"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";

interface ChartContainerProps {
    children: ReactNode;
    height?: string | number;
    className?: string;
    minHeight?: number;
}

/**
 * Wrapper that delays Recharts rendering until the container
 * has valid dimensions, preventing "width(-1) height(-1)" warnings.
 */
export function ChartContainer({
    children,
    height = "100%",
    className = "",
    minHeight = 200,
}: ChartContainerProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!ref.current) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                    setReady(true);
                    observer.disconnect();
                }
            }
        });

        // Check immediately in case already sized
        if (ref.current.offsetWidth > 0 && ref.current.offsetHeight > 0) {
            setReady(true);
        } else {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`[&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none focus:outline-none ${className}`}
            style={{ height, minHeight }}
        >
            {ready ? children : null}
        </div>
    );
}
