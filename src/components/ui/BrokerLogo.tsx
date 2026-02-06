
"use client";

import Image from "next/image";
import { BROKERS, BrokerKey } from "@/config/brokers";
import { cn } from "@/lib/utils";

interface BrokerLogoProps {
    broker: BrokerKey; // "EXNESS" | "VANTAGE" | "VTMARKETS"
    size?: number;
    className?: string;
    showName?: boolean;
}

export function BrokerLogo({
    broker,
    size = 40,
    className,
    showName = false
}: BrokerLogoProps) {
    const brokerConfig = BROKERS[broker];

    if (!brokerConfig) return null;

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div
                className="relative flex-shrink-0 bg-white rounded-full overflow-hidden flex items-center justify-center p-1"
                style={{ width: size, height: size }}
            >
                {/* We use standard img tag or Next Image based on requirements. 
            Using standard img for simplicity if SVGs are in public folder,
            but Next Image is better for optimization. 
            However, for SVGs in public, simple img usually works fine and avoids layout quirks if size is dynamic.
        */}
                <img
                    src={brokerConfig.logo}
                    alt={brokerConfig.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                        // Fallback if image missing
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.style.backgroundColor = brokerConfig.color;
                        e.currentTarget.parentElement!.innerHTML = `<span class="text-xs font-bold text-white">${brokerConfig.name.substring(0, 1)}</span>`;
                    }}
                />
            </div>

            {showName && (
                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {brokerConfig.name}
                </span>
            )}
        </div>
    );
}
