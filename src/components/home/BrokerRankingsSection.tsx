"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, Check, ExternalLink, Award, Sparkles, Landmark, TrendingUp } from "lucide-react";
import partnersData from "@/config/partners.json";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";

interface BrokerItem {
  name: string;
  desc: string;
  badge: string | null;
  badgeType: string | null;
  logo: string | null;
  initials: string;
  url: string | null;
  rating: number;
  minDeposit: string;
  maxLeverage: string;
  regulation: string;
  features: string[];
}

interface CryptoItem {
  name: string;
  desc: string;
  badge: string | null;
  badgeType: string | null;
  logo: string | null;
  initials: string;
  url: string | null;
  rating: number;
  minDeposit: string;
  maxLeverage: string;
  regulation: string;
  features: string[];
}

interface UnifiedItem {
  name: string;
  desc: string;
  badge: string | null;
  badgeType: string | null;
  logo: string | null;
  initials: string;
  url: string | null;
  rating: number;
  regulation: string;
  features: string[];
  // Broker specific
  minDeposit?: string;
  maxLeverage?: string;
  // Crypto specific
  marketType?: string;
  assets?: string;
}

export function BrokerRankingsSection() {
  const [activeTab, setActiveTab] = useState<'brokers' | 'crypto'>('brokers');

  const brokers: UnifiedItem[] = (partnersData.brokers.items as BrokerItem[])
    .filter(item => (item as any).active !== false)
    .slice(0, 4)
    .map(item => ({
      ...item,
    }));

  const cryptoExchanges: UnifiedItem[] = (partnersData.cryptoExchanges.items as CryptoItem[])
    .filter(item => (item as any).active !== false)
    .slice(0, 4)
    .map(item => {
      const nameLower = item.name.toLowerCase();
      let marketType = "Spot & Derivatives";
      let assets = "300+ Assets";
      if (nameLower.includes("binance")) {
        marketType = "Spot & Futures";
        assets = "600+ Cryptos";
      } else if (nameLower.includes("bybit")) {
        marketType = "Derivatives & Spot";
        assets = "600+ Assets";
      } else if (nameLower.includes("okx")) {
        marketType = "Spot, Futures & Options";
        assets = "300+ Assets";
      }
      return {
        ...item,
        marketType,
        assets,
      };
    });

  const activeItems = activeTab === 'brokers' ? brokers : cryptoExchanges;

  return (
    <div className="relative overflow-hidden bg-slate-50/50 dark:bg-[#0B0E14] border-t border-dashboard">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.15] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <section className="py-8 sm:py-12 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <HomeSectionHeading
          align="center"
          eyebrow="Compare and trade"
          title="Recommended Trading Platforms"
          highlight="Platforms"
          description="Compare CFD brokers and crypto exchanges by fit, fees, platform, and trading style."
          icon={Sparkles}
          className="mb-8"
        />

        {/* Tab Switcher */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} tabsId="platforms-tabs" className="w-full">
          <div className="mb-8 overflow-x-auto scrollbar-hide flex justify-center">
            <TabsList className="bg-gray-50 dark:bg-white/5 border border-dashboard rounded-xl p-1.5 gap-1 shrink-0">
              <TabsTrigger
                value="brokers"
                className="px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-dashboard dark:hover:border-white/10"
                activeIndicatorClassName="!bg-gradient-to-r from-gold to-amber-600 shadow-md border-0"
                activeTextClassName="!text-white"
              >
                <Landmark size={15} />
                <span>CFD Brokers</span>
              </TabsTrigger>
              <TabsTrigger
                value="crypto"
                className="px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-dashboard dark:hover:border-white/10"
                activeIndicatorClassName="!bg-gradient-to-r from-gold to-amber-600 shadow-md border-0"
                activeTextClassName="!text-white"
              >
                <TrendingUp size={15} />
                <span>Crypto Exchanges</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        {/* Comparison List/Cards */}
        <div className="space-y-4 max-w-5xl mx-auto">
          {activeItems.map((item, idx) => (
            <div 
              key={item.name}
              className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 p-5 sm:p-6 rounded-2xl bg-white/80 dark:bg-white/[0.02] border border-amber-200/50 dark:border-amber-500/10 hover:border-gold/50 dark:hover:border-gold/30 hover:shadow-lg transition-all duration-300 group"
            >
              {/* Badge for #1 Rated */}
              {idx === 0 && (
                <div className="absolute -top-3 left-6 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-gold text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                  <Award size={10} /> {activeTab === 'brokers' ? "Editor's Choice" : "Top Volume"}
                </div>
              )}

              {/* Left Column: Brand, Name & Rating */}
              <div className="flex items-center gap-4 min-w-[200px]">
                <div className="w-14 h-14 rounded-2xl bg-white border border-dashboard dark:border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm p-1.5 relative group-hover:scale-105 transition-transform duration-300">
                  {item.logo ? (
                    <Image 
                      src={item.logo} 
                      alt={item.name} 
                      width={56} 
                      height={56} 
                      className="object-contain w-full h-full"
                    />
                  ) : (
                    <span className="text-gray-700 dark:text-white text-base font-black">{item.initials}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-800 dark:text-white group-hover:text-gold transition-colors flex items-center gap-1.5">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{item.rating}</span>
                    <span className="text-[10px] text-gray-400 font-medium">({item.regulation})</span>
                  </div>
                </div>
              </div>

              {/* Mid Column: Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 flex-1 max-w-xl">
                {activeTab === 'brokers' ? (
                  <>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Min Deposit</p>
                      <p className="text-sm font-extrabold text-gray-700 dark:text-white mt-0.5">{item.minDeposit}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Max Leverage</p>
                      <p className="text-sm font-extrabold text-gray-700 dark:text-white mt-0.5">{item.maxLeverage || "N/A"}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Market Type</p>
                      <p className="text-sm font-extrabold text-gray-700 dark:text-white mt-0.5">{item.marketType}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Assets</p>
                      <p className="text-sm font-extrabold text-gray-700 dark:text-white mt-0.5">{item.assets}</p>
                    </div>
                  </>
                )}
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Key Features</p>
                  <ul className="mt-1 space-y-0.5 text-xs text-gray-600 dark:text-gray-300 font-medium">
                    {item.features.slice(0, 2).map((feat, i) => (
                      <li key={i} className="flex items-center gap-1 truncate">
                        <Check size={10} className="text-emerald-500 flex-shrink-0" />
                        <span className="truncate">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column: CTA Actions */}
              <div className="flex sm:flex-row md:flex-col lg:flex-row items-center gap-3 shrink-0">
                {activeTab === 'brokers' ? (
                  <>
                    <a 
                      href={item.url || "#"} 
                      target={item.url && item.url !== "#" ? "_blank" : undefined}
                      rel={item.url && item.url !== "#" ? "noopener noreferrer" : undefined}
                      className="flex-1 md:w-full lg:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer text-center whitespace-nowrap animate-none"
                    >
                      Trade Now <ExternalLink size={10} />
                    </a>
                    <a
                      href="/brokers?tab=brokers"
                      className="flex-1 md:w-full lg:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-dashboard hover:border-gold/40 hover:bg-gold/5 text-gray-700 dark:text-white dark:hover:text-gold text-xs font-bold transition-all duration-300 whitespace-nowrap"
                    >
                      Full Review
                    </a>
                  </>
                ) : (
                  <>
                    <a 
                      href={item.url || "#"} 
                      target={item.url && item.url !== "#" ? "_blank" : undefined}
                      rel={item.url && item.url !== "#" ? "noopener noreferrer" : undefined}
                      className="flex-1 md:w-full lg:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer text-center whitespace-nowrap animate-none"
                    >
                      Open Exchange <ExternalLink size={10} />
                    </a>
                    <a
                      href="/brokers?tab=cryptoExchanges"
                      className="flex-1 md:w-full lg:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-dashboard hover:border-gold/40 hover:bg-gold/5 text-gray-700 dark:text-white dark:hover:text-gold text-xs font-bold transition-all duration-300 whitespace-nowrap"
                    >
                      Compare Exchanges
                    </a>
                  </>
                )}
              </div>

            </div>
          ))}
        </div>

      </section>
    </div>
  );
}
