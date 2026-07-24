"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

interface FadeInProps {
    children: ReactNode;
    delay?: number;
    direction?: "up" | "down" | "left" | "right" | "none";
    duration?: number;
    className?: string;
}

const OFFSETS: Record<string, string> = {
    up: "translate3d(0, 24px, 0)",
    down: "translate3d(0, -24px, 0)",
    left: "translate3d(24px, 0, 0)",
    right: "translate3d(-24px, 0, 0)",
    none: "translate3d(0, 0, 0)",
};

export function FadeIn({
    children,
    delay = 0,
    direction = "up",
    duration = 0.4,
    className,
}: FadeInProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const reducedMotion =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (reducedMotion || !("IntersectionObserver" in window)) {
            setIsVisible(true);
            return;
        }

        // Fast fallback timer (600ms) ensures content is never hidden on full-page screenshots or rapid scrolling
        const fallbackTimer = window.setTimeout(() => {
            setIsVisible(true);
        }, 600);

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    window.clearTimeout(fallbackTimer);
                    observer.unobserve(el);
                }
            },
            { rootMargin: "120px 0px 120px 0px", threshold: 0 }
        );

        observer.observe(el);
        return () => {
            window.clearTimeout(fallbackTimer);
            observer.disconnect();
        };
    }, []);

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible
                    ? "translate3d(0, 0, 0)"
                    : OFFSETS[direction],
                transition: `opacity ${duration}s ease-out ${delay}s, transform ${duration}s ease-out ${delay}s`,
                willChange: isVisible ? "auto" : "opacity, transform",
            }}
        >
            {children}
        </div>
    );
}

