import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact Us — Get in Touch with TheNextTrade",
    description: "Have questions about our trading tools, Academy courses, or need technical support? Send us a message and our team will respond within 24 hours.",
    openGraph: {
        title: "Contact TheNextTrade",
        description: "Reach out for trading support, partnership inquiries, or feedback.",
    },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return children;
}
