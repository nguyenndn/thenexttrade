import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign Up | Create Your Trading Account",
    description:
        "Join TheNextTrade for free. Tools, trade journal, and risk calculators.",
    openGraph: {
        title: "Create Your Trading Account - TheNextTrade",
        description:
            "Join thousands of traders. Free access to tools and education.",
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
