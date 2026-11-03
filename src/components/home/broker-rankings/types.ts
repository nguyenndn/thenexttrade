import partnersData from "@/config/partners.json";
import type { UnifiedRankingItem } from "./BrokerRankingCard";

export interface BrokerItem {
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
    active?: boolean;
}

export interface CryptoItem {
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
    active?: boolean;
}

export function getRankingsData() {
    const rawBrokers = partnersData.brokers.items as BrokerItem[];
    const rawCrypto = partnersData.cryptoExchanges.items as CryptoItem[];

    const brokers: UnifiedRankingItem[] = rawBrokers
        .filter((item) => item.active !== false)
        .slice(0, 3)
        .map((item) => ({ ...item }));

    const totalActiveBrokers = rawBrokers.filter(
        (item) => item.active !== false
    ).length;
    const totalActiveCrypto = rawCrypto.filter(
        (item) => item.active !== false
    ).length;

    const cryptoExchanges: UnifiedRankingItem[] = rawCrypto
        .filter((item) => item.active !== false)
        .slice(0, 3)
        .map((item) => {
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

    return {
        brokers,
        cryptoExchanges,
        totalActiveBrokers,
        totalActiveCrypto,
    };
}
