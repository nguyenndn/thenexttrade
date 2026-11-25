"use client";

import { useId } from "react";
import type { PlaybookSchematicType } from "@/lib/strategies/playbook-presets";
import { cn } from "@/lib/utils";
import { SCHEMATIC_SCENES } from "./schematic-scenes";
import { SchematicSvgCanvas } from "./SchematicSvgPrimitives";

interface PlaybookSchematicSvgProps {
    type: PlaybookSchematicType;
    accentColor?: string;
    className?: string;
}

export function PlaybookSchematicSvg({
    type,
    accentColor = "#F59E0B",
    className = "",
}: PlaybookSchematicSvgProps) {
    const uid = useId().replace(/:/g, "");
    const scene = SCHEMATIC_SCENES[type] ?? SCHEMATIC_SCENES["break-retest"];
    const isLong = scene.direction === "LONG";

    return (
        <div
            className={cn(
                "relative w-full rounded-lg overflow-hidden flex flex-col select-none",
                "bg-white dark:bg-[#131722] border border-[#E0E3EB] dark:border-[#2A2E39]",
                "[--tv-canvas:#FFFFFF] dark:[--tv-canvas:#131722]",
                "[--tv-grid:rgba(42,46,57,0.06)] dark:[--tv-grid:rgba(240,243,250,0.055)]",
                "[--tv-axis:#E0E3EB] dark:[--tv-axis:#2A2E39]",
                "[--tv-band:rgba(245,158,11,0.06)] dark:[--tv-band:rgba(245,158,11,0.07)]",
                className
            )}
        >
            {/* Authentic TradingView Top Instrument Legend Bar */}
            <div className="h-6 px-2.5 shrink-0 flex items-center justify-between gap-2 bg-white dark:bg-[#131722] border-b border-[#E0E3EB] dark:border-[#2A2E39]">
                <div className="flex items-center gap-1.5 min-w-0 font-mono">
                    <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: isLong ? "#089981" : "#F23645" }}
                    />
                    <span className="text-[10px] font-bold tracking-tight text-[#131722] dark:text-[#D1D4DC]">
                        {scene.symbol}
                    </span>
                    <span className="text-[9px] font-semibold text-[#787B86]">
                        · {scene.timeframe}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 font-mono tabular-nums">
                    <span
                        className={cn(
                            "text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-[3px] leading-none",
                            isLong
                                ? "bg-[#089981]/12 text-[#089981]"
                                : "bg-[#F23645]/12 text-[#F23645]"
                        )}
                    >
                        {scene.direction}
                    </span>
                    <span className="text-[9px] font-bold text-[#787B86]">
                        1:{scene.rrLabel.replace("R", "")}
                    </span>
                </div>
            </div>

            {/* High-DPI 42-Candle TradingView Chart Canvas */}
            <SchematicSvgCanvas
                scene={scene}
                accentColor={accentColor}
                gridId={`tv-grid-${type}-${uid}`}
            />
        </div>
    );
}
