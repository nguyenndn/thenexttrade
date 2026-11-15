import { cn } from "@/lib/utils";

interface CurrencyFlagProps {
    code: string;
    size?: "sm" | "md";
    className?: string;
}

function renderFlagSvg(code: string) {
    switch (code.toUpperCase()) {
        case "USD":
            return (
                <svg viewBox="0 0 24 16" className="w-full h-full" aria-hidden="true">
                    <rect width="24" height="16" fill="#B22234" />
                    <rect y="2.3" width="24" height="2.3" fill="#FFFFFF" />
                    <rect y="6.9" width="24" height="2.3" fill="#FFFFFF" />
                    <rect y="11.5" width="24" height="2.3" fill="#FFFFFF" />
                    <rect width="10.5" height="9.2" fill="#3C3B6E" />
                    <circle cx="3" cy="2.6" r="0.8" fill="#FFFFFF" />
                    <circle cx="5.4" cy="2.6" r="0.8" fill="#FFFFFF" />
                    <circle cx="7.8" cy="2.6" r="0.8" fill="#FFFFFF" />
                    <circle cx="4.2" cy="4.6" r="0.8" fill="#FFFFFF" />
                    <circle cx="6.6" cy="4.6" r="0.8" fill="#FFFFFF" />
                    <circle cx="3" cy="6.6" r="0.8" fill="#FFFFFF" />
                    <circle cx="5.4" cy="6.6" r="0.8" fill="#FFFFFF" />
                    <circle cx="7.8" cy="6.6" r="0.8" fill="#FFFFFF" />
                </svg>
            );
        case "EUR":
            return (
                <svg viewBox="0 0 24 16" className="w-full h-full" aria-hidden="true">
                    <rect width="24" height="16" fill="#003399" />
                    <circle cx="12" cy="8" r="4.6" fill="none" stroke="#FFCC00" strokeWidth="1.4" strokeDasharray="1.3 1.1" />
                </svg>
            );
        case "GBP":
            return (
                <svg viewBox="0 0 24 16" className="w-full h-full" aria-hidden="true">
                    <rect width="24" height="16" fill="#012169" />
                    <path d="M0 0L24 16M24 0L0 16" stroke="#FFFFFF" strokeWidth="3.2" />
                    <path d="M0 0L24 16M24 0L0 16" stroke="#C8102E" strokeWidth="1.6" />
                    <path d="M12 0V16M0 8H24" stroke="#FFFFFF" strokeWidth="4.8" />
                    <path d="M12 0V16M0 8H24" stroke="#C8102E" strokeWidth="2.8" />
                </svg>
            );
        case "JPY":
            return (
                <svg viewBox="0 0 24 16" className="w-full h-full" aria-hidden="true">
                    <rect width="24" height="16" fill="#FFFFFF" />
                    <circle cx="12" cy="8" r="4.2" fill="#BC002D" />
                </svg>
            );
        case "CHF":
            return (
                <svg viewBox="0 0 24 16" className="w-full h-full" aria-hidden="true">
                    <rect width="24" height="16" fill="#D52B1E" />
                    <rect x="10.4" y="3.2" width="3.2" height="9.6" fill="#FFFFFF" />
                    <rect x="7.2" y="6.4" width="9.6" height="3.2" fill="#FFFFFF" />
                </svg>
            );
        case "AUD":
            return (
                <svg viewBox="0 0 24 16" className="w-full h-full" aria-hidden="true">
                    <rect width="24" height="16" fill="#00008B" />
                    <path d="M0 0L11 7.5M11 0L0 7.5" stroke="#FFFFFF" strokeWidth="1.8" />
                    <path d="M5.5 0V7.5M0 3.75H11" stroke="#FFFFFF" strokeWidth="2.4" />
                    <path d="M5.5 0V7.5M0 3.75H11" stroke="#C8102E" strokeWidth="1.3" />
                    <circle cx="5.5" cy="12" r="1.5" fill="#FFFFFF" />
                    <circle cx="18" cy="4" r="1" fill="#FFFFFF" />
                    <circle cx="15.5" cy="7.5" r="1" fill="#FFFFFF" />
                    <circle cx="20" cy="8" r="1" fill="#FFFFFF" />
                    <circle cx="18" cy="12.2" r="1.1" fill="#FFFFFF" />
                </svg>
            );
        case "CAD":
            return (
                <svg viewBox="0 0 24 16" className="w-full h-full" aria-hidden="true">
                    <rect width="24" height="16" fill="#FFFFFF" />
                    <rect width="6" height="16" fill="#FF0000" />
                    <rect x="18" width="6" height="16" fill="#FF0000" />
                    <path d="M12 3.5L13.6 7H15.5L13.8 9.2L14.4 11.5L12 10.2L9.6 11.5L10.2 9.2L8.5 7H10.4L12 3.5Z" fill="#FF0000" />
                </svg>
            );
        case "NZD":
            return (
                <svg viewBox="0 0 24 16" className="w-full h-full" aria-hidden="true">
                    <rect width="24" height="16" fill="#00247D" />
                    <path d="M0 0L11 7.5M11 0L0 7.5" stroke="#FFFFFF" strokeWidth="1.8" />
                    <path d="M5.5 0V7.5M0 3.75H11" stroke="#FFFFFF" strokeWidth="2.4" />
                    <path d="M5.5 0V7.5M0 3.75H11" stroke="#CC142B" strokeWidth="1.3" />
                    <circle cx="18" cy="4" r="1.1" fill="#CC142B" stroke="#FFFFFF" strokeWidth="0.5" />
                    <circle cx="15.5" cy="7.8" r="1.1" fill="#CC142B" stroke="#FFFFFF" strokeWidth="0.5" />
                    <circle cx="20.2" cy="8" r="1.1" fill="#CC142B" stroke="#FFFFFF" strokeWidth="0.5" />
                    <circle cx="18" cy="12.2" r="1.1" fill="#CC142B" stroke="#FFFFFF" strokeWidth="0.5" />
                </svg>
            );
        case "SGD":
            return (
                <svg viewBox="0 0 24 16" className="w-full h-full" aria-hidden="true">
                    <rect width="24" height="8" fill="#EF3340" />
                    <rect y="8" width="24" height="8" fill="#FFFFFF" />
                    <circle cx="5.8" cy="4" r="2.5" fill="#FFFFFF" />
                    <circle cx="6.8" cy="4" r="2.2" fill="#EF3340" />
                </svg>
            );
        case "HKD":
            return (
                <svg viewBox="0 0 24 16" className="w-full h-full" aria-hidden="true">
                    <rect width="24" height="16" fill="#DE2910" />
                    <circle cx="12" cy="8" r="3.6" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeDasharray="3.2 1.3" />
                </svg>
            );
        case "SEK":
            return (
                <svg viewBox="0 0 24 16" className="w-full h-full" aria-hidden="true">
                    <rect width="24" height="16" fill="#006AA7" />
                    <rect x="7" width="3" height="16" fill="#FECC02" />
                    <rect y="6.5" width="24" height="3" fill="#FECC02" />
                </svg>
            );
        case "NOK":
            return (
                <svg viewBox="0 0 24 16" className="w-full h-full" aria-hidden="true">
                    <rect width="24" height="16" fill="#BA0C2F" />
                    <rect x="6.5" width="4" height="16" fill="#FFFFFF" />
                    <rect y="6" width="24" height="4" fill="#FFFFFF" />
                    <rect x="7.5" width="2" height="16" fill="#00205B" />
                    <rect y="7" width="24" height="2" fill="#00205B" />
                </svg>
            );
        case "DKK":
            return (
                <svg viewBox="0 0 24 16" className="w-full h-full" aria-hidden="true">
                    <rect width="24" height="16" fill="#C8102E" />
                    <rect x="7" width="2.8" height="16" fill="#FFFFFF" />
                    <rect y="6.6" width="24" height="2.8" fill="#FFFFFF" />
                </svg>
            );
        case "PLN":
            return (
                <svg viewBox="0 0 24 16" className="w-full h-full" aria-hidden="true">
                    <rect width="24" height="8" fill="#FFFFFF" />
                    <rect y="8" width="24" height="8" fill="#DC143C" />
                </svg>
            );
        case "TRY":
            return (
                <svg viewBox="0 0 24 16" className="w-full h-full" aria-hidden="true">
                    <rect width="24" height="16" fill="#E30A17" />
                    <circle cx="9.5" cy="8" r="3.8" fill="#FFFFFF" />
                    <circle cx="10.6" cy="8" r="3" fill="#E30A17" />
                    <circle cx="14.5" cy="8" r="1.3" fill="#FFFFFF" />
                </svg>
            );
        case "MXN":
            return (
                <svg viewBox="0 0 24 16" className="w-full h-full" aria-hidden="true">
                    <rect width="8" height="16" fill="#006847" />
                    <rect x="8" width="8" height="16" fill="#FFFFFF" />
                    <rect x="16" width="8" height="16" fill="#CE1126" />
                    <circle cx="12" cy="8" r="1.8" fill="#8C6239" />
                </svg>
            );
        case "ZAR":
            return (
                <svg viewBox="0 0 24 16" className="w-full h-full" aria-hidden="true">
                    <rect width="24" height="8" fill="#E03C31" />
                    <rect y="8" width="24" height="8" fill="#001489" />
                    <path d="M0 0L11 8L0 16V0Z" fill="#000000" />
                    <path d="M0 2L8.5 8L0 14" fill="none" stroke="#FFB81C" strokeWidth="1.6" />
                    <path d="M0 0L10.5 8L0 16M10.5 8H24" fill="none" stroke="#007749" strokeWidth="3.4" />
                </svg>
            );
        case "BRL":
            return (
                <svg viewBox="0 0 24 16" className="w-full h-full" aria-hidden="true">
                    <rect width="24" height="16" fill="#009739" />
                    <polygon points="12,2 21,8 12,14 3,8" fill="#FEDD00" />
                    <circle cx="12" cy="8" r="3.2" fill="#012169" />
                </svg>
            );
        case "CNH":
        case "CNY":
            return (
                <svg viewBox="0 0 24 16" className="w-full h-full" aria-hidden="true">
                    <rect width="24" height="16" fill="#EE1C25" />
                    <circle cx="5.5" cy="5" r="2.2" fill="#FFFF00" />
                    <circle cx="9.8" cy="2.8" r="0.8" fill="#FFFF00" />
                    <circle cx="11.2" cy="4.6" r="0.8" fill="#FFFF00" />
                    <circle cx="11.0" cy="6.8" r="0.8" fill="#FFFF00" />
                    <circle cx="9.5" cy="8.4" r="0.8" fill="#FFFF00" />
                </svg>
            );
        case "INR":
            return (
                <svg viewBox="0 0 24 16" className="w-full h-full" aria-hidden="true">
                    <rect width="24" height="5.33" fill="#FF9933" />
                    <rect y="5.33" width="24" height="5.34" fill="#FFFFFF" />
                    <rect y="10.67" width="24" height="5.33" fill="#138808" />
                    <circle cx="12" cy="8" r="1.9" fill="none" stroke="#000080" strokeWidth="1" />
                </svg>
            );
        case "KRW":
            return (
                <svg viewBox="0 0 24 16" className="w-full h-full" aria-hidden="true">
                    <rect width="24" height="16" fill="#FFFFFF" />
                    <path d="M12 4.5A3.5 3.5 0 0 1 15.5 8H8.5A3.5 3.5 0 0 1 12 4.5Z" fill="#CD2E3A" />
                    <path d="M8.5 8H15.5A3.5 3.5 0 0 1 12 11.5A3.5 3.5 0 0 1 8.5 8Z" fill="#0047A0" />
                </svg>
            );
        default:
            return null;
    }
}

export function CurrencyFlag({ code, size = "md", className }: CurrencyFlagProps) {
    const cleanCode = code.trim().toUpperCase();
    const svg = renderFlagSvg(cleanCode);
    const dimensions = size === "sm" ? "w-5 h-3.5 text-[8px]" : "w-6 h-4 text-[9px]";

    if (!svg) {
        return (
            <span
                className={cn(
                    "inline-flex items-center justify-center rounded-[3px] bg-gray-200 dark:bg-white/10 font-mono font-bold text-gray-700 dark:text-gray-200 shrink-0",
                    dimensions,
                    className
                )}
            >
                {cleanCode.slice(0, 3)}
            </span>
        );
    }

    return (
        <span
            className={cn(
                "inline-flex overflow-hidden rounded-[3px] border border-black/10 dark:border-white/15 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
                dimensions,
                className
            )}
        >
            {svg}
        </span>
    );
}
