"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    createChart,
    ColorType,
    CandlestickSeries,
    CrosshairMode,
    LineStyle,
} from "lightweight-charts";
import type {
    CandlestickData,
    IChartApi,
    IPriceLine,
    ISeriesApi,
    MouseEventParams,
    Time,
} from "lightweight-charts";
import {
    Layers,
    Maximize2,
    Minimize2,
    Pin,
    RotateCcw,
    Trash2,
    ZoomIn,
    ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PositionInspectorCard } from "./PositionInspectorCard";
import type { BridgeAccountState, BridgePosition } from "@/lib/mt5-bridge/types";

interface LiveChartTabProps {
    state: BridgeAccountState;
    timeframe: number;
    onChangeTimeframe: (tf: number) => void;
    isBusy: boolean;
    onExecute: (
        action: string,
        ticket?: number,
        symbol?: string,
        value?: number
    ) => Promise<void>;
}

type LineDisplayMode = "SMART" | "SELECTED" | "ALL";

interface CustomPinnedLine {
    id: string;
    price: number;
    label: string;
}

const TIMEFRAMES = [
    { label: "M1", value: 1 },
    { label: "M5", value: 5 },
    { label: "M15", value: 15 },
    { label: "H1", value: 60 },
    { label: "H4", value: 240 },
    { label: "D1", value: 1440 },
];

export function LiveChartTab({
    state,
    timeframe,
    onChangeTimeframe,
    isBusy,
    onExecute,
}: LiveChartTabProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const priceLinesRef = useRef<IPriceLine[]>([]);
    const prevKeyRef = useRef<string>("");
    const pinModeRef = useRef<boolean>(false);

    const [selectedPosition, setSelectedPosition] =
        useState<BridgePosition | null>(state.openPositions[0] || null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [lineMode, setLineMode] = useState<LineDisplayMode>("SMART");
    const [isPinMode, setIsPinMode] = useState(false);
    const [pinnedLines, setPinnedLines] = useState<CustomPinnedLine[]>([]);

    useEffect(() => {
        pinModeRef.current = isPinMode;
    }, [isPinMode]);

    const activeSymbol =
        state.activeQuote?.symbol || state.openPositions[0]?.symbol || "XAUUSD";
    const symbolPositions = useMemo(
        () =>
            state.openPositions.filter(
                (p) => p.symbol.toUpperCase() === activeSymbol.toUpperCase()
            ),
        [state.openPositions, activeSymbol]
    );

    const currentSelected = useMemo(() => {
        if (!selectedPosition) return null;
        return (
            symbolPositions.find((p) => p.ticket === selectedPosition.ticket) ||
            null
        );
    }, [selectedPosition, symbolPositions]);

    const chartHeight = isExpanded ? 680 : 500;

    // 1. Initialize TradingView Lightweight Chart ONCE on mount so zoom/pan state is preserved
    useEffect(() => {
        if (!containerRef.current) return;
        const el = containerRef.current;

        const chart = createChart(el, {
            width: el.clientWidth,
            height: 500,
            layout: {
                background: { type: ColorType.Solid, color: "#151925" },
                textColor: "#9CA3AF",
            },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: {
                    color: "rgba(148, 163, 184, 0.35)",
                    width: 1,
                    style: LineStyle.Dashed,
                    labelBackgroundColor: "#1E293B",
                },
                horzLine: {
                    color: "rgba(148, 163, 184, 0.35)",
                    width: 1,
                    style: LineStyle.Dashed,
                    labelBackgroundColor: "#1E293B",
                },
            },
            grid: {
                vertLines: { color: "rgba(255,255,255,0.04)" },
                horzLines: { color: "rgba(255,255,255,0.04)" },
            },
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
                horzTouchDrag: true,
                vertTouchDrag: true,
            },
            handleScale: {
                mouseWheel: true,
                pinch: true,
                axisPressedMouseMove: {
                    time: true,
                    price: true,
                },
                axisDoubleClickReset: {
                    time: true,
                    price: true,
                },
            },
            rightPriceScale: {
                borderColor: "rgba(255,255,255,0.12)",
                scaleMargins: {
                    top: 0.12,
                    bottom: 0.12,
                },
            },
            timeScale: {
                borderColor: "rgba(255,255,255,0.12)",
                timeVisible: true,
                secondsVisible: false,
                rightOffset: 8,
                barSpacing: 9,
                minBarSpacing: 2,
            },
        });

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: "#00C888",
            downColor: "#EF4444",
            borderUpColor: "#00C888",
            borderDownColor: "#EF4444",
            wickUpColor: "#00C888",
            wickDownColor: "#EF4444",
        });

        const handleChartClick = (param: MouseEventParams<Time>) => {
            if (!pinModeRef.current || !param.point || !seriesRef.current) return;
            const clickedPrice = seriesRef.current.coordinateToPrice(param.point.y);
            if (clickedPrice !== null && Number.isFinite(clickedPrice)) {
                const rounded = Number(clickedPrice.toFixed(2));
                setPinnedLines((prev) => [
                    ...prev,
                    {
                        id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                        price: rounded,
                        label: `FIXED ${rounded.toFixed(2)}`,
                    },
                ]);
                setIsPinMode(false);
            }
        };

        chart.subscribeClick(handleChartClick);
        chartRef.current = chart;
        seriesRef.current = candleSeries;

        const handleResize = () => {
            if (containerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: containerRef.current.clientWidth,
                });
            }
        };
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            chart.unsubscribeClick(handleChartClick);
            chart.remove();
            chartRef.current = null;
            seriesRef.current = null;
            priceLinesRef.current = [];
        };
    }, []);

    // 2. Resize chart height smoothly when Expanded toggle changes
    useEffect(() => {
        if (chartRef.current && containerRef.current) {
            chartRef.current.applyOptions({
                width: containerRef.current.clientWidth,
                height: chartHeight,
            });
        }
    }, [chartHeight]);

    // 3. Update candlesticks in-place WITHOUT resetting user zoom/pan
    useEffect(() => {
        const series = seriesRef.current;
        const chart = chartRef.current;
        if (!series || !chart) return;

        const formatted: CandlestickData<Time>[] = state.candles.map((c) => ({
            time: c.time as Time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
        }));

        if (formatted.length > 0) {
            series.setData(formatted);
            const chartKey = `${activeSymbol}_${timeframe}`;
            if (prevKeyRef.current !== chartKey) {
                prevKeyRef.current = chartKey;
                chart.timeScale().fitContent();
            }
        }
    }, [state.candles, activeSymbol, timeframe]);

    // 4. Synchronize Fixed Price Lines (Smart Grouped Lines + Selected Trade + Custom Pinned Horizontal Lines)
    useEffect(() => {
        const series = seriesRef.current;
        if (!series) return;

        priceLinesRef.current.forEach((line) => {
            try {
                series.removePriceLine(line);
            } catch {
                // ignore
            }
        });
        priceLinesRef.current = [];

        const addLine = (opts: {
            price: number;
            color: string;
            lineWidth: 1 | 2 | 3 | 4;
            lineStyle: LineStyle;
            axisLabelVisible: boolean;
            title: string;
        }) => {
            const line = series.createPriceLine(opts);
            priceLinesRef.current.push(line);
        };

        // 4A. Custom user-pinned fixed horizontal lines (Support / Resistance / Target)
        pinnedLines.forEach((pl) => {
            addLine({
                price: pl.price,
                color: "#A855F7",
                lineWidth: 2,
                lineStyle: LineStyle.Solid,
                axisLabelVisible: true,
                title: pl.label,
            });
        });

        if (lineMode === "SMART") {
            // Draw Net Average Entry fixed line per side (BUY / SELL)
            const buys = symbolPositions.filter((p) => p.type === "BUY");
            const sells = symbolPositions.filter((p) => p.type === "SELL");

            if (buys.length > 0) {
                const totalLots = buys.reduce((s, p) => s + p.lots, 0);
                const avgPrice =
                    buys.reduce((s, p) => s + p.openPrice * p.lots, 0) /
                    Math.max(totalLots, 0.0001);
                const totalPnl = buys.reduce((s, p) => s + p.netProfit, 0);
                addLine({
                    price: avgPrice,
                    color: "#00C888",
                    lineWidth: 2,
                    lineStyle: LineStyle.Solid,
                    axisLabelVisible: true,
                    title: `AVG BUY ${totalLots.toFixed(2)} (${buys.length}) ${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(0)}`,
                });
            }

            if (sells.length > 0) {
                const totalLots = sells.reduce((s, p) => s + p.lots, 0);
                const avgPrice =
                    sells.reduce((s, p) => s + p.openPrice * p.lots, 0) /
                    Math.max(totalLots, 0.0001);
                const totalPnl = sells.reduce((s, p) => s + p.netProfit, 0);
                addLine({
                    price: avgPrice,
                    color: "#EF4444",
                    lineWidth: 2,
                    lineStyle: LineStyle.Solid,
                    axisLabelVisible: true,
                    title: `AVG SELL ${totalLots.toFixed(2)} (${sells.length}) ${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(0)}`,
                });
            }

            // Deduplicate identical SL & TP levels so right price scale stays clean
            const slGroups = new Map<string, { price: number; count: number }>();
            const tpGroups = new Map<string, { price: number; count: number }>();

            symbolPositions.forEach((p) => {
                if (p.stopLoss > 0) {
                    const key = p.stopLoss.toFixed(2);
                    const cur = slGroups.get(key);
                    slGroups.set(key, {
                        price: p.stopLoss,
                        count: (cur?.count || 0) + 1,
                    });
                }
                if (p.takeProfit > 0) {
                    const key = p.takeProfit.toFixed(2);
                    const cur = tpGroups.get(key);
                    tpGroups.set(key, {
                        price: p.takeProfit,
                        count: (cur?.count || 0) + 1,
                    });
                }
            });

            slGroups.forEach((g) => {
                addLine({
                    price: g.price,
                    color: "#F59E0B",
                    lineWidth: 1,
                    lineStyle: LineStyle.Dashed,
                    axisLabelVisible: true,
                    title: g.count > 1 ? `SL ×${g.count}` : "SL",
                });
            });

            tpGroups.forEach((g) => {
                addLine({
                    price: g.price,
                    color: "#06B6D4",
                    lineWidth: 1,
                    lineStyle: LineStyle.Dashed,
                    axisLabelVisible: true,
                    title: g.count > 1 ? `TP ×${g.count}` : "TP",
                });
            });

            // Also highlight currently selected ticket entry line
            if (currentSelected) {
                addLine({
                    price: currentSelected.openPrice,
                    color: "#FBBF24",
                    lineWidth: 2,
                    lineStyle: LineStyle.Dotted,
                    axisLabelVisible: true,
                    title: `#${currentSelected.ticket} ${currentSelected.type} ${currentSelected.lots.toFixed(2)}`,
                });
            }
        } else if (lineMode === "SELECTED") {
            const target = currentSelected || symbolPositions[0];
            if (target) {
                const isBuy = target.type === "BUY";
                addLine({
                    price: target.openPrice,
                    color: isBuy ? "#00C888" : "#EF4444",
                    lineWidth: 2,
                    lineStyle: LineStyle.Solid,
                    axisLabelVisible: true,
                    title: `#${target.ticket} ${target.type} ${target.lots.toFixed(2)} (${target.netProfit >= 0 ? "+" : ""}$${target.netProfit.toFixed(1)})`,
                });
                if (target.stopLoss > 0) {
                    addLine({
                        price: target.stopLoss,
                        color: "#F59E0B",
                        lineWidth: 2,
                        lineStyle: LineStyle.Dashed,
                        axisLabelVisible: true,
                        title: `SL #${target.ticket}`,
                    });
                }
                if (target.takeProfit > 0) {
                    addLine({
                        price: target.takeProfit,
                        color: "#06B6D4",
                        lineWidth: 2,
                        lineStyle: LineStyle.Dashed,
                        axisLabelVisible: true,
                        title: `TP #${target.ticket}`,
                    });
                }
            }
        } else {
            // ALL mode: show individual entry lines, still deduplicating shared SL/TP
            symbolPositions.forEach((pos) => {
                const isBuy = pos.type === "BUY";
                const isSel = currentSelected?.ticket === pos.ticket;
                addLine({
                    price: pos.openPrice,
                    color: isSel ? "#FBBF24" : isBuy ? "#00C888" : "#EF4444",
                    lineWidth: isSel ? 2 : 1,
                    lineStyle: LineStyle.Solid,
                    axisLabelVisible: true,
                    title: `${pos.type} ${pos.lots.toFixed(2)} (${pos.netProfit >= 0 ? "+" : ""}$${pos.netProfit.toFixed(0)})`,
                });
            });
        }
    }, [symbolPositions, currentSelected, lineMode, pinnedLines]);

    const handleZoom = (factor: number) => {
        const chart = chartRef.current;
        if (!chart) return;
        const ts = chart.timeScale();
        const range = ts.getVisibleLogicalRange();
        if (!range) return;
        const span = range.to - range.from;
        const center = (range.from + range.to) / 2;
        const nextSpan = Math.max(8, Math.min(300, span * factor));
        ts.setVisibleLogicalRange({
            from: center - nextSpan / 2,
            to: center + nextSpan / 2,
        });
    };

    const handleResetView = () => {
        const chart = chartRef.current;
        if (!chart) return;
        chart.priceScale("right").applyOptions({ autoScale: true });
        chart.timeScale().fitContent();
    };

    const cycleLineMode = () => {
        setLineMode((prev) =>
            prev === "SMART" ? "SELECTED" : prev === "SELECTED" ? "ALL" : "SMART"
        );
    };

    return (
        <div className="space-y-4">
            <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-4 space-y-3">
                {/* HEADER BAR: SYMBOL + TIMEFRAMES + TRADINGVIEW CONTROLS */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-base font-black text-gray-900 dark:text-white">
                                {activeSymbol}
                            </span>
                            {state.activeQuote && (
                                <span className="text-xs font-extrabold text-emerald-400">
                                    Bid {state.activeQuote.bid.toFixed(2)} • Ask{" "}
                                    {state.activeQuote.ask.toFixed(2)}
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Scroll wheel to zoom • Drag chart or price scale to pan/scale • Double-click axis to reset
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                        {/* Timeframe Selector */}
                        <div className="flex items-center gap-1">
                            {TIMEFRAMES.map((tf) => (
                                <Button
                                    key={tf.value}
                                    type="button"
                                    variant={timeframe === tf.value ? "primary" : "outline"}
                                    size="sm"
                                    onClick={() => onChangeTimeframe(tf.value)}
                                    className="h-8 px-2.5 text-xs"
                                >
                                    {tf.label}
                                </Button>
                            ))}
                        </div>

                        {/* TradingView Zoom / Fixed Line / Expand Controls */}
                        <div className="flex items-center gap-1 border-l border-gray-200 dark:border-white/10 pl-1.5">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={cycleLineMode}
                                className="h-8 px-2.5 text-xs"
                                aria-label="Switch fixed price line mode"
                            >
                                <Layers size={13} />
                                <span>
                                    Lines:{" "}
                                    {lineMode === "SMART"
                                        ? "Smart"
                                        : lineMode === "SELECTED"
                                        ? "Selected"
                                        : "All"}
                                </span>
                            </Button>

                            <Button
                                type="button"
                                variant={isPinMode ? "primary" : "outline"}
                                size="sm"
                                onClick={() => setIsPinMode((v) => !v)}
                                className="h-8 px-2.5 text-xs"
                                aria-label="Pin fixed horizontal line on chart"
                            >
                                <Pin size={13} />
                                <span>{isPinMode ? "Click Chart..." : "+ Fixed Line"}</span>
                            </Button>

                            {pinnedLines.length > 0 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setPinnedLines([])}
                                    className="h-8 w-8"
                                    aria-label="Clear custom fixed lines"
                                >
                                    <Trash2 size={13} />
                                </Button>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => handleZoom(0.7)}
                                className="h-8 w-8"
                                aria-label="Zoom in chart"
                            >
                                <ZoomIn size={14} />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => handleZoom(1.35)}
                                className="h-8 w-8"
                                aria-label="Zoom out chart"
                            >
                                <ZoomOut size={14} />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleResetView}
                                className="h-8 w-8"
                                aria-label="Reset chart zoom and auto-fit"
                            >
                                <RotateCcw size={14} />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setIsExpanded((v) => !v)}
                                className="h-8 w-8"
                                aria-label="Toggle expanded chart height"
                            >
                                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* LIGHTWEIGHT CHART CONTAINER */}
                <div
                    ref={containerRef}
                    style={{ height: `${chartHeight}px` }}
                    className={`w-full rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-[#151925] transition-[height] duration-200 ${
                        isPinMode ? "cursor-crosshair ring-1 ring-purple-500/60" : ""
                    }`}
                />

                {/* 1-TAP POSITION PILLS */}
                {symbolPositions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {symbolPositions.map((pos) => {
                            const isSelected = currentSelected?.ticket === pos.ticket;
                            return (
                                <Button
                                    key={pos.ticket}
                                    type="button"
                                    variant={isSelected ? "primary" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedPosition(pos)}
                                    className="h-8 px-2.5 text-[11px]"
                                >
                                    <span>
                                        {pos.type} {pos.lots.toFixed(2)} @ {pos.openPrice.toFixed(2)}
                                    </span>
                                    <span
                                        className={
                                            pos.netProfit >= 0
                                                ? "text-emerald-300 font-extrabold"
                                                : "text-red-300 font-extrabold"
                                        }
                                    >
                                        {pos.netProfit >= 0 ? "+" : ""}${pos.netProfit.toFixed(2)}
                                    </span>
                                </Button>
                            );
                        })}
                    </div>
                )}
            </div>

            {currentSelected && (
                <PositionInspectorCard
                    selectedPosition={currentSelected}
                    openCount={state.openCount}
                    isBusy={isBusy}
                    onCloseInspector={() => setSelectedPosition(null)}
                    onExecute={onExecute}
                />
            )}
        </div>
    );
}
