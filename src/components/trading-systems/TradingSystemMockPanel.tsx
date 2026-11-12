"use client";

import React from "react";
import Image from "next/image";
import { GoldScalperNinjaMockPanel } from "./mockup/GoldScalperNinjaMockPanel";
import { TradeManagerMockPanel } from "./trade-manager-panel/TradeManagerMockPanel";
import { ShadowMatrixMockPanel } from "./shadow-matrix-panel/ShadowMatrixMockPanel";

interface MockPanelProps {
    slug: string;
    fallbackImage?: string | null;
    fallbackAlt?: string;
}

export function TradingSystemMockPanel({
    slug,
    fallbackImage,
    fallbackAlt = "Trading system preview",
}: MockPanelProps) {
    if (slug === "goldscalperninja") {
        return <GoldScalperNinjaMockPanel />;
    }

    if (slug === "trade-manager") {
        return <TradeManagerMockPanel />;
    }

    if (slug === "gsn-shadown-matrix" || slug === "gsn-phoenix-grid") {
        return <ShadowMatrixMockPanel />;
    }

    if (fallbackImage) {
        return (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-gray-200 bg-[#0E1118] dark:border-white/10 lg:w-[520px]">
                <Image
                    src={fallbackImage}
                    alt={fallbackAlt}
                    fill
                    sizes="(min-width: 1024px) 520px, 100vw"
                    className="object-contain"
                    priority
                />
            </div>
        );
    }

    return null;
}
