import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign Up | Create Your Trading Account",
    description: "Join TheNextTradefor free. Get access to professional trading tools, forex academy, and risk management calculators.",
    openGraph: {
        title: "Create Your Trading Account - GSN CRM",
        description: "Join thousands of traders. Free access to tools and education.",
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function SignupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
