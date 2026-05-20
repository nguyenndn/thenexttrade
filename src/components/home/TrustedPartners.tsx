import { Building2, Server, Bitcoin, ExternalLink } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import Link from "next/link";
import Image from "next/image";
import partnersData from "@/config/partners.json";

const BADGE_STYLES: Record<string, string> = {
  gold: "bg-amber-500 text-white shadow-sm",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30",
  blue: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30",
};

interface CategoryConfig {
  title: string;
  accentTitle?: string;
  subtitle: string;
  viewAllHref?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  accentColor: string;
  borderGradient: string;
  hoverBorder: string;
  hoverText: string;
  visitStyle: string;
  items: {
    name: string;
    desc: string;
    badge: string | null;
    badgeType: string | null;
    logo: string | null;
    initials: string;
    color: string;
    url: string | null;
  }[];
}

const SECTIONS: CategoryConfig[] = [
  {
    ...partnersData.brokers,
    title: "Best Forex",
    accentTitle: "Brokers",
    subtitle: "Regulated & Low Spreads",
    icon: Building2,
    iconBg: "bg-blue-100 dark:bg-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    accentColor: "text-blue-600 dark:text-blue-400",
    borderGradient: "from-blue-400 via-cyan-400 to-emerald-400",
    hoverBorder: "hover:border-blue-300 dark:hover:border-blue-500/30",
    hoverText: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
    visitStyle: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-400/10 border-blue-200 dark:border-blue-400/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-400/20",
  },
  {
    ...partnersData.cryptoExchanges,
    title: "Crypto",
    accentTitle: "Exchanges",
    subtitle: "Trade 600+ Cryptocurrencies",
    viewAllHref: "/brokers?tab=cryptoExchanges",
    icon: Bitcoin,
    iconBg: "bg-amber-100 dark:bg-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    accentColor: "text-amber-600 dark:text-amber-400",
    borderGradient: "from-amber-400 via-orange-400 to-rose-400",
    hoverBorder: "hover:border-amber-300 dark:hover:border-amber-500/30",
    hoverText: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
    visitStyle: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 border-amber-200 dark:border-amber-400/20 group-hover:bg-amber-100 dark:group-hover:bg-amber-400/20",
  },
  {
    ...partnersData.vps,
    title: "Trading",
    accentTitle: "Infrastructure",
    subtitle: "Tools we run alongside the brokers above",
    icon: Server,
    iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    accentColor: "text-emerald-600 dark:text-emerald-400",
    borderGradient: "from-emerald-400 via-teal-400 to-cyan-400",
    hoverBorder: "hover:border-emerald-300 dark:hover:border-emerald-500/30",
    hoverText: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
    visitStyle: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-400/20 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-400/20",
  },
];

export function TrustedPartners() {
  return (
    <section className="py-16 relative overflow-hidden border-y-2 border-amber-300 dark:border-amber-500/40 bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-cyan-50/60 dark:from-[#0B1A15] dark:via-[#0F1117] dark:to-[#0B1520]">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,200,136,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,200,136,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(0,200,136,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,200,136,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-700 dark:text-white mb-3 tracking-tight">
            Trusted Partners
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-base">
            Services we use and trust
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {SECTIONS.map((section, sectionIdx) => (
            <FadeIn key={sectionIdx} delay={sectionIdx * 0.1} direction="up">
              {/* Card with gradient top border */}
              <div className="relative rounded-2xl overflow-hidden shadow-lg dark:shadow-none">
                {/* Gradient top border */}
                <div className={`h-1 bg-gradient-to-r ${section.borderGradient}`} />

                <div className="bg-white dark:bg-[#1a1f2e] p-4 sm:p-5">
                  {/* Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${section.iconBg} ${section.iconColor} flex items-center justify-center`}>
                        <section.icon size={20} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-800 dark:text-white">
                          {section.title}{" "}
                          {section.accentTitle && (
                            <span className={section.accentColor}>{section.accentTitle}</span>
                          )}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{section.subtitle}</p>
                      </div>
                    </div>
                    {section.viewAllHref && (
                      <Link
                        href={section.viewAllHref}
                        className={`text-xs font-semibold ${section.accentColor} hover:opacity-80 transition-colors flex items-center gap-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-lg`}
                      >
                        Browse all →
                      </Link>
                    )}
                  </div>

                  {/* Items — horizontal grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {section.items
                      .filter((item: any) => item.active !== false)
                      .slice(0, 3)
                      .map((item, idx) => (
                        <a
                          key={idx}
                          href={item.url && item.url !== "#" ? item.url : undefined}
                          target={item.url && item.url !== "#" ? "_blank" : undefined}
                          rel={item.url && item.url !== "#" ? "noopener noreferrer" : undefined}
                          className={`flex items-center gap-3 p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] ${section.hoverBorder} hover:shadow-md dark:hover:shadow-none hover:-translate-y-0.5 transition-all duration-200 group ${item.url && item.url !== "#" ? "cursor-pointer" : ""}`}
                        >
                          {/* Logo */}
                          <div className="w-11 h-11 rounded-xl bg-white border border-gray-100 dark:border-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                            {item.logo ? (
                              <Image
                                src={item.logo}
                                alt={item.name}
                                width={44}
                                height={44}
                                className="object-contain w-full h-full p-1.5"
                              />
                            ) : (
                              <span className="text-gray-700 dark:text-white text-xs font-bold">{item.initials}</span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold text-gray-800 dark:text-white ${section.hoverText} transition-colors truncate`}>
                              {item.name}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{item.desc}</p>
                          </div>

                          {/* Badge or Visit */}
                          {item.badge ? (
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap ${BADGE_STYLES[item.badgeType || "green"]}`}>
                              {item.badge}
                            </span>
                          ) : item.url && item.url !== "#" ? (
                            <span className={`text-[10px] font-bold border px-2.5 py-1 rounded-lg whitespace-nowrap flex items-center gap-1 transition-colors ${section.visitStyle}`}>
                              Visit <ExternalLink size={10} />
                            </span>
                          ) : null}
                        </a>
                      ))}
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
