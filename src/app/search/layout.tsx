import { PublicHeader } from "@/components/layout/PublicHeader";
import { getAuthUser } from "@/lib/auth-cache";

export const metadata = {
    title: "Search | Find Articles, Lessons & Tools",
    description: "Search our comprehensive database of forex trading articles, academy lessons, and tools.",
    robots: {
        index: false,
        follow: true,
    },
};

export default async function SearchLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getAuthUser();

    return (
        <>
            <PublicHeader user={user} />
            {children}
        </>
    );
}
