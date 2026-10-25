"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HoldToConfirmButtonProps {
    label?: string;
    holdDurationMs?: number;
    disabled?: boolean;
    isLoading?: boolean;
    onConfirm: () => void | Promise<void>;
}

export function HoldToConfirmButton({
    label = "Hold to CLOSE ALL — keep pressing for 1 second",
    holdDurationMs = 1000,
    disabled = false,
    isLoading = false,
    onConfirm,
}: HoldToConfirmButtonProps) {
    const [progress, setProgress] = useState(0);
    const [isHolding, setIsHolding] = useState(false);
    const frameRef = useRef<number | null>(null);
    const startRef = useRef<number>(0);
    const firedRef = useRef(false);

    const stopHold = useCallback(() => {
        if (frameRef.current) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }
        setIsHolding(false);
        setProgress(0);
        firedRef.current = false;
    }, []);

    const tick = useCallback(() => {
        const elapsed = performance.now() - startRef.current;
        const pct = Math.min(100, (elapsed / holdDurationMs) * 100);
        setProgress(pct);

        if (pct >= 100 && !firedRef.current) {
            firedRef.current = true;
            setIsHolding(false);
            setProgress(0);
            void onConfirm();
            return;
        }

        if (pct < 100) {
            frameRef.current = requestAnimationFrame(tick);
        }
    }, [holdDurationMs, onConfirm]);

    const startHold = useCallback(() => {
        if (disabled || isLoading) return;
        firedRef.current = false;
        startRef.current = performance.now();
        setIsHolding(true);
        frameRef.current = requestAnimationFrame(tick);
    }, [disabled, isLoading, tick]);

    useEffect(() => {
        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, []);

    return (
        <Button
            type="button"
            variant="destructive"
            disabled={disabled || isLoading}
            onPointerDown={startHold}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            onPointerCancel={stopHold}
            className="relative w-full min-h-12 overflow-hidden select-none rounded-lg border border-red-500/40 bg-red-500/15 hover:bg-red-500/25 text-red-400 font-bold text-xs sm:text-sm shadow-none"
        >
            <span
                className="pointer-events-none absolute inset-y-0 left-0 bg-red-500/35 transition-none"
                style={{ width: `${progress}%` }}
            />
            <span className="relative z-10 inline-flex items-center justify-center gap-2">
                {isLoading ? (
                    <Loader2 size={16} className="animate-spin text-red-400" />
                ) : (
                    <ShieldAlert size={16} className="text-red-400" />
                )}
                <span>
                    {isHolding
                        ? `Keep holding... ${Math.ceil(((100 - progress) / 100) * 10) / 10}s`
                        : label}
                </span>
            </span>
        </Button>
    );
}
