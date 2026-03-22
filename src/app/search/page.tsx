import SearchClient from "./SearchClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Search — Find Trading Articles, Tools & Lessons",
    description: "Search across TheNextTrade's trading articles, Academy lessons, tools, and market analysis. Find exactly what you need to improve your trading.",
    robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default function SearchPage() {
    return <SearchClient />;
}
