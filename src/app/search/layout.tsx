import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Search | Find Articles, Lessons & Tools",
    description: "Search our comprehensive database of forex trading articles, academy lessons, and tools.",
    robots: {
        index: false,
        follow: true,
    },
};

export default function SearchLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
