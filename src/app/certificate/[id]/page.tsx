import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCertificateShareData } from "@/lib/certificates/certificate-share.server";
import { CertificateShareScale } from "@/components/academy/CertificateShareScale";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Medal, ShieldCheck } from "lucide-react";
import Image from "next/image";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({
    params,
}: {
    params: Params;
}): Promise<Metadata> {
    const { id } = await params;
    const data = await getCertificateShareData(id);
    if (!data) {
        return { title: "Certificate Not Found | TheNextTrade" };
    }

    const description = `${data.displayName} earned the Level ${data.levelOrder}: ${data.levelTitle} certificate on TheNextTrade Academy with a ${data.score}% score.`;

    return {
        title: `Certificate | ${data.displayName} | TheNextTrade`,
        description,
        openGraph: {
            title: `Certificate | ${data.displayName} | TheNextTrade`,
            description,
            images: [`/api/og/certificate/${id}`],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: `Certificate | ${data.displayName} | TheNextTrade`,
            description,
            images: [`/api/og/certificate/${id}`],
        },
    };
}

export default async function CertificatePage({
    params,
}: {
    params: Params;
}) {
    const { id } = await params;
    const data = await getCertificateShareData(id);
    if (!data) notFound();

    const dateStr = new Date(data.earnedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 text-gray-900 flex flex-col font-sans selection:bg-primary/20 dark:from-[#0B0E14] dark:via-[#0F1117] dark:to-[#0B0E14]">
            {/* Ambient background decoration */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
            </div>

            {/* Brand header */}
            <header className="relative z-10 container mx-auto px-4 py-5 flex items-center justify-between">
                <Link
                    href="/"
                    className="text-xl font-black tracking-tight text-gray-800 dark:text-white"
                >
                    TheNext
                    <span className="text-primary">Trade</span>
                </Link>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 py-1.5 rounded-full bg-white/70 dark:bg-white/5 border border-dashboard">
                    Academy Certificate
                </span>
            </header>

            <main className="relative flex-1 container mx-auto px-4 py-6 md:py-10 flex flex-col items-center gap-6 md:gap-8">
                {/* User card */}
                <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-emerald-500 to-teal-600 p-5 md:p-6 shadow-2xl shadow-primary/15">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl"></div>

                        <div className="relative z-10 flex flex-col items-center text-center gap-5">
                            <div className="relative">
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-[3px] border-white/50 overflow-hidden bg-white shadow-2xl ring-4 ring-white/10">
                                    {data.userImage ? (
                                        <Image
                                            src={data.userImage}
                                            alt={data.displayName || "User"}
                                            width={96}
                                            height={96}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl md:text-3xl font-bold text-primary bg-primary/10">
                                            {(data.displayName?.[0] || "U").toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div
                                    className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1.5 rounded-full border-[3px] border-emerald-500 shadow-lg"
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
                                    <span className="px-2.5 py-1 rounded-full bg-white/15 text-white/95 text-[10px] md:text-xs font-bold uppercase tracking-wider border border-white/25 flex items-center gap-1.5 backdrop-blur-md">
                                        <Medal size={11} />
                                        Certified
                                    </span>
                                </div>
                                <p className="text-white/85 text-sm leading-relaxed max-w-md mx-auto">
                                    {data.levelDescription ||
                                        `Level ${data.levelOrder}: ${data.levelTitle}`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Certificate template (scaled) */}
                <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    <CertificateShareScale
                        userName={data.displayName || "Trader"}
                        levelTitle={data.levelTitle}
                        levelOrder={data.levelOrder}
                        score={data.score}
                        earnedAt={data.earnedAt}
                        variant="level"
                    />
                </div>

                {/* Verify panel */}
                <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-10 duration-700 delay-150">
                    <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard p-5 md:p-6 shadow-xl">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                                <ShieldCheck size={14} className="text-emerald-500" />
                            </div>
                            <h2 className="text-sm font-bold text-gray-700 dark:text-white">
                                Certificate Details
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                                    Level
                                </span>
                                <p className="text-sm font-bold text-gray-700 dark:text-white">
                                    Level {data.levelOrder}
                                </p>
                            </div>
                            <div>
                                <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                                    Program
                                </span>
                                <p className="text-sm font-bold text-gray-700 dark:text-white">
                                    {data.levelTitle}
                                </p>
                            </div>
                            <div>
                                <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                                    Score
                                </span>
                                <p className="text-sm font-bold text-primary">
                                    {data.score}%
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

                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200/60 dark:border-emerald-500/20 px-4 py-3 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 size={14} />
                            Verified — issued by TheNextTrade.com
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                    <div className="relative overflow-hidden rounded-2xl bg-white border border-dashboard p-5 md:p-8 text-center group hover:border-primary/20 transition-all duration-500 shadow-xl shadow-gray-200/50 dark:shadow-black/20">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent"></div>
                        <div className="relative z-10 flex flex-col items-center gap-5 md:gap-7">
                            <div className="space-y-3 md:space-y-4">
                                <p className="text-primary/80 text-xs font-bold uppercase tracking-[0.2em]">
                                    Free Forever
                                </p>
                                <h2 className="text-2xl md:text-4xl font-black text-gray-800 dark:text-white tracking-tight">
                                    Earn Your Own Certificate
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                                    Join traders mastering their psychology and
                                    strategy with TheNextTrade Academy.
                                </p>
                            </div>
                            <Link href="/auth/signup">
                                <Button className="h-12 md:h-14 px-8 md:px-10 rounded-xl font-bold text-base md:text-lg bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
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
                        <span className="text-primary">Trade</span>
                    </span>
                    <span>&middot;</span>
                    <span>&copy; {new Date().getFullYear()}</span>
                </div>
            </footer>
        </div>
    );
}
