import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login | Access Your Trading Dashboard",
    description: "Sign in to your TheNextTradeaccount. Access your trading journal, progress, and professional tools.",
    openGraph: {
        title: "Login to TheNextTrade",
        description: "Access your trading dashboard and tools.",
    },
    robots: {
        index: false,
        follow: false,
    },
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
