export interface FooterNavLink {
    href: string;
    label: string;
}

export interface FooterNavSection {
    title: string;
    links: FooterNavLink[];
}

export const FOOTER_SECTIONS: FooterNavSection[] = [
    {
        title: "Knowledge & Insights",
        links: [
            { href: "/knowledge", label: "Knowledge Base" },
            { href: "/knowledge?category=market-analysis", label: "Market Analysis" },
            { href: "/knowledge?category=technical-analysis", label: "Technical Analysis" },
            { href: "/knowledge?category=trading-psychology", label: "Trading Psychology" },
        ],
    },
    {
        title: "Trading Tools",
        links: [
            { href: "/tools/economic-calendar", label: "Economic Calendar" },
            { href: "/tools/market-hours", label: "Market Hours" },
            { href: "/tools/position-size-calculator", label: "Position Size Calculator" },
        ],
    },
    {
        title: "Resources",
        links: [
            { href: "/get-started", label: "Get Started" },
            { href: "/brokers", label: "Trusted Brokers" },
            { href: "/trading-systems", label: "Trading Systems" },
            { href: "/about", label: "About Us" },
            { href: "/contact", label: "Contact Us" },
        ],
    },
];
