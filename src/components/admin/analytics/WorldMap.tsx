"use client";

import { memo, useState } from "react";
import {
    ComposableMap,
    Geographies,
    Geography,
    ZoomableGroup,
} from "react-simple-maps";

const GEO_URL =
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ISO 3166-1 numeric → alpha-2 mapping for top countries
const NUMERIC_TO_ALPHA2: Record<string, string> = {
    "840": "US",
    "826": "GB",
    "704": "VN",
    "276": "DE",
    "250": "FR",
    "392": "JP",
    "410": "KR",
    "702": "SG",
    "036": "AU",
    "124": "CA",
    "356": "IN",
    "764": "TH",
    "458": "MY",
    "360": "ID",
    "608": "PH",
    "076": "BR",
    "380": "IT",
    "724": "ES",
    "528": "NL",
    "752": "SE",
    "756": "CH",
    "616": "PL",
    "643": "RU",
    "784": "AE",
    "566": "NG",
    "710": "ZA",
    "484": "MX",
    "792": "TR",
    "818": "EG",
    "682": "SA",
    "156": "CN",
    "344": "HK",
    "158": "TW",
    "554": "NZ",
    "578": "NO",
    "246": "FI",
    "203": "CZ",
    "040": "AT",
    "056": "BE",
    "620": "PT",
    "208": "DK",
    "372": "IE",
    "032": "AR",
    "152": "CL",
    "170": "CO",
    "604": "PE",
    "804": "UA",
    "348": "HU",
    "642": "RO",
    "100": "BG",
};

interface Props {
    countries: Array<{ country: string; views: number }>;
}

function WorldMapInner({ countries }: Props) {
    const [tooltip, setTooltip] = useState<{
        name: string;
        views: number;
        x: number;
        y: number;
    } | null>(null);

    // Build lookup: alpha2 → views
    const viewMap = new Map<string, number>();
    countries.forEach((c) => viewMap.set(c.country, c.views));

    const maxViews = countries[0]?.views ?? 1;

    // Color scale: transparent → primary blue
    function getColor(alpha2: string): string {
        const views = viewMap.get(alpha2);
        if (!views) return "rgba(255,255,255,0.03)";
        const intensity = Math.min(views / maxViews, 1);
        const alpha = 0.15 + intensity * 0.7;
        return `rgba(99, 102, 241, ${alpha})`; // indigo-500
    }

    return (
        <div
            className="relative w-full"
            style={{ aspectRatio: "2/1", maxHeight: 260 }}
        >
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 120, center: [0, 30] }}
                width={800}
                height={400}
                style={{ width: "100%", height: "100%" }}
            >
                <ZoomableGroup>
                    <Geographies geography={GEO_URL}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const numericId = geo.id;
                                const alpha2 =
                                    NUMERIC_TO_ALPHA2[numericId] || "";
                                const views = viewMap.get(alpha2) || 0;

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={getColor(alpha2)}
                                        stroke="rgba(255,255,255,0.08)"
                                        strokeWidth={0.5}
                                        onMouseEnter={(e) => {
                                            const name =
                                                geo.properties.name || alpha2;
                                            if (views > 0) {
                                                setTooltip({
                                                    name,
                                                    views,
                                                    x: e.clientX,
                                                    y: e.clientY,
                                                });
                                            }
                                        }}
                                        onMouseLeave={() => setTooltip(null)}
                                        style={{
                                            default: {
                                                outline: "none",
                                                cursor:
                                                    views > 0
                                                        ? "pointer"
                                                        : "default",
                                            },
                                            hover: {
                                                fill:
                                                    views > 0
                                                        ? "rgba(99, 102, 241, 0.9)"
                                                        : "rgba(255,255,255,0.06)",
                                                outline: "none",
                                            },
                                            pressed: { outline: "none" },
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="fixed z-50 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-lg pointer-events-none"
                    style={{ left: tooltip.x + 10, top: tooltip.y - 30 }}
                >
                    <span className="font-semibold">{tooltip.name}</span>
                    <span className="text-gray-300 ml-2">
                        {tooltip.views.toLocaleString()} views
                    </span>
                </div>
            )}
        </div>
    );
}

export const WorldMap = memo(WorldMapInner);
