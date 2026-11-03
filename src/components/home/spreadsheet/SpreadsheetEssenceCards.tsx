import {
    PlugZap,
    Brain,
    BookOpenCheck,
    Target,
    type LucideIcon,
} from "lucide-react";

interface EssenceCard {
    icon: LucideIcon;
    label: string;
    copy: string;
    hoverAnim: string;
}

const essenceCards: EssenceCard[] = [
    {
        icon: PlugZap,
        label: "Zero Manual Entry",
        copy: "Live MT5 EA streams entries, exits, and slippage automatically. No manual CSV exports or ticket copy-pasting.",
        hoverAnim: "group-hover:-translate-y-1",
    },
    {
        icon: Brain,
        label: "Tilt & Leak Radar",
        copy: "Catch the exact moment you revenge-trade, move your stop-loss, or over-leverage.",
        hoverAnim: "group-hover:scale-110",
    },
    {
        icon: BookOpenCheck,
        label: "Playbook Studio",
        copy: "Targeted playbooks mapped to your live execution leaks: news spikes, widened stop-losses, and premature exits.",
        hoverAnim: "group-hover:rotate-6",
    },
    {
        icon: Target,
        label: "10-Trade Sprints",
        copy: "Leave every review with one clear execution rule to follow for your next 10 trades.",
        hoverAnim: "group-hover:scale-110",
    },
];

export function SpreadsheetEssenceCards() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {essenceCards.map((card) => {
                const Icon = card.icon;

                return (
                    <div
                        key={card.label}
                        className="group rounded-xl border border-gold/20 bg-white/80 dark:bg-[#0D111C] p-5 shadow-sm flex flex-col items-center text-center transition-all duration-300 hover:border-gold/50 hover:shadow-md"
                    >
                        <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10 text-gold border border-gold/25 shadow-sm group-hover:bg-gold/15 group-hover:shadow-[0_0_18px_rgba(245,158,11,0.28)] transition-all duration-300">
                            <div className={`flex items-center justify-center transition-transform duration-300 ${card.hoverAnim}`}>
                                <Icon size={22} strokeWidth={2.2} />
                            </div>
                        </div>
                        <h3 className="text-sm font-black text-gray-900 dark:text-white text-center">
                            {card.label}
                        </h3>
                        <p className="mt-1.5 text-xs font-medium leading-relaxed text-gray-600 dark:text-gray-400 text-center">
                            {card.copy}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}
