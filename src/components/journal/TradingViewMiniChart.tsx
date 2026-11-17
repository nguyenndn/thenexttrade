"use client";

import { useEffect, useRef, useMemo } from "react";
import {
    createChart,
    ColorType,
    CandlestickSeries,
    LineStyle,
} from "lightweight-charts";
import type {
    CandlestickData,
    Time,
    ISeriesPrimitive,
    SeriesAttachedParameter,
    IPrimitivePaneView,
    IPrimitivePaneRenderer,
    PrimitivePaneViewZOrder,
    IChartApi,
    ISeriesApi,
} from "lightweight-charts";

type RenderTarget = Parameters<IPrimitivePaneRenderer["draw"]>[0];

function countSignificantDecimals(value: number): number {
    if (!Number.isFinite(value)) return 2;
    const str = String(value);
    if (str.includes("e-")) {
        const exp = Number(str.split("e-")[1]);
        return Number.isFinite(exp) ? Math.min(exp, 5) : 2;
    }
    const dotIdx = str.indexOf(".");
    return dotIdx === -1 ? 0 : Math.min(str.length - dotIdx - 1, 5);
}

function getCleanPriceText(price: number): string {
    if (!Number.isFinite(price)) return "0";
    const decimals = countSignificantDecimals(price);
    return decimals > 0 ? price.toFixed(decimals) : price.toFixed(2);
}

interface PositionBoxParams {
    entryTime: Time;
    exitTime: Time;
    entryPrice: number;
    exitPrice: number;
    stopLoss?: number | null;
    takeProfit?: number | null;
    isWin: boolean;
}

function drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// ─── TradingView-Style Position Box + Floating Entry/Exit Pills ────────
class PositionBoxPrimitive implements ISeriesPrimitive<Time> {
    private _params: PositionBoxParams;
    private _series: ISeriesApi<"Candlestick", Time> | null = null;
    private _chart: IChartApi | null = null;

    constructor(params: PositionBoxParams) {
        this._params = params;
    }

    attached(param: SeriesAttachedParameter<Time>) {
        this._series = param.series as ISeriesApi<"Candlestick", Time>;
        this._chart = param.chart;
    }

    detached() {
        this._series = null;
        this._chart = null;
    }

    updateAllViews() {}

    paneViews(): IPrimitivePaneView[] {
        return [new PositionBoxPaneView(this)];
    }

    get series() {
        return this._series;
    }
    get chart() {
        return this._chart;
    }
    get params() {
        return this._params;
    }
}

class PositionBoxPaneView implements IPrimitivePaneView {
    private _source: PositionBoxPrimitive;

    constructor(source: PositionBoxPrimitive) {
        this._source = source;
    }

    zOrder(): PrimitivePaneViewZOrder {
        return "top";
    }

    renderer(): IPrimitivePaneRenderer | null {
        return new PositionBoxRenderer(this._source);
    }
}

class PositionBoxRenderer implements IPrimitivePaneRenderer {
    private _source: PositionBoxPrimitive;

    constructor(source: PositionBoxPrimitive) {
        this._source = source;
    }

    // Background layer: subtle dashed execution trajectory line behind candlesticks
    drawBackground(target: RenderTarget) {
        target.useBitmapCoordinateSpace((scope) => {
            const ctx = scope.context;
            const series = this._source.series;
            const chart = this._source.chart;
            if (!series || !chart) return;

            const {
                entryTime,
                exitTime,
                entryPrice,
                exitPrice,
                isWin,
            } = this._source.params;

            const timeScale = chart.timeScale();
            const entryX = timeScale.timeToCoordinate(entryTime);
            const exitX = timeScale.timeToCoordinate(exitTime);
            const entryY = series.priceToCoordinate(entryPrice);
            const exitY = series.priceToCoordinate(exitPrice);

            if (
                entryX === null ||
                exitX === null ||
                entryY === null ||
                exitY === null
            ) {
                return;
            }

            const hRatio = scope.horizontalPixelRatio;
            const vRatio = scope.verticalPixelRatio;

            const eX = entryX * hRatio;
            const xX = exitX * hRatio;
            const eY = entryY * vRatio;
            const xY = exitY * vRatio;

            ctx.save();
            ctx.setLineDash([4 * hRatio, 3 * hRatio]);
            ctx.strokeStyle = isWin
                ? "rgba(16, 185, 129, 0.6)"
                : "rgba(244, 63, 94, 0.6)";
            ctx.lineWidth = 1.5 * hRatio;
            ctx.beginPath();
            ctx.moveTo(eX, eY);
            ctx.lineTo(xX, xY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        });
    }

    // Foreground layer: glowing Entry/Exit nodes + crisp ENTRY / EXIT price pills + R:R tag
    draw(target: RenderTarget) {
        target.useBitmapCoordinateSpace((scope) => {
            const ctx = scope.context;
            const series = this._source.series;
            const chart = this._source.chart;
            if (!series || !chart) return;

            const {
                entryTime,
                exitTime,
                entryPrice,
                exitPrice,
                stopLoss,
                takeProfit,
                isWin,
            } = this._source.params;

            const timeScale = chart.timeScale();
            const entryX = timeScale.timeToCoordinate(entryTime);
            const exitX = timeScale.timeToCoordinate(exitTime);
            const entryY = series.priceToCoordinate(entryPrice);
            const exitY = series.priceToCoordinate(exitPrice);

            if (
                entryX === null ||
                exitX === null ||
                entryY === null ||
                exitY === null
            ) {
                return;
            }

            const hRatio = scope.horizontalPixelRatio;
            const vRatio = scope.verticalPixelRatio;
            const canvasW = scope.bitmapSize.width;
            const canvasH = scope.bitmapSize.height;

            const eX = entryX * hRatio;
            const xX = exitX * hRatio;
            const eY = entryY * vRatio;
            const xY = exitY * vRatio;

            ctx.save();

            // ── 1. Entry Node (Gold core + soft halo) ──
            ctx.fillStyle = "rgba(245, 158, 11, 0.24)";
            ctx.beginPath();
            ctx.arc(eX, eY, 7.5 * hRatio, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#F59E0B";
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 1.6 * hRatio;
            ctx.beginPath();
            ctx.arc(eX, eY, 3.8 * hRatio, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // ── 2. Exit Node (Emerald/Rose core + soft halo) ──
            const exitAccent = isWin ? "#10B981" : "#F43F5E";
            const exitHalo = isWin
                ? "rgba(16, 185, 129, 0.28)"
                : "rgba(244, 63, 94, 0.28)";

            ctx.fillStyle = exitHalo;
            ctx.beginPath();
            ctx.arc(xX, xY, 8 * hRatio, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = exitAccent;
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 1.6 * hRatio;
            ctx.beginPath();
            ctx.arc(xX, xY, 4.2 * hRatio, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // ── 3. Optional R:R Pill when both SL & TP exist ──
            const fontPx = Math.round(10 * vRatio);
            ctx.font = `700 ${fontPx}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
            ctx.textBaseline = "middle";

            if (
                stopLoss &&
                takeProfit &&
                Math.abs(entryPrice - stopLoss) > 0
            ) {
                const rr =
                    Math.abs(takeProfit - entryPrice) /
                    Math.abs(entryPrice - stopLoss);
                if (Number.isFinite(rr) && rr > 0 && rr < 100) {
                    const rrLabel = `R:R 1:${rr.toFixed(1)}`;
                    const rrPadX = 6 * hRatio;
                    const rrH = 17 * vRatio;
                    const rrW = ctx.measureText(rrLabel).width + rrPadX * 2;
                    const rrX = Math.min(
                        Math.max(Math.max(eX, xX) - rrW, 6 * hRatio),
                        canvasW - rrW - 6 * hRatio
                    );
                    const rrY = Math.max(
                        6 * vRatio,
                        Math.min(eY, xY) - rrH - 6 * vRatio
                    );

                    drawRoundedRect(ctx, rrX, rrY, rrW, rrH, 4 * hRatio);
                    ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
                    ctx.fill();
                    ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
                    ctx.lineWidth = 1 * hRatio;
                    ctx.stroke();

                    ctx.fillStyle = "#FBBF24";
                    ctx.fillText(rrLabel, rrX + rrPadX, rrY + rrH / 2);
                }
            }

            // ── 4. Floating ENTRY & EXIT Price Pills ──
            const entryPrefix = "ENTRY ";
            const entryPriceStr = getCleanPriceText(entryPrice);
            const exitPrefix = "EXIT ";
            const exitPriceStr = getCleanPriceText(exitPrice);

            const padX = 7 * hRatio;
            const pillH = 19 * vRatio;
            const pillRadius = 5 * hRatio;
            const margin = 6 * hRatio;
            const offsetFromNode = 10 * vRatio;

            // Measure ENTRY pill
            const entryPrefixW = ctx.measureText(entryPrefix).width;
            const entryValueW = ctx.measureText(entryPriceStr).width;
            const entryPillW = entryPrefixW + entryValueW + padX * 2;

            // Place ENTRY pill outside the Position Box relative to Entry
            const entryPlaceAbove = eY <= xY;
            let entryPillX = eX - entryPillW * 0.25;
            entryPillX = Math.max(
                margin,
                Math.min(canvasW - entryPillW - margin, entryPillX)
            );
            let entryPillY = entryPlaceAbove
                ? eY - pillH - offsetFromNode
                : eY + offsetFromNode;
            entryPillY = Math.max(
                margin,
                Math.min(canvasH - pillH - margin, entryPillY)
            );

            // Measure EXIT pill
            const exitPrefixW = ctx.measureText(exitPrefix).width;
            const exitValueW = ctx.measureText(exitPriceStr).width;
            const exitPillW = exitPrefixW + exitValueW + padX * 2;

            const exitPlaceAbove = xY < eY;
            let exitPillX = xX - exitPillW * 0.75;
            exitPillX = Math.max(
                margin,
                Math.min(canvasW - exitPillW - margin, exitPillX)
            );
            let exitPillY = exitPlaceAbove
                ? xY - pillH - offsetFromNode
                : xY + offsetFromNode;
            exitPillY = Math.max(
                margin,
                Math.min(canvasH - pillH - margin, exitPillY)
            );

            // Prevent pill overlap on breakeven / tight scalps
            const horizOverlap =
                entryPillX < exitPillX + exitPillW + 4 * hRatio &&
                entryPillX + entryPillW + 4 * hRatio > exitPillX;
            const vertOverlap =
                Math.abs(entryPillY - exitPillY) < pillH + 4 * vRatio;
            if (horizOverlap && vertOverlap) {
                entryPillY = Math.max(
                    margin,
                    Math.min(eY, xY) - pillH - offsetFromNode
                );
                exitPillY = Math.min(
                    canvasH - pillH - margin,
                    Math.max(eY, xY) + offsetFromNode
                );
            }

            // Render ENTRY pill (Dark Slate + Gold label + Crisp White price)
            ctx.save();
            ctx.shadowColor = "rgba(15, 23, 42, 0.22)";
            ctx.shadowBlur = 6 * hRatio;
            ctx.shadowOffsetY = 2 * vRatio;
            drawRoundedRect(
                ctx,
                entryPillX,
                entryPillY,
                entryPillW,
                pillH,
                pillRadius
            );
            ctx.fillStyle = "#1E293B";
            ctx.fill();
            ctx.restore();

            drawRoundedRect(
                ctx,
                entryPillX,
                entryPillY,
                entryPillW,
                pillH,
                pillRadius
            );
            ctx.strokeStyle = "rgba(245, 158, 11, 0.5)";
            ctx.lineWidth = 1 * hRatio;
            ctx.stroke();

            ctx.fillStyle = "#FBBF24";
            ctx.fillText(
                entryPrefix,
                entryPillX + padX,
                entryPillY + pillH / 2
            );
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(
                entryPriceStr,
                entryPillX + padX + entryPrefixW,
                entryPillY + pillH / 2
            );

            // Render EXIT pill (Emerald-600 for Win / Rose-600 for Loss)
            ctx.save();
            ctx.shadowColor = isWin
                ? "rgba(5, 150, 105, 0.28)"
                : "rgba(225, 29, 72, 0.28)";
            ctx.shadowBlur = 6 * hRatio;
            ctx.shadowOffsetY = 2 * vRatio;
            drawRoundedRect(
                ctx,
                exitPillX,
                exitPillY,
                exitPillW,
                pillH,
                pillRadius
            );
            ctx.fillStyle = isWin ? "#059669" : "#E11D48";
            ctx.fill();
            ctx.restore();

            drawRoundedRect(
                ctx,
                exitPillX,
                exitPillY,
                exitPillW,
                pillH,
                pillRadius
            );
            ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
            ctx.lineWidth = 1 * hRatio;
            ctx.stroke();

            ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
            ctx.fillText(exitPrefix, exitPillX + padX, exitPillY + pillH / 2);
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(
                exitPriceStr,
                exitPillX + padX + exitPrefixW,
                exitPillY + pillH / 2
            );

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
        return { tradeCandles: 16, intervalSec: 900 };
    }

    const durationMs =
        new Date(exitDate).getTime() - new Date(entryDate).getTime();
    const durationMin = Math.max(durationMs / 60000, 1);

    let tradeCandles: number;
    if (durationMin <= 5) {
        tradeCandles = 13;
    } else if (durationMin <= 30) {
        tradeCandles = 15;
    } else if (durationMin <= 120) {
        tradeCandles = 17;
    } else if (durationMin <= 480) {
        tradeCandles = 19;
    } else {
        tradeCandles = 21;
    }

    const intervalSec = Math.max(
        Math.floor(durationMs / 1000 / tradeCandles),
        15
    );
    return { tradeCandles, intervalSec };
}

interface GeneratedChartSeries {
    candles: CandlestickData<Time>[];
    entryIndex: number;
    exitIndex: number;
    precision: number;
}

function generateCandlestickData(
    entryPrice: number,
    exitPrice: number,
    type: "BUY" | "SELL",
    isWin: boolean,
    seed: string,
    entryDate?: string | null,
    exitDate?: string | null
): GeneratedChartSeries {
    const hash = Array.from(seed).reduce(
        (acc, char) => acc + char.charCodeAt(0),
        0
    );
    const pseudoRandom = (i: number) => {
        const x = Math.sin(i * 127.1 + hash * 311.7) * 43758.5453;
        return x - Math.floor(x);
    };

    const precision = Math.max(
        2,
        countSignificantDecimals(entryPrice),
        countSignificantDecimals(exitPrice)
    );
    const factor = Math.pow(10, precision);
    const roundPrice = (v: number) => Math.round(v * factor) / factor;

    const { tradeCandles, intervalSec } = calcCandleParams(entryDate, exitDate);
    const leadIn = 4;
    const leadOut = 2;
    const totalCandles = leadIn + tradeCandles + leadOut;
    const entryIndex = leadIn;
    const exitIndex = leadIn + tradeCandles - 1;

    const priceDelta = exitPrice - entryPrice;
    const priceRange = Math.abs(priceDelta);
    const volatility = Math.max(
        priceRange * 0.14,
        entryPrice * 0.00035,
        2 / factor
    );

    const parsedEntrySec = entryDate
        ? Math.floor(new Date(entryDate).getTime() / 1000)
        : 1704067200;
    const startSec =
        (Number.isFinite(parsedEntrySec) ? parsedEntrySec : 1704067200) -
        leadIn * intervalSec;

    const candles: CandlestickData<Time>[] = [];

    // Pre-entry approach direction: price approaches entry cleanly (pullback / retest)
    const preBias = type === "BUY" ? volatility * 1.4 : -volatility * 1.4;
    let prevClose = roundPrice(
        entryPrice + preBias + (pseudoRandom(901) - 0.5) * volatility
    );

    for (let i = 0; i < totalCandles; i++) {
        let open = prevClose;
        let close: number;

        if (i < entryIndex) {
            // Lead-in market context candles approaching entryPrice
            const t = (i + 1) / leadIn;
            const target = entryPrice + preBias * (1 - t);
            const jitter = (pseudoRandom(i * 7 + 2) - 0.5) * volatility * 0.9;
            close = roundPrice(i === entryIndex - 1 ? entryPrice : target + jitter);
        } else if (i === entryIndex) {
            // Entry candle anchored cleanly at entryPrice
            open = roundPrice(entryPrice);
            const step =
                priceRange > 0
                    ? priceDelta / tradeCandles
                    : (type === "BUY" ? 1 : -1) * volatility * 0.4;
            close = roundPrice(
                entryPrice + step + (pseudoRandom(i * 5) - 0.45) * volatility * 0.7
            );
        } else if (i <= exitIndex) {
            // Active trade candles from Entry -> Exit
            const progress = (i - entryIndex) / Math.max(tradeCandles - 1, 1);
            const eased =
                progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            let targetPrice = entryPrice + priceDelta * eased;
            const edgeFade = Math.sin(progress * Math.PI);
            const noise =
                (pseudoRandom(i * 3) - 0.5) * volatility * 1.45 * edgeFade;
            const wave =
                Math.sin(progress * Math.PI * 2.2) *
                volatility *
                0.45 *
                edgeFade;

            if (!isWin && progress > 0.15 && progress < 0.55) {
                const phase = (progress - 0.15) / 0.4;
                const headfake =
                    type === "BUY"
                        ? volatility * Math.sin(phase * Math.PI) * 2.2
                        : -volatility * Math.sin(phase * Math.PI) * 2.2;
                targetPrice += headfake;
            }

            close =
                i === exitIndex
                    ? roundPrice(exitPrice)
                    : roundPrice(targetPrice + noise + wave);
        } else {
            // Post-exit context candles (2 subtle candles after exit)
            const drift = (pseudoRandom(i * 17) - 0.48) * volatility * 0.85;
            close = roundPrice(open + drift);
        }

        // Prevent zero-body flat dashes on key candles so candlesticks look crisp
        if (close === open) {
            close = roundPrice(
                open + (pseudoRandom(i * 19) >= 0.5 ? 1 : -1) * (volatility * 0.25)
            );
            if (i === exitIndex) {
                open = roundPrice(
                    exitPrice - (priceDelta >= 0 ? 1 : -1) * volatility * 0.35
                );
                close = roundPrice(exitPrice);
            }
        }

        const wickUp = (0.18 + pseudoRandom(i * 11 + 7) * 0.75) * volatility;
        const wickDown = (0.18 + pseudoRandom(i * 13 + 3) * 0.75) * volatility;

        const high = roundPrice(Math.max(open, close) + wickUp);
        const low = roundPrice(Math.min(open, close) - wickDown);

        candles.push({
            time: (startSec + i * intervalSec) as Time,
            open,
            high,
            low,
            close,
        });

        prevClose = close;
    }

    return { candles, entryIndex, exitIndex, precision };
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
    const chartRef = useRef<IChartApi | null>(null);

    const seriesBundle = useMemo(
        () =>
            generateCandlestickData(
                entryPrice,
                exitPrice,
                type,
                isWin,
                tradeId,
                entryDate,
                exitDate
            ),
        [entryPrice, exitPrice, type, isWin, tradeId, entryDate, exitDate]
    );

    useEffect(() => {
        const { candles: chartData, entryIndex, exitIndex, precision } =
            seriesBundle;
        if (!chartContainerRef.current || chartData.length === 0) return;

        const container = chartContainerRef.current;

        const candleLow = Math.min(...chartData.map((c) => c.low));
        const candleHigh = Math.max(...chartData.map((c) => c.high));
        const candleSpan = Math.max(
            candleHigh - candleLow,
            entryPrice * 0.0005,
            Math.pow(10, -precision)
        );

        let visualMin = candleLow;
        let visualMax = candleHigh;
        if (
            stopLoss &&
            Math.abs(stopLoss - entryPrice) <= candleSpan * 2.1
        ) {
            visualMin = Math.min(visualMin, stopLoss);
            visualMax = Math.max(visualMax, stopLoss);
        }
        if (
            takeProfit &&
            Math.abs(takeProfit - entryPrice) <= candleSpan * 2.1
        ) {
            visualMin = Math.min(visualMin, takeProfit);
            visualMax = Math.max(visualMax, takeProfit);
        }

        const chart = createChart(container, {
            width: container.clientWidth,
            height: container.clientHeight,
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "rgba(148, 163, 184, 0.6)",
                fontFamily: "'Inter', sans-serif",
                attributionLogo: false,
            },
            grid: {
                vertLines: { color: "rgba(148, 163, 184, 0.05)" },
                horzLines: { color: "rgba(148, 163, 184, 0.05)" },
            },
            rightPriceScale: {
                visible: false,
                scaleMargins: {
                    top: 0.22,
                    bottom: 0.2,
                },
            },
            timeScale: {
                visible: false,
                borderVisible: false,
                rightOffset: 1,
            },
            crosshair: {
                horzLine: { visible: false },
                vertLine: { visible: false },
            },
            handleScroll: false,
            handleScale: false,
        });

        chartRef.current = chart;

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: "#10B981",
            downColor: "#F43F5E",
            borderUpColor: "#059669",
            borderDownColor: "#E11D48",
            wickUpColor: "#10B981",
            wickDownColor: "#F43F5E",
            priceLineVisible: false,
            lastValueVisible: false,
            priceFormat: {
                type: "price",
                precision,
                minMove: Math.pow(10, -precision),
            },
            autoscaleInfoProvider: () => ({
                priceRange: {
                    minValue: visualMin,
                    maxValue: visualMax,
                },
            }),
        });

        candleSeries.setData(chartData);

        if (stopLoss) {
            candleSeries.createPriceLine({
                price: stopLoss,
                color: "rgba(244, 63, 94, 0.35)",
                lineWidth: 1,
                lineStyle: LineStyle.Dotted,
                axisLabelVisible: false,
                title: "SL",
            });
        }

        if (takeProfit) {
            candleSeries.createPriceLine({
                price: takeProfit,
                color: "rgba(16, 185, 129, 0.35)",
                lineWidth: 1,
                lineStyle: LineStyle.Dotted,
                axisLabelVisible: false,
                title: "TP",
            });
        }

        const positionPrimitive = new PositionBoxPrimitive({
            entryTime: chartData[entryIndex].time,
            exitTime: chartData[exitIndex].time,
            entryPrice,
            exitPrice,
            stopLoss,
            takeProfit,
            isWin,
        });
        candleSeries.attachPrimitive(positionPrimitive);

        chart.timeScale().fitContent();

        const resizeObserver = new ResizeObserver((entries) => {
            for (const e of entries) {
                const { width, height } = e.contentRect;
                chart.applyOptions({ width, height });
                chart.timeScale().fitContent();
            }
        });
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
            chartRef.current = null;
        };
    }, [
        seriesBundle,
        entryPrice,
        exitPrice,
        isWin,
        type,
        stopLoss,
        takeProfit,
    ]);

    return (
        <div
            ref={chartContainerRef}
            className={className}
            style={{ width: "100%", height: "100%" }}
        />
    );
}
