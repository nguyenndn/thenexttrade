"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useSpring } from "framer-motion";

interface NumberTickerProps {
    value: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    className?: string;
}

export function NumberTicker({
    value,
    prefix = "",
    suffix = "",
    decimals = 2,
    className = "",
}: NumberTickerProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const motionVal = useMotionValue(value);
    const springVal = useSpring(motionVal, {
        stiffness: 120,
        damping: 20,
        mass: 0.8,
    });

    useEffect(() => {
        motionVal.set(value);
    }, [value, motionVal]);

    useEffect(() => {
        const unsubscribe = springVal.on("change", (latest) => {
            if (ref.current) {
                const formatted = new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals,
                }).format(latest);
                ref.current.textContent = `${prefix}${formatted}${suffix}`;
            }
        });
        return () => unsubscribe();
    }, [springVal, decimals, prefix, suffix]);

    // Initial text for SSR and initial paint
    const initialText = `${prefix}${new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value)}${suffix}`;

    return (
        <span ref={ref} className={className}>
            {initialText}
        </span>
    );
}
