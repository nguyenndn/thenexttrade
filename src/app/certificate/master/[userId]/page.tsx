import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMasterCertificateShareData } from "@/lib/certificates/certificate-share.server";
import { CertificateShareScale } from "@/components/academy/CertificateShareScale";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Crown, ShieldCheck } from "lucide-react";
import Image from "next/image";

export const dynamic = "force-dynamic";

type Params = Promise<{ userId: string }>;

export async function generateMetadata({
    params,
}: {
    params: Params;
}): Promise<Metadata> {
    const { userId } = await params;
    const data = await getMasterCertificateShareData(userId);
    if (!data) {
        return { title: "Certificate Not Found | TheNextTrade" };
    }

    const description = `${data.displayName} completed all ${data.levelCount} levels of the TheNextTrade Academy with a ${data.avgScore}% average score — Master Trader Certified.`;

    return {
        title: `Master Certificate | ${data.displayName} | TheNextTrade`,
        description,
        openGraph: {
            title: `Master Certificate | ${data.displayName} | TheNextTrade`,
            description,
            images: [`/api/og/certificate/master/${userId}`],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: `Master Certificate | ${data.displayName} | TheNextTrade`,
            description,
            images: [`/api/og/certificate/master/${userId}`],
        },
    };
}

export default async function MasterCertificatePage({
    params,
}: {
    params: Params;
}) {
    const { userId } = await params;
    const data = await getMasterCertificateShareData(userId);
    if (!data) notFound();

    const dateStr = new Date(data.earnedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 text-gray-900 flex flex-col font-sans selection:bg-amber-400/20 dark:from-[#0B0E14] dark:via-[#0F1117] dark:to-[#0B0E14]">
            {/* Ambient background decoration */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl"></div>
            </div>

            {/* Brand header */}
            <header className="relative z-10 container mx-auto px-4 py-5 flex items-center justify-between">
                <Link
                    href="/"
                    className="text-xl font-black tracking-tight text-gray-800 dark:text-white"
                >
                    TheNext
                    <span className="text-amber-500">Trade</span>
                </Link>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20">
                    ★ Master Certificate ★
                </span>
            </header>

            <main className="relative flex-1 container mx-auto px-4 py-6 md:py-10 flex flex-col items-center gap-6 md:gap-8">
                {/* User card */}
                <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-5 md:p-6 shadow-2xl shadow-amber-500/20">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl"></div>

                        <div className="relative z-10 flex flex-col items-center text-center gap-5">
                            <div className="relative">
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-[3px] border-white/60 overflow-hidden bg-white shadow-2xl ring-4 ring-white/20">
                                    {data.userImage ? (
                                        <Image
                                            src={data.userImage}
                                            alt={data.displayName || "User"}
                                            width={96}
                                            height={96}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl md:text-3xl font-bold text-amber-600 bg-amber-100">
                                            {(data.displayName?.[0] || "U").toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div
                                    className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1.5 rounded-full border-[3px] border-amber-500 shadow-lg"
                                    title="Verified Trader"
                                >
                                    <CheckCircle2
                                        size={14}
                                        strokeWidth={3}
                                        className="md:w-4 md:h-4"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-center gap-2.5 flex-wrap">
                                    <h1 className="text-xl md:text-2xl font-black text-white drop-shadow-md">
                                        {data.displayName || "Trader"}
                                    </h1>
                                    <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-[10px] md:text-xs font-bold uppercase tracking-wider border border-white/30 flex items-center gap-1.5 backdrop-blur-md">
                                        <Crown size={11} />
                                        Master Certified
                                    </span>
                                </div>
                                <p className="text-white/90 text-sm leading-relaxed max-w-md mx-auto">
                                    Completed all {data.levelCount} levels of the
                                    professional forex trading program.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Certificate template (scaled) */}
                <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    <CertificateShareScale
                        userName={data.displayName || "Trader"}
                        levelTitle="TheNextTrade Academy"
                        levelOrder={0}
                        score={data.avgScore}
                        earnedAt={data.earnedAt}
                        variant="master"
                    />
                </div>

                {/* Verify panel */}
                <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-10 duration-700 delay-150">
                    <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard p-5 md:p-6 shadow-xl">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                                <ShieldCheck size={14} className="text-amber-500" />
                            </div>
                            <h2 className="text-sm font-bold text-gray-700 dark:text-white">
                                Master Certificate Details
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                                    Program
                                </span>
                                <p className="text-sm font-bold text-gray-700 dark:text-white">
                                    TheNextTrade Academy
                                </p>
                            </div>
                            <div>
                                <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                                    Levels
                                </span>
                                <p className="text-sm font-bold text-gray-700 dark:text-white">
                                    {data.levelCount}
                                </p>
                            </div>
                            <div>
                                <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                                    Avg Score
                                </span>
                                <p className="text-sm font-bold text-amber-500">
                                    {data.avgScore}%
                                </p>
                            </div>
                            <div>
                                <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                                    Issued
                                </span>
                                <p className="text-sm font-bold text-gray-700 dark:text-white">
                                    {dateStr}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200/60 dark:border-amber-500/20 px-4 py-3 text-xs font-bold text-amber-700 dark:text-amber-400">
                            <CheckCircle2 size={14} />
                            Verified — issued by TheNextTrade.com
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                    <div className="relative overflow-hidden rounded-2xl bg-white border border-dashboard p-5 md:p-8 text-center group hover:border-amber-400/20 transition-all duration-500 shadow-xl shadow-gray-200/50 dark:shadow-black/20">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"></div>
                        <div className="relative z-10 flex flex-col items-center gap-5 md:gap-7">
                            <div className="space-y-3 md:space-y-4">
                                <p className="text-amber-500/80 text-xs font-bold uppercase tracking-[0.2em]">
                                    Free Forever
                                </p>
                                <h2 className="text-2xl md:text-4xl font-black text-gray-800 dark:text-white tracking-tight">
                                    Become a Master Trader
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                                    Complete every level of TheNextTrade Academy
                                    to unlock your own Master Certificate.
                                </p>
                            </div>
                            <Link href="/auth/signup">
                                <Button className="h-12 md:h-14 px-8 md:px-10 rounded-xl font-bold text-base md:text-lg bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
                                    Get Started Free
                                    <ArrowRight size={18} className="md:w-5 md:h-5 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                    <span className="font-black text-gray-500 tracking-tight">
                        <span>TheNext</span>
                        <span className="text-amber-500">Trade</span>
                    </span>
                    <span>&middot;</span>
                    <span>&copy; {new Date().getFullYear()}</span>
                </div>
            </footer>
        </div>
    );
}
