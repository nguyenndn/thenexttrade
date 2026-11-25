"use client";

import { formatAxisPrice } from "./schematic-candle-builder";
import type { SchematicTone } from "./schematic-scenes";

export const VIEW_W = 560;
export const VIEW_H = 246;
export const PLOT_LEFT = 10;
export const PLOT_RIGHT = 500;
export const PLOT_TOP = 18;
export const PLOT_BOTTOM = 230;
export const AXIS_X = 506;

export const TV_BULL = "#089981";
export const TV_BEAR = "#F23645";

export const TONE_PALETTE: Record<
    SchematicTone,
    { stroke: string; fill: string }
> = {
    gold: { stroke: "#D97706", fill: "rgba(245,158,11,0.14)" },
    emerald: { stroke: TV_BULL, fill: "rgba(8,153,129,0.13)" },
    red: { stroke: TV_BEAR, fill: "rgba(242,54,69,0.13)" },
    cyan: { stroke: "#0891B2", fill: "rgba(6,182,212,0.13)" },
    blue: { stroke: "#2962FF", fill: "rgba(41,98,255,0.12)" },
    slate: { stroke: "#787B86", fill: "rgba(120,123,134,0.11)" },
};

export function idxToX(idx: number, count: number): number {
    const step = (PLOT_RIGHT - PLOT_LEFT) / Math.max(1, count);
    return PLOT_LEFT + (idx + 0.5) * step;
}

export function priceToY(price: number): number {
    const clamped = Math.max(0, Math.min(100, price));
    return PLOT_BOTTOM - (clamped / 100) * (PLOT_BOTTOM - PLOT_TOP);
}

/**
 * Crisp TradingView "Text on Line / Swing" label with canvas-colored stroke halo
 * instead of bulky flowchart boxes.
 */
export function SvgHaloLabel({
    cx,
    cy,
    label,
    tone,
}: {
    cx: number;
    cy: number;
    label: string;
    tone: SchematicTone;
}) {
    const color = TONE_PALETTE[tone].stroke;
    const halfEst = label.length * 3.1;
    const safeX = Math.max(
        PLOT_LEFT + halfEst + 2,
        Math.min(PLOT_RIGHT - halfEst - 2, cx)
    );
    const safeY = Math.max(12, Math.min(VIEW_H - 8, cy));

    return (
        <text
            x={safeX}
            y={safeY}
            textAnchor="middle"
            fontSize="9.2"
            fontWeight="800"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fill={color}
            style={{
                paintOrder: "stroke",
                stroke: "var(--tv-canvas)",
                strokeWidth: 4,
                strokeLinejoin: "round",
            }}
        >
            {label}
        </text>
    );
}

export function PriceAxisGutter({
    symbol,
    entryY,
    slY,
    tpY,
    rrLabel,
    accentColor,
}: {
    symbol: string;
    entryY: number;
    slY: number;
    tpY: number;
    rrLabel: string;
    accentColor: string;
}) {
    const axisSlY =
        Math.abs(slY - entryY) < 16
            ? slY < entryY
                ? entryY - 16
                : entryY + 16
            : slY;
    const axisTpY =
        Math.abs(tpY - entryY) < 16
            ? tpY < entryY
                ? entryY - 16
                : entryY + 16
            : tpY;

    const tags = [
        { y: Math.max(10, Math.min(VIEW_H - 10, axisSlY)), bg: TV_BEAR, text: "SL" },
        { y: Math.max(10, Math.min(VIEW_H - 10, entryY)), bg: accentColor, text: "ENTRY" },
        { y: Math.max(10, Math.min(VIEW_H - 10, axisTpY)), bg: TV_BULL, text: `TP ${rrLabel}` },
    ];

    const normTicks = [90, 70, 50, 30, 10];

    return (
        <g>
            <rect x={AXIS_X} y={0} width={VIEW_W - AXIS_X} height={VIEW_H} fill="var(--tv-canvas)" />
            <line x1={AXIS_X} y1={0} x2={AXIS_X} y2={VIEW_H} stroke="var(--tv-axis)" strokeWidth={1} />
            {normTicks.map((norm) => {
                const ty = priceToY(norm);
                return (
                    <g key={norm}>
                        <line x1={AXIS_X} y1={ty} x2={AXIS_X + 3.5} y2={ty} stroke="var(--tv-axis)" strokeWidth={1} />
                        <text
                            x={AXIS_X + 6}
                            y={ty + 3}
                            fontSize="8.2"
                            fontWeight="600"
                            fontFamily="ui-monospace, SFMono-Regular, monospace"
                            fill="#787B86"
                        >
                            {formatAxisPrice(symbol, norm)}
                        </text>
                    </g>
                );
            })}
            {tags.map((tag) => (
                <g key={tag.text}>
                    <rect x={AXIS_X + 1} y={tag.y - 7.5} width={51} height={15} rx={2} fill={tag.bg} />
                    <text
                        x={AXIS_X + 26.5}
                        y={tag.y + 3}
                        textAnchor="middle"
                        fontSize="8.2"
                        fontWeight="800"
                        fontFamily="ui-monospace, SFMono-Regular, monospace"
                        fill="#FFFFFF"
                    >
                        {tag.text}
                    </text>
                </g>
            ))}
        </g>
    );
}
