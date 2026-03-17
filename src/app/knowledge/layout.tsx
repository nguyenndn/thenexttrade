import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Trading Library | Free Forex Articles & Guides",
    description: "Browse our comprehensive library of forex trading articles, market analysis, and educational guides. Learn strategies, technical analysis, and risk management.",
    keywords: ["forex articles", "trading guides", "market analysis", "forex education", "trading strategies"],
    openGraph: {
        title: "Trading Library - Free Forex Articles & Guides",
        description: "Comprehensive forex trading articles and educational guides.",
        type: "website",
        images: ["/library-og.jpg"],
    },
    twitter: {
        card: "summary_large_image",
        title: "Trading Library | TheNextTrade",
        description: "Free forex trading articles, guides, and market analysis.",
    },
    alternates: {
        canonical: "/knowledge",
    },
};

export default function LibraryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
