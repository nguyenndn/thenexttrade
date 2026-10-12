import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login | Access Your Trading Dashboard",
    description:
        "Sign in to TheNextTrade to open your trading journal and tools.",
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
