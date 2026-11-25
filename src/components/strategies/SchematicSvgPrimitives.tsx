"use client";

import type { SchematicScene } from "./schematic-scenes";
import {
    AXIS_X,
    PLOT_LEFT,
    PLOT_RIGHT,
    PriceAxisGutter,
    SvgHaloLabel,
    TONE_PALETTE,
    TV_BEAR,
    TV_BULL,
    VIEW_H,
    VIEW_W,
    idxToX,
    priceToY,
} from "./SchematicAxisAndTags";

export function SchematicSvgCanvas({
    scene,
    accentColor,
    gridId,
}: {
    scene: SchematicScene;
    accentColor: string;
    gridId: string;
}) {
    const count = scene.candles.length;
    const step = (PLOT_RIGHT - PLOT_LEFT) / Math.max(1, count);
    const bodyWidth = Math.max(4.5, step * 0.74);

    const pos = scene.position;
    const posX1 = idxToX(pos.startIdx, count) - bodyWidth / 2;
    const posX2 = Math.min(AXIS_X - 2, idxToX(pos.endIdx, count) + bodyWidth / 2);
    const triggerX = idxToX(pos.triggerIdx, count);
    const entryY = priceToY(pos.entryPrice);
    const slY = priceToY(pos.slPrice);
    const tpY = priceToY(pos.tpPrice);
    const lastClose = scene.candles[count - 1]?.c ?? 50;
    const lastCloseColor =
        lastClose >= (scene.candles[count - 1]?.o ?? 50) ? TV_BULL : TV_BEAR;

    return (
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-auto block" aria-hidden="true">
            <defs>
                <pattern id={gridId} width="49" height="42" patternUnits="userSpaceOnUse">
                    <path d="M 49 0 L 0 0 0 42" fill="none" stroke="var(--tv-grid)" strokeWidth="1" />
                </pattern>
            </defs>
            <rect x="0" y="0" width={AXIS_X} height={VIEW_H} fill={`url(#${gridId})`} />

            {scene.timeBand && (() => {
                const bx1 = idxToX(scene.timeBand.startIdx, count);
                const bx2 = idxToX(scene.timeBand.endIdx, count);
                return (
                    <g>
                        <rect x={bx1} y={0} width={bx2 - bx1} height={VIEW_H} fill="var(--tv-band)" />
                        <line x1={bx1} y1={0} x2={bx1} y2={VIEW_H} stroke="#D97706" strokeOpacity={0.28} strokeDasharray="3 3" />
                        <line x1={bx2} y1={0} x2={bx2} y2={VIEW_H} stroke="#D97706" strokeOpacity={0.28} strokeDasharray="3 3" />
                        <text x={(bx1 + bx2) / 2} y={13} textAnchor="middle" fontSize="8.2" fontWeight="800" fontFamily="ui-monospace, monospace" fill="#D97706">
                            {scene.timeBand.label}
                        </text>
                    </g>
                );
            })()}

            {scene.zones?.map((z, idx) => {
                const x1 = idxToX(z.startIdx, count) - bodyWidth / 2;
                const x2 = idxToX(z.endIdx, count) + bodyWidth / 2;
                const yTop = priceToY(z.topPrice);
                const yBot = priceToY(z.bottomPrice);
                const pal = TONE_PALETTE[z.tone];
                return (
                    <g key={idx}>
                        <rect x={x1} y={yTop} width={Math.max(8, x2 - x1)} height={Math.max(6, yBot - yTop)} fill={pal.fill} stroke={pal.stroke} strokeOpacity={0.45} strokeWidth={0.9} strokeDasharray={z.dashed ? "4 3" : undefined} />
                        {z.label && (
                            <text x={x1 + 5} y={yTop + 10.5} fontSize="8" fontWeight="800" fontFamily="ui-monospace, monospace" fill={pal.stroke} opacity={0.9}>
                                {z.label}
                            </text>
                        )}
                    </g>
                );
            })}

            {scene.fibRuler?.levels.map((lv) => {
                const fx1 = idxToX(scene.fibRuler!.startIdx, count);
                const fx2 = idxToX(scene.fibRuler!.endIdx, count);
                const fy = priceToY(lv.price);
                return (
                    <g key={lv.label}>
                        <line x1={fx1} y1={fy} x2={fx2} y2={fy} stroke="#787B86" strokeOpacity={0.5} strokeWidth={0.85} strokeDasharray="2 2" />
                        <text x={fx1 - 4} y={fy + 2.8} textAnchor="end" fontSize="8" fontWeight="700" fontFamily="ui-monospace, monospace" fill="#787B86">
                            {lv.label}
                        </text>
                    </g>
                );
            })}

            {/* Authentic Flat Sharp-Edged TradingView Long / Short Position Tool */}
            <g>
                <rect x={posX1} y={Math.min(entryY, slY)} width={posX2 - posX1} height={Math.abs(slY - entryY)} fill="rgba(242,54,69,0.16)" />
                <line x1={posX1} y1={slY} x2={posX2} y2={slY} stroke={TV_BEAR} strokeOpacity={0.65} strokeWidth={1} />
                <rect x={posX1} y={Math.min(entryY, tpY)} width={posX2 - posX1} height={Math.abs(tpY - entryY)} fill="rgba(8,153,129,0.16)" />
                <line x1={posX1} y1={tpY} x2={posX2} y2={tpY} stroke={TV_BULL} strokeOpacity={0.65} strokeWidth={1} />
                <line x1={posX1} y1={entryY} x2={AXIS_X} y2={entryY} stroke="#787B86" strokeWidth={1.1} />
            </g>

            {/* Structural Horizontal Rays */}
            {scene.levels?.map((lv, idx) => (
                <line
                    key={idx}
                    x1={idxToX(lv.startIdx, count)}
                    y1={priceToY(lv.price)}
                    x2={idxToX(lv.endIdx, count)}
                    y2={priceToY(lv.price)}
                    stroke={TONE_PALETTE[lv.tone].stroke}
                    strokeWidth={1.15}
                    strokeDasharray={lv.dashed ? "4 3" : undefined}
                />
            ))}

            {/* Dotted Live Last-Price Tracker Line */}
            <line x1={0} y1={priceToY(lastClose)} x2={AXIS_X} y2={priceToY(lastClose)} stroke={lastCloseColor} strokeOpacity={0.4} strokeWidth={0.9} strokeDasharray="2 2" />

            {/* Crisp Sharp-Edged TradingView OHLC Candlesticks */}
            <g>
                {scene.candles.map((c, idx) => {
                    const cx = idxToX(idx, count);
                    const color = c.c >= c.o ? TV_BULL : TV_BEAR;
                    const yHigh = priceToY(Math.max(c.h, c.o, c.c));
                    const yLow = priceToY(Math.min(c.l, c.o, c.c));
                    const yTop = priceToY(Math.max(c.o, c.c));
                    const yBot = priceToY(Math.min(c.o, c.c));
                    const bodyH = Math.max(1.4, yBot - yTop);
                    return (
                        <g key={idx} opacity={scene.showLineOverlay ? 0.25 : 1}>
                            <line x1={cx} y1={yHigh} x2={cx} y2={yLow} stroke={color} strokeWidth={1.15} strokeLinecap="butt" />
                            <rect x={cx - bodyWidth / 2} y={yTop} width={bodyWidth} height={bodyH} fill={color} />
                        </g>
                    );
                })}
            </g>

            {scene.showLineOverlay && (
                <polyline
                    points={scene.candles.map((c, i) => `${idxToX(i, count)},${priceToY(c.c)}`).join(" ")}
                    fill="none"
                    stroke="#2962FF"
                    strokeWidth={1.8}
                    strokeLinejoin="round"
                />
            )}

            {/* Clean Sniper Limit Fill Marker */}
            <circle cx={triggerX} cy={entryY} r={3.2} fill={accentColor} stroke="var(--tv-canvas)" strokeWidth={1.3} />

            {/* Featherweight TradingView Stroke-Halo Labels */}
            {scene.levels?.map((lv, idx) =>
                lv.badge && lv.badgeIdx !== undefined ? (
                    <SvgHaloLabel
                        key={`lv-${idx}`}
                        cx={idxToX(lv.badgeIdx, count)}
                        cy={priceToY(lv.price) + (lv.badgePos === "below" ? 11.5 : -5.5)}
                        label={lv.badge}
                        tone={lv.tone}
                    />
                ) : null
            )}
            {scene.callouts?.map((co, idx) => (
                <SvgHaloLabel
                    key={`co-${idx}`}
                    cx={idxToX(co.idx, count)}
                    cy={priceToY(co.price) + (co.pos === "below" ? 11.5 : -5.5)}
                    label={co.label}
                    tone={co.tone}
                />
            ))}

            <PriceAxisGutter
                symbol={scene.symbol}
                entryY={entryY}
                slY={slY}
                tpY={tpY}
                rrLabel={pos.rrLabel}
                accentColor={accentColor}
            />
        </svg>
    );
}
