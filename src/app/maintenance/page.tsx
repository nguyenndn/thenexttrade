import { Cog, Star } from "lucide-react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "System Upgrade | TheNextTrade",
    description:
        "We're currently upgrading our platform. Please check back shortly.",
    robots: {
        index: false,
        follow: false,
    },
};

export default async function MaintenancePage() {
    // Direct server-side check — if maintenance is OFF, redirect away
    let isMaintenanceOn = true;
    try {
        const record = await prisma.systemSetting.findUnique({
            where: { key: "site_config" },
        });
        const config = (record?.value as Record<string, unknown>) || {};
        isMaintenanceOn = config.maintenanceMode === true;
    } catch {
        // If DB fails, assume we're in maintenance or just render the page to be safe
    }

    if (!isMaintenanceOn) {
        redirect("/");
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-white dark:bg-transparent overflow-hidden selection:bg-gold/20 font-sans">
            {/* Subtle Gold Background Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent z-0 pointer-events-none"></div>

            {/* Grid Pattern overlay */}
            <div
                className="absolute inset-0 bg-[linear-gradient(rgba(128,128,128,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(128,128,128,0.06)_1px,transparent_1px)] bg-[size:40px_40px] z-0 opacity-60 pointer-events-none"
                style={{
                    WebkitMaskImage:
                        "radial-gradient(circle at center, black, transparent 80%)",
                    maskImage:
                        "radial-gradient(circle at center, black, transparent 80%)",
                }}
            ></div>

            {/* Main Content Container */}
            <div className="relative z-10 max-w-lg w-full mx-4">
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-8 sm:p-12 text-center shadow-sm relative overflow-hidden">
                    {/* Icon Group */}
                    <div className="relative mx-auto w-[100px] h-[100px] mb-8 group">
                        <div className="relative w-full h-full bg-gray-50/80 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl flex items-center justify-center shadow-sm">
                            <Cog
                                size={44}
                                className="text-amber-500 animate-[spin_4s_linear_infinite]"
                                strokeWidth={2}
                            />
                            <div className="absolute bottom-2 right-2 bg-white dark:bg-[#1E2028] rounded-lg p-1 border border-gray-200 dark:border-white/10 shadow-sm">
                                <Star
                                    size={16}
                                    className="text-amber-500"
                                    strokeWidth={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gold/10 border border-gold/20 mb-6 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        <span className="text-xs font-bold text-amber-600 dark:text-gold uppercase tracking-wider">
                            System Upgrade
                        </span>
                    </div>

                    {/* Typography */}
                    <h1 className="text-[36px] sm:text-[42px] font-black text-slate-900 dark:text-white mb-4 tracking-tight leading-tight font-heading">
                        We&apos;re Upgrading
                    </h1>
                    <p className="text-slate-500 dark:text-gray-400 text-[15px] mb-10 leading-relaxed font-medium max-w-[90%] mx-auto">
                        TheNextTrade is currently undergoing scheduled
                        maintenance to upgrade trade telemetry infrastructure
                        and execution services.
                    </p>

                    {/* Footer */}
                    <div className="pt-6 border-t border-gray-200 dark:border-white/10">
                        <p className="text-[13px] text-slate-500 dark:text-gray-400 font-medium">
                            Need immediate assistance?{" "}
                            <a
                                href="mailto:support@thenexttrade.io"
                                className="text-amber-600 dark:text-gold font-bold hover:underline underline-offset-4"
                            >
                                Contact Support
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
