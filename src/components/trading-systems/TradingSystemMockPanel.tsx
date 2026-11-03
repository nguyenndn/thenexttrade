"use client";

import React from "react";
import { GoldScalperNinjaMockPanel } from "./mockup/GoldScalperNinjaMockPanel";
import { TradeManagerMockPanel } from "./trade-manager-panel/TradeManagerMockPanel";
import { ShadowMatrixMockPanel } from "./shadow-matrix-panel/ShadowMatrixMockPanel";

interface MockPanelProps {
    slug: string;
}

export function TradingSystemMockPanel({ slug }: MockPanelProps) {
    if (slug === "goldscalperninja") {
        return <GoldScalperNinjaMockPanel />;
    }

    if (slug === "trade-manager") {
        return <TradeManagerMockPanel />;
    }

    if (slug === "gsn-shadown-matrix" || slug === "gsn-phoenix-grid") {
        return <ShadowMatrixMockPanel />;
    }

    return null;
}
