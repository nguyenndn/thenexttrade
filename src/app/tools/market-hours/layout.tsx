import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Forex Market Hours Monitor | Trading Sessions Worldwide",
    description: "Track live forex market hours across Sydney, Tokyo, London, and New York sessions. Identify session overlaps and optimal trading times for maximum volatility.",
    keywords: ["forex market hours", "trading sessions", "market overlap", "Sydney session", "Tokyo session", "London session", "New York session"],
    openGraph: {
        title: "Forex Market Hours Monitor - Live Trading Sessions",
        description: "Visualize major forex market sessions and identify high-volatility trading opportunities.",
        type: "website",
        images: ["/market-hours-og.jpg"],
    },
    twitter: {
        card: "summary_large_image",
        title: "Forex Market Hours Monitor",
        description: "Track live forex market sessions worldwide.",
    },
    alternates: {
        canonical: "/tools/market-hours",
    },
};

export default function MarketHoursLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
