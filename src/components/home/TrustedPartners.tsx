import { Building2, Shield, Server, Wrench } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import Link from "next/link";

interface PartnerItem {
  name: string;
  desc: string;
  badge?: string;
  badgeColor?: string;
  logo: string;
  logoBg: string;
  url?: string;
}

interface PartnerCategory {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  viewAllHref?: string;
  items: PartnerItem[];
}

const PARTNERS: PartnerCategory[] = [
  {
    title: "Best Forex Brokers",
    subtitle: "Regulated & Low Spreads",
    icon: Building2,
    iconBg: "bg-blue-100 dark:bg-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    viewAllHref: "/brokers",
    items: [
      { name: "Moneta Markets", desc: "Raw Spread Trading", badge: "Top Rated", badgeColor: "bg-amber-500 text-white", logo: "MM", logoBg: "bg-gradient-to-br from-red-500 to-red-600" },
      { name: "Exness", desc: "Instant Withdrawals", badge: "Popular", badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30", logo: "ex", logoBg: "bg-gradient-to-br from-amber-500 to-amber-600" },
      { name: "PlexyTrade", desc: "USA Traders Accepted", badge: "USA OK", badgeColor: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30", logo: "PT", logoBg: "bg-gradient-to-br from-teal-500 to-teal-600" },
    ],
  },
  {
    title: "Prop Trading Firms",
    subtitle: "Get Funded Up to $400K",
    icon: Shield,
    iconBg: "bg-orange-100 dark:bg-orange-500/20",
    iconColor: "text-orange-600 dark:text-orange-400",
    items: [
      { name: "FTMO", desc: "Up to $400K Funding", badge: "#1 Choice", badgeColor: "bg-amber-500 text-white", logo: "FT", logoBg: "bg-gradient-to-br from-blue-600 to-blue-700" },
      { name: "The5ers", desc: "Instant Funding Available", badge: "Popular", badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30", logo: "T5", logoBg: "bg-gradient-to-br from-green-500 to-green-600" },
      { name: "MyFundedFX", desc: "Low Targets • No Time Limit", badge: "USA OK", badgeColor: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30", logo: "MF", logoBg: "bg-gradient-to-br from-purple-500 to-purple-600" },
    ],
  },
  {
    title: "Forex VPS Hosting",
    subtitle: "24/7 EA Running",
    icon: Server,
    iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    items: [
      { name: "FXVM", desc: "From $0.99/mo • NY4 Location", badge: "Best", badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30", logo: "FX", logoBg: "bg-gradient-to-br from-slate-600 to-slate-700" },
      { name: "ForexVPS.net", desc: "Ultra-Low Latency", logo: "VPS", logoBg: "bg-gradient-to-br from-blue-500 to-blue-600" },
      { name: "AccuWeb Hosting", desc: "Budget Options", logo: "AW", logoBg: "bg-gradient-to-br from-indigo-500 to-indigo-600" },
    ],
  },
  {
    title: "Trading Tools",
    subtitle: "Analytics & Charting",
    icon: Wrench,
    iconBg: "bg-rose-100 dark:bg-rose-500/20",
    iconColor: "text-rose-600 dark:text-rose-400",
    items: [
      { name: "TradingView", desc: "Best Charting Platform", badge: "Pro", badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30", logo: "TV", logoBg: "bg-gradient-to-br from-blue-500 to-indigo-600" },
      { name: "Myfxbook", desc: "Trade Analysis & Tracking", badge: "Popular", badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30", logo: "Mx", logoBg: "bg-gradient-to-br from-green-600 to-green-700" },
      { name: "FX Blue", desc: "Free EA Analytics", logo: "FB", logoBg: "bg-gradient-to-br from-sky-500 to-sky-600" },
    ],
  },
];

export function TrustedPartners() {
  return (
    <section className="py-16 relative overflow-hidden border-t border-emerald-100 dark:border-white/10 bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-cyan-50/60 dark:from-[#0B1A15] dark:via-[#0F1117] dark:to-[#0B1520]">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,200,136,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,200,136,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(0,200,136,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,200,136,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
            Trusted Partners & Resources
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-base">
            Services we recommend to our community
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PARTNERS.map((cat, catIdx) => (
            <FadeIn key={catIdx} delay={catIdx * 0.1} direction="up">
              <div className="bg-white dark:bg-white/[0.04] backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-5 hover:border-gray-300 dark:hover:border-white/20 hover:shadow-lg dark:hover:shadow-none transition-all duration-300">
                {/* Category Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${cat.iconBg} ${cat.iconColor} flex items-center justify-center`}>
                      <cat.icon size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">{cat.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{cat.subtitle}</p>
                    </div>
                  </div>
                  {cat.viewAllHref && (
                    <Link
                      href={cat.viewAllHref}
                      className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                    >
                      View All →
                    </Link>
                  )}
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {cat.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] hover:bg-gray-100 dark:hover:bg-white/[0.07] border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 transition-all duration-200 group cursor-pointer"
                    >
                      <div className={`w-9 h-9 rounded-lg ${item.logoBg} flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-lg`}>
                        {item.logo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{item.desc}</p>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
