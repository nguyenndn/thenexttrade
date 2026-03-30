"use client";

import { useState } from "react";
import Image from "next/image";
import { Building2, Shield, Server, Star, ChevronRight, ExternalLink, Sparkles } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import partnersData from "@/config/partners.json";

const BADGE_STYLES: Record<string, string> = {
  gold: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white",
  green: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  blue: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20",
};

const CATEGORIES = [
  { key: "brokers", label: "CFD Brokers", icon: Building2, data: partnersData.brokers, cta: "Open Account", depositLabel: "Min Deposit" },
  { key: "propFirms", label: "Prop Firms", icon: Shield, data: partnersData.propFirms, cta: "Get Funded", depositLabel: "Challenge Fee" },
  { key: "vps", label: "VPS Hosting", icon: Server, data: partnersData.vps, cta: "Get VPS", depositLabel: "Price" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={
              star <= Math.floor(rating)
                ? "fill-amber-400 text-amber-400"
                : star <= rating
                ? "fill-amber-400/50 text-amber-400"
                : "fill-gray-200 dark:fill-gray-700 text-gray-200 dark:text-gray-700"
            }
          />
        ))}
      </div>
      <span className="text-sm font-bold text-gray-900 dark:text-white">{rating}</span>
    </div>
  );
}

function PartnerCard({ item, ctaLabel, depositLabel }: { item: (typeof CATEGORIES)[number]["data"]["items"][number]; ctaLabel: string; depositLabel: string }) {
  const hasUrl = item.url && item.url !== "#";

  return (
    <div className="group bg-white dark:bg-[#1A1C24] rounded-2xl border border-gray-200 dark:border-white/[0.08] hover:border-primary/40 dark:hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 overflow-hidden flex flex-col">
      {/* Badge ribbon */}
      {item.badge && (
        <div className={`px-4 py-1.5 text-xs font-bold text-center ${BADGE_STYLES[item.badgeType || "green"]}`}>
          {item.badge}
        </div>
      )}

      {/* Header: Logo + Info inline */}
      <div className="p-5 pb-4 flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden ${
          item.logo
            ? "bg-white dark:bg-white/10 border border-gray-100 dark:border-white/10"
            : `bg-gradient-to-br ${item.color} text-white text-base font-black shadow-lg`
        }`}>
          {item.logo ? (
            <Image src={item.logo} alt={item.name} width={56} height={56} className="object-contain w-full h-full p-1.5" />
          ) : (
            item.initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{item.name}</h3>
          {item.rating && <StarRating rating={item.rating} />}
        </div>
      </div>

      {/* Specs Bar */}
      {(item.minDeposit || item.maxLeverage || item.regulation) && (() => {
        const specCount = [item.minDeposit, item.maxLeverage, item.regulation].filter(Boolean).length;
        const gridCols = specCount === 1 ? "grid-cols-1" : specCount === 2 ? "grid-cols-2" : "grid-cols-3";
        return (
        <div className={`grid ${gridCols} gap-px bg-gray-100 dark:bg-white/5 border-y border-gray-100 dark:border-white/5`}>
          {item.minDeposit && (
            <div className="bg-white dark:bg-[#1A1C24] py-3 text-center">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                {depositLabel}
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{item.minDeposit}</div>
            </div>
          )}
          {item.maxLeverage && (
            <div className="bg-white dark:bg-[#1A1C24] py-3 text-center">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Leverage</div>
              <div className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{item.maxLeverage}</div>
            </div>
          )}
          {item.regulation && (
            <div className="bg-white dark:bg-[#1A1C24] py-3 text-center">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Regulation</div>
              <div className="text-sm font-bold text-gray-900 dark:text-white mt-0.5 truncate px-2">{item.regulation}</div>
            </div>
          )}
        </div>
        );
      })()}

      {/* Features */}
      {item.features && item.features.length > 0 && (
        <div className="p-5 pt-4 flex-1">
          <ul className="space-y-2">
            {item.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                <ChevronRight size={14} className="text-primary mt-0.5 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      <div className="px-5 pb-5 mt-auto">
        {hasUrl ? (
          <a
            href={item.url!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-primary to-teal-500 text-white font-bold text-sm hover:opacity-90 transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            {ctaLabel}
            <ExternalLink size={14} />
          </a>
        ) : (
          <button
            disabled
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 font-bold text-sm cursor-not-allowed border border-gray-200 dark:border-white/10"
          >
            Coming Soon
          </button>
        )}
      </div>
    </div>
  );
}

export default function BrokersClient() {
  const [activeTab, setActiveTab] = useState("brokers");

  return (
    <>
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider mb-6 border border-primary/20">
          <Sparkles size={14} />
          <span>Curated by TheNextTrade</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
          Trusted{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400">
            Partners
          </span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Handpicked brokers, prop firms, and infrastructure we personally use and trust.
        </p>
      </div>

        {/* Tabs - same style as /tools page */}
        <Tabs value={activeTab} onValueChange={setActiveTab} tabsId="brokers-page">
          <div className="mb-10 overflow-x-auto scrollbar-hide flex justify-center">
            <TabsList className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1.5 gap-1 shrink-0">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <TabsTrigger
                    key={cat.key}
                    value={cat.key}
                    className="px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                    activeIndicatorClassName="!bg-gradient-to-r from-primary to-teal-500 shadow-md border-0"
                    activeTextClassName="!text-white"
                  >
                    <Icon size={15} />
                    <span>{cat.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Tab content panels */}
          {CATEGORIES.map((cat) => (
            <TabsContent key={cat.key} value={cat.key}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cat.data.items.map((item, idx) => (
                  <PartnerCard key={idx} item={item} ctaLabel={cat.cta} depositLabel={cat.depositLabel} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
    </>
  );
}
