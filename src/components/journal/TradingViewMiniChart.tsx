"use client";

import { useEffect, useRef, useMemo } from "react";
import { createChart, ColorType, CandlestickSeries, LineStyle } from "lightweight-charts";
import type { CandlestickData, Time, ISeriesPrimitive, SeriesAttachedParameter, IPrimitivePaneView, IPrimitivePaneRenderer } from "lightweight-charts";

// ─── MT5-Style Entry/Exit Markers Primitive ───────────────────────────
class EntryExitMarkersPrimitive implements ISeriesPrimitive<Time> {
    private _entryTime: Time;
    private _exitTime: Time;
    private _entryPrice: number;
    private _exitPrice: number;
    private _isBuy: boolean;
    private _isWin: boolean;
    private _series: any = null;
    private _chart: any = null;

    constructor(
        entryTime: Time,
        exitTime: Time,
        entryPrice: number,
        exitPrice: number,
        isBuy: boolean,
        isWin: boolean,
    ) {
        this._entryTime = entryTime;
        this._exitTime = exitTime;
        this._entryPrice = entryPrice;
        this._exitPrice = exitPrice;
        this._isBuy = isBuy;
        this._isWin = isWin;
    }

    attached(param: SeriesAttachedParameter<Time>) {
        this._series = param.series;
        this._chart = param.chart;
    }

    detached() {
        this._series = null;
        this._chart = null;
    }

    updateAllViews() {}

    paneViews(): IPrimitivePaneView[] {
        return [new EntryExitPaneView(this)];
    }

    // Expose internals to the pane view
    get series() { return this._series; }
    get chart() { return this._chart; }
    get entryTime() { return this._entryTime; }
    get exitTime() { return this._exitTime; }
    get entryPrice() { return this._entryPrice; }
    get exitPrice() { return this._exitPrice; }
    get isBuy() { return this._isBuy; }
    get isWin() { return this._isWin; }
}

class EntryExitPaneView implements IPrimitivePaneView {
    private _source: EntryExitMarkersPrimitive;

    constructor(source: EntryExitMarkersPrimitive) {
        this._source = source;
    }

    renderer(): IPrimitivePaneRenderer | null {
        return new EntryExitRenderer(this._source);
    }
}

class EntryExitRenderer implements IPrimitivePaneRenderer {
    private _source: EntryExitMarkersPrimitive;

    constructor(source: EntryExitMarkersPrimitive) {
        this._source = source;
    }

    draw(target: any) {
        target.useBitmapCoordinateSpace((scope: any) => {
            const ctx = scope.context as CanvasRenderingContext2D;
            const series = this._source.series;
            const chart = this._source.chart;

            if (!series || !chart) return;

            const timeScale = chart.timeScale();
            const entryX = timeScale.timeToCoordinate(this._source.entryTime);
            const exitX = timeScale.timeToCoordinate(this._source.exitTime);
            const entryY = series.priceToCoordinate(this._source.entryPrice);
            const exitY = series.priceToCoordinate(this._source.exitPrice);

            if (entryX === null || exitX === null || entryY === null || exitY === null) return;

            const hRatio = scope.horizontalPixelRatio;
            const vRatio = scope.verticalPixelRatio;

            const eX = entryX * hRatio;
            const eY = entryY * vRatio;
            const xX = exitX * hRatio;
            const xY = exitY * vRatio;

            // ── 1. Dashed connecting line (MT5-style blue dotted) ──
            ctx.save();
            ctx.setLineDash([4 * hRatio, 3 * hRatio]);
            ctx.strokeStyle = "rgba(59, 130, 246, 0.6)";
            ctx.lineWidth = 1.5 * hRatio;
            ctx.beginPath();
            ctx.moveTo(eX, eY);
            ctx.lineTo(xX, xY);
            ctx.stroke();
            ctx.setLineDash([]);

            // ── 2. Entry arrow (MT5-style) ──
            const arrowSize = 7 * hRatio;
            const arrowColor = "#3b82f6"; // Blue for entry

            // For BUY: arrow pointing UP from below the candle
            // For SELL: arrow pointing DOWN from above the candle
            ctx.fillStyle = arrowColor;
            ctx.beginPath();
            if (this._source.isBuy) {
                // Upward arrow ▲
                ctx.moveTo(eX, eY - arrowSize * 0.5);
                ctx.lineTo(eX - arrowSize * 0.7, eY + arrowSize * 0.8);
                ctx.lineTo(eX + arrowSize * 0.7, eY + arrowSize * 0.8);
            } else {
                // Downward arrow ▼
                ctx.moveTo(eX, eY + arrowSize * 0.5);
                ctx.lineTo(eX - arrowSize * 0.7, eY - arrowSize * 0.8);
                ctx.lineTo(eX + arrowSize * 0.7, eY - arrowSize * 0.8);
            }
            ctx.closePath();
            ctx.fill();

            // Entry dot
            ctx.fillStyle = arrowColor;
            ctx.beginPath();
            ctx.arc(eX, eY, 3 * hRatio, 0, Math.PI * 2);
            ctx.fill();

            // ── 3. Exit arrow (MT5-style, opposite direction) ──
            const exitColor = this._source.isWin ? "#22c55e" : "#ef4444";

            ctx.fillStyle = exitColor;
            ctx.beginPath();
            if (this._source.isBuy) {
                // For BUY trade exit: arrow pointing DOWN (closing long)
                ctx.moveTo(xX, xY + arrowSize * 0.5);
                ctx.lineTo(xX - arrowSize * 0.7, xY - arrowSize * 0.8);
                ctx.lineTo(xX + arrowSize * 0.7, xY - arrowSize * 0.8);
            } else {
                // For SELL trade exit: arrow pointing UP (closing short)
                ctx.moveTo(xX, xY - arrowSize * 0.5);
                ctx.lineTo(xX - arrowSize * 0.7, xY + arrowSize * 0.8);
                ctx.lineTo(xX + arrowSize * 0.7, xY + arrowSize * 0.8);
            }
            ctx.closePath();
            ctx.fill();

            // Exit dot
            ctx.fillStyle = exitColor;
            ctx.beginPath();
            ctx.arc(xX, xY, 3 * hRatio, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }
}

// ─── Chart Props & Data Generation ────────────────────────────────────

interface TradingViewMiniChartProps {
    entryPrice: number;
    exitPrice: number;
    entryDate?: string | null;
    exitDate?: string | null;
    stopLoss?: number | null;
    takeProfit?: number | null;
    type: "BUY" | "SELL";
    isWin: boolean;
    tradeId: string;
    className?: string;
}

function calcCandleParams(entryDate?: string | null, exitDate?: string | null) {
    if (!entryDate || !exitDate) {
        return { candles: 20, intervalSec: 3600 };
    }

    const durationMs = new Date(exitDate).getTime() - new Date(entryDate).getTime();
    const durationMin = Math.max(durationMs / 60000, 1);

    let candles: number;

    if (durationMin <= 5) {
        candles = 15;
    } else if (durationMin <= 30) {
        candles = 18;
    } else if (durationMin <= 120) {
        candles = 20;
    } else if (durationMin <= 480) {
        candles = 22;
    } else {
        candles = 25;
    }

    const intervalSec = Math.max(Math.floor((durationMs / 1000) / candles), 10);
    return { candles, intervalSec };
}

function generateCandlestickData(
    entryPrice: number,
    exitPrice: number,
    type: "BUY" | "SELL",
    isWin: boolean,
    seed: string,
    entryDate?: string | null,
    exitDate?: string | null,
): CandlestickData<Time>[] {
    const hash = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const pseudoRandom = (i: number) => {
        const x = Math.sin(i * 127.1 + hash * 311.7) * 43758.5453;
        return x - Math.floor(x);
    };

    const { candles, intervalSec } = calcCandleParams(entryDate, exitDate);
    const priceRange = Math.abs(exitPrice - entryPrice);
    const volatility = Math.max(priceRange * 0.08, entryPrice * 0.0003);

    const data: CandlestickData<Time>[] = [];
    const baseTime = entryDate
        ? Math.floor(new Date(entryDate).getTime() / 1000)
        : 1704067200;

    let prevClose = entryPrice;

    for (let i = 0; i < candles; i++) {
        const progress = i / (candles - 1);

        const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        let targetPrice = entryPrice + (exitPrice - entryPrice) * eased;

        const edgeFade = Math.sin(progress * Math.PI);
        const noise = (pseudoRandom(i * 3) - 0.5) * volatility * edgeFade * 2;
        const wave = Math.sin(progress * Math.PI * 2.5) * volatility * 0.5 * edgeFade;

        if (!isWin && progress > 0.2 && progress < 0.6) {
            const drawdownPhase = (progress - 0.2) / 0.4;
            const wrongDirection = type === "BUY"
                ? volatility * Math.sin(drawdownPhase * Math.PI) * 3
                : -volatility * Math.sin(drawdownPhase * Math.PI) * 3;
            targetPrice += wrongDirection;
        }

        targetPrice += noise + wave;

        if (i === 0) targetPrice = entryPrice;
        if (i === candles - 1) targetPrice = exitPrice;

        const close = Math.round(targetPrice * 100) / 100;
        const open = i === 0 ? entryPrice : prevClose;

        const wickUp = pseudoRandom(i * 11 + 7) * volatility * 1.2;
        const wickDown = pseudoRandom(i * 13 + 3) * volatility * 1.2;

        const high = Math.round((Math.max(open, close) + wickUp) * 100) / 100;
        const low = Math.round((Math.min(open, close) - wickDown) * 100) / 100;

        data.push({
            time: (baseTime + i * intervalSec) as Time,
            open,
            high,
            low,
            close,
        });

        prevClose = close;
    }

    return data;
}

// ─── Main Component ───────────────────────────────────────────────────

export function TradingViewMiniChart({
    entryPrice,
    exitPrice,
    entryDate,
    exitDate,
    stopLoss,
    takeProfit,
    type,
    isWin,
    tradeId,
    className,
}: TradingViewMiniChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<ReturnType<typeof createChart> | null>(null);

    const chartData = useMemo(
        () => generateCandlestickData(entryPrice, exitPrice, type, isWin, tradeId, entryDate, exitDate),
        [entryPrice, exitPrice, type, isWin, tradeId, entryDate, exitDate]
    );

    useEffect(() => {
        if (!chartContainerRef.current || chartData.length === 0) return;

        const container = chartContainerRef.current;

        const chart = createChart(container, {
            width: container.clientWidth,
            height: container.clientHeight,
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "rgba(150, 150, 150, 0.5)",
                fontFamily: "'Inter', sans-serif",
            },
            grid: {
                vertLines: { color: "rgba(150, 150, 150, 0.04)" },
                horzLines: { color: "rgba(150, 150, 150, 0.04)" },
            },
            rightPriceScale: { visible: false },
            timeScale: { visible: false, borderVisible: false },
            crosshair: {
                horzLine: { visible: false },
                vertLine: { visible: false },
            },
            handleScroll: false,
            handleScale: false,
        });

        chartRef.current = chart;

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: "#22c55e",
            downColor: "#ef4444",
            borderUpColor: "#16a34a",
            borderDownColor: "#dc2626",
            wickUpColor: "#22c55e",
            wickDownColor: "#ef4444",
            priceLineVisible: false,
            lastValueVisible: false,
        });

        candleSeries.setData(chartData);

        // SL line
        if (stopLoss) {
            candleSeries.createPriceLine({
                price: stopLoss,
                color: "rgba(239, 68, 68, 0.4)",
                lineWidth: 1,
                lineStyle: LineStyle.Dashed,
                axisLabelVisible: false,
                title: "SL",
            });
        }

        // TP line
        if (takeProfit) {
            candleSeries.createPriceLine({
                price: takeProfit,
                color: "rgba(34, 197, 94, 0.4)",
                lineWidth: 1,
                lineStyle: LineStyle.Dashed,
                axisLabelVisible: false,
                title: "TP",
            });
        }

        // MT5-style Entry/Exit markers + dashed connecting line
        const entryTime = chartData[0].time;
        const exitTime = chartData[chartData.length - 1].time;
        const isBuy = type === "BUY";

        const markersPrimitive = new EntryExitMarkersPrimitive(
            entryTime,
            exitTime,
            entryPrice,
            exitPrice,
            isBuy,
            isWin,
        );
        candleSeries.attachPrimitive(markersPrimitive);

        chart.timeScale().fitContent();

        const resizeObserver = new ResizeObserver((entries) => {
            for (const e of entries) {
                const { width, height } = e.contentRect;
                chart.applyOptions({ width, height });
            }
        });
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
            chartRef.current = null;
        };
    }, [chartData, entryPrice, exitPrice, isWin, type, stopLoss, takeProfit]);

    return (
        <div
            ref={chartContainerRef}
            className={className}
            style={{ width: "100%", height: "100%" }}
        />
    );
}
