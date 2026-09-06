import { PublicHeader } from "@/components/layout/PublicHeader";
import { getAuthUser } from "@/lib/auth-cache";

export default async function AcademyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getAuthUser();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-transparent text-gray-700 dark:text-white font-outfit">
            <PublicHeader user={user} />
            <main>{children}</main>
        </div>
    );
}
