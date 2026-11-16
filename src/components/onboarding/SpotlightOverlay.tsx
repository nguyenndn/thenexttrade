"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import type { ResolvedTourStep } from "./tour-steps";
import { computeCardPosition, type TargetBox } from "./tour-positioning";
import { TourPopoverCard } from "./TourPopoverCard";

interface SpotlightOverlayProps {
    step: ResolvedTourStep;
    stepIndex: number;
    totalSteps: number;
    onNext: () => void;
    onPrev: () => void;
    onSkip: () => void;
    onClose: () => void;
}

export function SpotlightOverlay({
    step,
    stepIndex,
    totalSteps,
    onNext,
    onPrev,
    onSkip,
    onClose,
}: SpotlightOverlayProps) {
    const maskId = useId();
    const cardRef = useRef<HTMLDivElement>(null);
    const [box, setBox] = useState<TargetBox | null>(null);
    const [cardPos, setCardPos] = useState<{ top: number; left: number }>({
        top: 80,
        left: 80,
    });

    const measure = useCallback(() => {
        const el = document.querySelector(step.activeSelector);
        if (!(el instanceof HTMLElement)) return;
        const rect = el.getBoundingClientRect();
        const pad = step.padding ?? 6;
        const nextBox: TargetBox = {
            top: Math.max(4, rect.top - pad),
            left: Math.max(4, rect.left - pad),
            width: Math.min(window.innerWidth - 8, rect.width + pad * 2),
            height: Math.min(window.innerHeight - 8, rect.height + pad * 2),
        };
        setBox(nextBox);

        const cardW = cardRef.current?.offsetWidth || 356;
        const cardH = cardRef.current?.offsetHeight || 228;
        setCardPos(computeCardPosition(nextBox, cardW, cardH, step.placement));
    }, [step]);

    useEffect(() => {
        const el = document.querySelector(step.activeSelector);
        if (el instanceof HTMLElement) {
            const r = el.getBoundingClientRect();
            if (r.top < 16 || r.bottom > window.innerHeight - 16) {
                el.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }
        const raf = requestAnimationFrame(measure);
        const settleTimer = setTimeout(measure, 320);

        const ro = new ResizeObserver(measure);
        if (el instanceof HTMLElement) ro.observe(el);

        window.addEventListener("resize", measure);
        window.addEventListener("scroll", measure, true);
        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(settleTimer);
            ro.disconnect();
            window.removeEventListener("resize", measure);
            window.removeEventListener("scroll", measure, true);
        };
    }, [step, measure]);

    if (typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[95] pointer-events-none">
                <svg
                    className="fixed inset-0 h-full w-full pointer-events-auto"
                    onClick={onClose}
                >
                    <defs>
                        <mask id={maskId}>
                            <rect x="0" y="0" width="100%" height="100%" fill="white" />
                            {box && (
                                <rect
                                    x={box.left}
                                    y={box.top}
                                    width={box.width}
                                    height={box.height}
                                    rx={12}
                                    ry={12}
                                    fill="black"
                                />
                            )}
                        </mask>
                    </defs>
                    <rect
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        fill="rgba(15, 17, 23, 0.52)"
                        mask={`url(#${maskId})`}
                    />
                </svg>

                {box && (
                    <motion.div
                        initial={false}
                        animate={{
                            top: box.top,
                            left: box.left,
                            width: box.width,
                            height: box.height,
                        }}
                        transition={{ type: "spring", stiffness: 360, damping: 32 }}
                        className="fixed rounded-xl border-2 border-gold shadow-[0_0_0_4px_rgba(245,158,11,0.16)] pointer-events-none"
                    />
                )}

                <motion.div
                    ref={cardRef}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1, top: cardPos.top, left: cardPos.left }}
                    transition={{ type: "spring", stiffness: 360, damping: 32 }}
                    className="fixed pointer-events-auto"
                >
                    <TourPopoverCard
                        stepIndex={stepIndex}
                        totalSteps={totalSteps}
                        title={step.isFallback && step.mobileTitle ? step.mobileTitle : step.title}
                        description={
                            step.isFallback && step.mobileDescription
                                ? step.mobileDescription
                                : step.description
                        }
                        onNext={onNext}
                        onPrev={onPrev}
                        onSkip={onSkip}
                        onClose={onClose}
                    />
                </motion.div>
            </div>,
        document.body
    );
}
