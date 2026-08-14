"use client";

import { useEffect, useRef, useState } from "react";
import { CertificateTemplate } from "./CertificateTemplate";

interface CertificateShareScaleProps {
    userName: string;
    levelTitle: string;
    levelOrder: number;
    score: number;
    earnedAt: string;
    variant?: "level" | "master";
}

/**
 * Responsive scale-down wrapper for the fixed 1200×850 CertificateTemplate.
 * Measures its container width and applies a CSS transform scale so the
 * certificate renders crisply at any viewport on the public share pages.
 */
export function CertificateShareScale({
    variant = "level",
    ...props
}: CertificateShareScaleProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.6);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const update = () => {
            const width = el.clientWidth;
            if (width > 0) {
                setScale(Math.min(1, width / 1200));
            }
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="w-full">
            <div
                style={{ height: Math.round(850 * scale) }}
                className="relative overflow-hidden rounded-xl border border-dashboard shadow-xl"
            >
                <div
                    style={{
                        transform: `scale(${scale})`,
                        transformOrigin: "top left",
                        width: 1200,
                        height: 850,
                    }}
                >
                    <CertificateTemplate variant={variant} {...props} />
                </div>
            </div>
        </div>
    );
}
