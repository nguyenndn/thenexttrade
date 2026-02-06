import { EconomicEvent, ImpactLevel } from "@prisma/client";
import { format } from "date-fns";

interface EventRowProps {
    event: EconomicEvent;
    timezone?: string;
}

export function EventRow({ event, timezone = "Asia/Bangkok" }: EventRowProps) {
    const impactColors = {
        [ImpactLevel.HIGH]: "bg-red-500 text-white",
        [ImpactLevel.MEDIUM]: "bg-orange-500 text-white",
        [ImpactLevel.LOW]: "bg-yellow-500 text-white",
    };

    const roundedImpact = {
        [ImpactLevel.HIGH]: "High",
        [ImpactLevel.MEDIUM]: "Medium",
        [ImpactLevel.LOW]: "Low",
    };

    // Format time based on timezone
    const formatTime = (dateStr: Date | string) => {
        try {
            return new Intl.DateTimeFormat("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: timezone,
                hour12: false
            }).format(new Date(dateStr));
        } catch (e) {
            return format(new Date(dateStr), "HH:mm");
        }
    };

    return (
        <div className="grid grid-cols-12 gap-2 md:gap-4 py-3 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors items-center px-4 group">
            <div className="col-span-2 md:col-span-1 text-sm font-bold text-gray-500 dark:text-gray-400">
                {formatTime(event.date)}
            </div>

            <div className="col-span-2 md:col-span-1 flex justify-center">
                <span className="font-bold text-gray-900 dark:text-white px-2 py-1 bg-gray-100 dark:bg-white/10 rounded-md text-xs w-12 text-center">
                    {event.currency}
                </span>
            </div>

            <div className="col-span-2 md:col-span-1 flex justify-center">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide w-16 text-center ${impactColors[event.impact]}`}>
                    {roundedImpact[event.impact]}
                </span>
            </div>

            <div className="col-span-6 md:col-span-5">
                <p className="font-semibold text-gray-900 dark:text-white text-sm md:text-sm line-clamp-1 group-hover:text-cyan-500 transition-colors cursor-pointer" title={event.title}>
                    {event.title}
                </p>
            </div>

            <div className="hidden md:block col-span-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        {event.forecast || "--"}
                    </div>
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        {event.previous || "--"}
                    </div>
                </div>
            </div>
        </div>
    );
}

