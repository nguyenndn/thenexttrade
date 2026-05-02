import { Metadata } from "next";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = {
    title: "Admin Login | TheNextTrade",
    description: "Sign in to the TheNextTrade administration panel.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function AdminLoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-[#0B0E14] dark:via-[#0D1117] dark:to-[#161B22] p-4">
            <div className="w-full max-w-[460px]">
                <div className="flex justify-center mb-8">
                    <Logo />
                </div>
                {children}
            </div>
        </div>
    );
}
