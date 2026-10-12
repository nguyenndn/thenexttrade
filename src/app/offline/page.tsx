import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff, RefreshCw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
    title: "You're Offline | TheNextTrade",
    description:
        "You appear to be offline. Please check your internet connection.",
};

export default function OfflinePage() {
    return (
        <>
            <PublicHeader />
            <main className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center mb-6">
                    <WifiOff size={36} className="text-primary" />
                </div>
                <h1 className="text-3xl font-black text-gray-800 dark:text-white mb-3">
                    You&apos;re Offline
                </h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8 leading-relaxed">
                    It looks like you&apos;ve lost your internet connection.
                    Don&apos;t worry — your trading data is safe. Reconnect and
                    try again.
                </p>
                <div className="flex gap-4">
                    <Link
                        href="/"
                        className={buttonVariants({
                            variant: "primary",
                            size: "smd",
                            className:
                                "rounded-full shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105",
                        })}
                    >
                        <RefreshCw size={14} />
                        Try Again
                    </Link>
                </div>
            </main>
            <SiteFooter />
        </>
    );
}
