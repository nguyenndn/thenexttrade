import Link from "next/link";
import {
    ArrowRight,
    CheckCircle2,
    KeyRound,
    Link2,
    Unlock,
    type LucideIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

interface UnlockStep {
    step: string;
    icon: LucideIcon;
    title: string;
    desc: string;
}

const UNLOCK_STEPS: UnlockStep[] = [
    {
        step: "01",
        icon: KeyRound,
        title: "Create a free account",
        desc: "Sign up and open your dashboard, with the Academy, all 17 risk calculators and a Demo/Live trial included.",
    },
    {
        step: "02",
        icon: Link2,
        title: "Register under our partner broker",
        desc: "Open an MT5 account with Exness, Vantage, VT Markets or Ultima Markets through our partner (IB) link, so the account can be verified for EA access.",
    },
    {
        step: "03",
        icon: Unlock,
        title: "Unlock automatically",
        desc: "Once the partner account is verified, your EA license keys and download links activate in the dashboard. No software fee, no renewal.",
    },
];

const TRUST_NOTES = [
    "Your capital stays 100% in your own broker account",
    "We never hold funds or have withdrawal access",
];

export function HowUnlockWorks() {
    return (
        <section id="how-unlock-works" className="mb-14 scroll-mt-24">
            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#111318]/50 p-6 sm:p-10 shadow-lg backdrop-blur-sm">
                <div className="mb-8 max-w-2xl space-y-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-gold">
                        <Unlock size={12} />
                        Unlock Model
                    </span>
                    <h2 className="font-heading text-2xl sm:text-3xl font-black text-gray-900 dark:text-white leading-tight">
                        How Unlock Works
                    </h2>
                    <p className="text-xs sm:text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-400">
                        Three steps from sign-up to a live license. There is no
                        subscription — your capital stays at your own broker,
                        and the required balance for each system is listed on
                        its detail page.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {UNLOCK_STEPS.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={item.step}
                                className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.02] p-5 shadow-sm transition-all duration-300 hover:border-gold/30 hover:shadow-md"
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/20 bg-gold/10 text-gold">
                                        <Icon size={16} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-2xl font-black text-gold/20">
                                        {item.step}
                                    </span>
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white leading-tight">
                                    {item.title}
                                </h3>
                                <p className="mt-2 text-[11px] font-medium leading-relaxed text-gray-500 dark:text-gray-400">
                                    {item.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 flex flex-col gap-4 border-t border-dashed border-gray-200 dark:border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <ul className="space-y-2">
                        {TRUST_NOTES.map((note) => (
                            <li
                                key={note}
                                className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300"
                            >
                                <CheckCircle2
                                    size={14}
                                    className="shrink-0 text-emerald-500"
                                />
                                <span>{note}</span>
                            </li>
                        ))}
                    </ul>

                    <Link
                        href="/brokers"
                        className={cn(
                            buttonVariants({ variant: "outline" }),
                            "inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-black uppercase tracking-wider"
                        )}
                    >
                        View Supported Brokers
                        <ArrowRight size={14} className="text-gold" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
