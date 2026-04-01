import { Building2, Shield, Server, Bitcoin } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import Link from "next/link";
import Image from "next/image";
import partnersData from "@/config/partners.json";

const BADGE_STYLES: Record<string, string> = {
  gold: "bg-amber-500 text-white",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30",
  blue: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30",
};

interface Category {
  title: string;
  subtitle: string;
  viewAllHref?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
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

const CATEGORIES: Category[] = [
  {
    ...partnersData.brokers,
    icon: Building2,
    iconBg: "bg-blue-100 dark:bg-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    ...partnersData.cryptoExchanges,
    icon: Bitcoin,
    iconBg: "bg-amber-100 dark:bg-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    viewAllHref: "/brokers?tab=cryptoExchanges",
  },
  {
    ...partnersData.propFirms,
    icon: Shield,
    iconBg: "bg-orange-100 dark:bg-orange-500/20",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    ...partnersData.vps,
    icon: Server,
    iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
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
            	Trusted Partners
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-base">
            Services we use and trust
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CATEGORIES.map((cat, catIdx) => (
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
                  {cat.items.filter((item: any) => item.active !== false).slice(0, 3).map((item, idx) => {
                    const content = (
                      <>
                        {/* Logo or Initials */}
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden ${
                          item.logo 
                            ? "bg-white border border-gray-100 dark:border-white/10" 
                            : `bg-gradient-to-br ${item.color} text-white text-sm font-black shadow-lg`
                        }`}>
                          {item.logo ? (
                            <Image
                              src={item.logo}
                              alt={item.name}
                              width={56}
                              height={56}
                              className="object-contain w-full h-full p-1.5"
                            />
                          ) : (
                            item.initials
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.desc}</p>
                        </div>
                        {item.badge && (
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap ${BADGE_STYLES[item.badgeType || "green"]}`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    );

                    // Clickable if URL exists and not "#"
                    if (item.url && item.url !== "#") {
                      return (
                        <a
                          key={idx}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-1 rounded-xl bg-gray-50 dark:bg-white/[0.03] hover:bg-gray-100 dark:hover:bg-white/[0.07] border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 transition-all duration-200 group cursor-pointer"
                        >
                          {content}
                        </a>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-4 p-1 rounded-xl bg-gray-50 dark:bg-white/[0.03] hover:bg-gray-100 dark:hover:bg-white/[0.07] border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 transition-all duration-200 group"
                      >
                        {content}
                      </div>
                    );
                  })}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
