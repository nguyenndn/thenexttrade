import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Position Size Calculator | TheNextTrade",
    description: "Calculate accurate lot sizes for Forex negotiation. Manage risk with precise Stop Loss and Account Balance inputs.",
    keywords: ["Position Size Calculator", "Lot Size Calculator", "Forex Risk Management", "Pip Value"],
};

export default function RiskCalculatorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
