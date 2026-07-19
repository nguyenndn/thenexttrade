import { Server, ExternalLink, Check } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import Image from "next/image";
import partnersData from "@/config/partners.json";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";

const BADGE_STYLES: Record<string, string> = {
    gold: "bg-amber-500 text-white shadow-sm",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30",
    blue: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30",
};

interface VPSItem {
    name: string;
    desc: string;
    badge: string | null;
    badgeType: string | null;
    logo: string | null;
    initials: string;
    color: string;
    url: string | null;
    rating: number;
    minDeposit: string;
    features: string[];
    active?: boolean;
}

export function TrustedPartners() {
    const vpsItems: VPSItem[] = (partnersData.vps.items as VPSItem[]).filter(
        (item) => item.active !== false
    );

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-50/50 via-white to-slate-50/50 dark:from-transparent dark:via-transparent dark:to-transparent border-t border-dashboard/60">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,200,136,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,200,136,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px]" />

            <section className="py-6 sm:py-8 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <HomeSectionHeading
                    align="center"
                    eyebrow="Trading Infrastructure"
                    title="Recommended Forex VPS"
                    highlight="VPS"
                    description="Highly reliable virtual private servers to run your trading EAs 24/7 with ultra-low latency."
                    icon={Server}
                    className="mb-10"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {vpsItems.map((item, idx) => (
                        <FadeIn
                            key={item.name}
                            delay={idx * 0.05}
                            direction="up"
                        >
                            <a
                                href={
                                    item.url && item.url !== "#"
                                        ? item.url
                                        : undefined
                                }
                                target={
                                    item.url && item.url !== "#"
                                        ? "_blank"
                                        : undefined
                                }
                                rel={
                                    item.url && item.url !== "#"
                                        ? "noopener noreferrer"
                                        : undefined
                                }
                                className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/5 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 hover:shadow-lg transition-all duration-300 group cursor-pointer h-full"
                            >
                                <div>
                                    {/* Top line with Logo & Badge */}
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-white border border-dashboard dark:border-white/10 flex items-center justify-center overflow-hidden shadow-sm p-1">
                                            {item.logo ? (
                                                <Image
                                                    src={item.logo}
                                                    alt={item.name}
                                                    width={48}
                                                    height={48}
                                                    className="object-contain w-full h-full"
                                                />
                                            ) : (
                                                <span className="text-gray-700 dark:text-white text-sm font-black">
                                                    {item.initials}
                                                </span>
                                            )}
                                        </div>
                                        {item.badge && (
                                            <span
                                                className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${BADGE_STYLES[item.badgeType || "green"]}`}
                                            >
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>

                                    {/* Name & Desc */}
                                    <h4 className="text-base font-extrabold text-gray-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                                        {item.name}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                                        {item.desc}
                                    </p>

                                    {/* Key metrics / price */}
                                    <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.04] text-[10px] font-bold text-gray-700 dark:text-gray-300 font-mono">
                                        {item.minDeposit}
                                    </div>

                                    {/* Features checklist */}
                                    <ul className="mt-4 space-y-1 text-xs text-gray-600 dark:text-gray-400 font-medium border-t border-slate-100 dark:border-white/5 pt-3">
                                        {item.features
                                            .slice(0, 2)
                                            .map((feat, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-center gap-1.5 truncate"
                                                >
                                                    <Check
                                                        size={12}
                                                        className="text-emerald-500 flex-shrink-0"
                                                    />
                                                    <span className="truncate">
                                                        {feat}
                                                    </span>
                                                </li>
                                            ))}
                                    </ul>
                                </div>

                                {/* Bottom link */}
                                <div className="mt-5 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 group-hover:underline">
                                    Get Hosting <ExternalLink size={10} />
                                </div>
                            </a>
                        </FadeIn>
                    ))}
                </div>
            </section>
        </div>
    );
}
