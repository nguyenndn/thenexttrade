import type { Metadata } from "next";
import Link from "next/link";
import { ShieldX, Home, LogIn } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
    title: "403 — Access Denied | TheNextTrade",
    description: "You do not have permission to access this page.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function ForbiddenPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-transparent px-4">
            <div className="text-center max-w-lg">
                {/* 403 */}
                <div className="relative mb-8">
                    <p className="text-[120px] sm:text-[160px] font-mono tabular-nums font-black text-gray-100 dark:text-white/[0.03] leading-none select-none">
                        403
                    </p>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <ShieldX
                                size={40}
                                className="text-red-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-black text-gray-700 dark:text-white mb-4 font-heading tracking-tight">
                    Access Denied
                </h1>

                {/* Description */}
                <p className="text-base text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    You don&apos;t have permission to access this page. Please
                    sign in with the correct account or contact support.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/auth/login"
                        className={cn(
                            buttonVariants({ variant: "primary", size: "md" }),
                            "flex items-center gap-2 px-6 py-2.5 bg-gold hover:bg-amber-600 !text-white font-bold rounded-lg shadow-sm shadow-amber-500/20 border-none"
                        )}
                    >
                        <LogIn size={16} />
                        Sign In
                    </Link>
                    <Link
                        href="/"
                        className={cn(
                            buttonVariants({ variant: "outline", size: "md" }),
                            "flex items-center gap-2 px-6 py-2.5 font-bold rounded-lg"
                        )}
                    >
                        <Home size={16} />
                        Go Home
                    </Link>
                </div>

                {/* Contact */}
                <p className="mt-10 text-sm text-gray-500">
                    Need access?{" "}
                    <a
                        href="mailto:support@thenexttrade.io"
                        className="text-amber-600 dark:text-gold font-semibold hover:underline"
                    >
                        Contact Support
                    </a>
                </p>
            </div>
        </div>
    );
}
