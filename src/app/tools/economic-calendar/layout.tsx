import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Economic Calendar | Forex News & Events Schedule",
    description: "Stay ahead with our real-time economic calendar. Track high-impact forex news events, central bank announcements, and key economic indicators.",
    keywords: ["economic calendar", "forex news", "NFP", "FOMC", "central bank", "economic events", "forex calendar"],
    openGraph: {
        title: "Economic Calendar - Forex News & Events",
        description: "Real-time economic calendar with high-impact news events.",
        type: "website",
        images: ["/economic-calendar-og.jpg"],
    },
    twitter: {
        card: "summary_large_image",
        title: "Economic Calendar | GSN CRM",
        description: "Track high-impact forex news events in real-time.",
    },
    alternates: {
        canonical: "/tools/economic-calendar",
    },
};

export default function EconomicCalendarLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
