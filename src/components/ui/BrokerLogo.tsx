
"use client";

import { BROKERS } from "@/config/brokers";
import { cn } from "@/lib/utils";

interface BrokerLogoProps {
    broker: string; // Broker slug: "EXNESS", "VANTAGE", etc.
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

    if (!brokerConfig) {
        // Fallback for unknown brokers
        return (
            <div className={cn("flex items-center gap-2", className)}>
                <div
                    className="relative flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex items-center justify-center"
                    style={{ width: size, height: size }}
                >
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-300">
                        {broker.substring(0, 2)}
                    </span>
                </div>
                {showName && (
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {broker}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div
                className="relative flex-shrink-0 bg-white rounded-full overflow-hidden flex items-center justify-center p-1"
                style={{ width: size, height: size }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={brokerConfig.logo}
                    alt={brokerConfig.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
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
