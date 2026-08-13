"use client";

import { useEffect, useRef, memo } from "react";

interface TradingViewChartProps {
    theme?: "light" | "dark";
    className?: string;
}

function TradingViewChartInner({
    theme = "dark",
    className = "",
}: TradingViewChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.innerHTML = "";

        const widgetDiv = document.createElement("div");
        widgetDiv.className = "tradingview-widget-container__widget";
        widgetDiv.style.height = "calc(100% - 32px)";
        widgetDiv.style.width = "100%";

        const script = document.createElement("script");
        script.src =
            "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        script.textContent = JSON.stringify({
            autosize: true,
            symbol: "OANDA:XAUUSD",
            interval: "60",
            timezone: "Asia/Ho_Chi_Minh",
            theme: theme,
            style: "1",
            locale: "en",
            allow_symbol_change: true,
            hide_top_toolbar: false,
            hide_side_toolbar: false,
            hide_volume: true,
            hide_legend: true,
            calendar: false,
            support_host: "https://www.tradingview.com",
        });

        container.appendChild(widgetDiv);
        container.appendChild(script);

        return () => {
            container.innerHTML = "";
        };
    }, [theme]);

    return (
        <div
            ref={containerRef}
            className={`tradingview-widget-container w-full h-full min-h-[400px] ${className}`}
            style={{ height: "100%", width: "100%" }}
        />
    );
}

export const TradingViewChart = memo(TradingViewChartInner);
