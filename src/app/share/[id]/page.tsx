import { prisma } from "@/lib/prisma";
import { TradeShareCard } from "@/components/journal/TradeShareCard";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Medal } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";

// Force dynamic rendering since we are fetching specific trade data
export const dynamic = "force-dynamic";

interface SharePageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function SharePage({ params }: SharePageProps) {
    const { id } = await params;

    const trade = await prisma.journalEntry.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    name: true,
                    image: true,
                }
            },
            account: {
                select: {
                    accountType: true,
                    name: true,
                }
            }
        }
    });

    if (!trade) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 text-gray-900 flex flex-col font-sans selection:bg-primary/20">
            {/* Ambient background decoration */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
            </div>

            <main className="relative flex-1 container mx-auto px-4 py-6 md:py-10 flex flex-col items-center justify-center gap-6 md:gap-8">

                {/* User Profile Section */}
                <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-emerald-500 to-teal-600 p-5 md:p-6 shadow-2xl shadow-primary/15">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl"></div>

                        <div className="relative z-10 flex flex-col items-center text-center gap-5">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-[3px] border-white/50 overflow-hidden bg-white shadow-2xl ring-4 ring-white/10">
                                    {trade.user.image ? (
                                        <Image
                                            src={trade.user.image}
                                            alt={trade.user.name || "User"}
                                            width={96}
                                            height={96}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl md:text-3xl font-bold text-primary bg-primary/10">
                                            {(trade.user.name?.[0] || "U").toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1.5 rounded-full border-[3px] border-emerald-500 shadow-lg" title="Verified Trader">
                                    <CheckCircle2 size={14} strokeWidth={3} className="md:w-4 md:h-4" />
                                </div>
                            </div>

                            {/* Name + Badge */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-center gap-2.5 flex-wrap">
                                    <h1 className="text-xl md:text-2xl font-black text-white drop-shadow-md">
                                        {trade.user.name || "Unknown Trader"}
                                    </h1>
                                    <span className="px-2.5 py-1 rounded-full bg-white/15 text-white/95 text-[10px] md:text-xs font-bold uppercase tracking-wider border border-white/25 flex items-center gap-1.5 backdrop-blur-md">
                                        <Medal size={11} />
                                        Verified
                                    </span>
                                </div>

                                {/* Quote - Premium styling */}
                                <div className="relative max-w-md mx-auto">
                                    <div className="absolute -top-2 -left-1 text-white/20 text-3xl font-serif leading-none">&ldquo;</div>
                                    <p className="text-white/85 text-sm leading-relaxed italic px-4">
                                        {trade.shareDescription || "A disciplined approach to the markets. Tracking every trade to master the craft of scalping."}
                                    </p>
                                    <div className="absolute -bottom-3 -right-1 text-white/20 text-3xl font-serif leading-none">&rdquo;</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trade Card Section */}
                <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    <TradeShareCard entry={trade} variant={trade.shareMode as "basic" | "full" || "full"} className="max-w-none" />
                </div>

                {/* CTA Block - Premium */}
                <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 md:p-8 text-center group hover:border-primary/20 transition-all duration-500 shadow-xl shadow-gray-200/50">
                        {/* Top accent line */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent"></div>
                        {/* Radial glow */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,189,114,0.03),transparent_50%)]"></div>

                        <div className="relative z-10 flex flex-col items-center gap-5 md:gap-7">
                            <div className="space-y-3 md:space-y-4">
                                <p className="text-primary/80 text-xs font-bold uppercase tracking-[0.2em]">Free Forever</p>
                                <h2 className="text-2xl md:text-4xl font-black text-gray-800 tracking-tight">
                                    Start Your Trading Journal
                                </h2>
                                <p className="text-gray-500 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                                    Join traders who are mastering their psychology and strategy with TheNextTrade.
                                </p>
                            </div>

                            <Link href="/auth/signup">
                                <Button className="h-12 md:h-14 px-8 md:px-10 rounded-xl font-bold text-base md:text-lg bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
                                    Get Started Free
                                    <ArrowRight size={18} className="md:w-5 md:h-5 ml-2" />
                                </Button>
                            </Link>

                            {/* Social proof */}
                            <div className="flex items-center gap-6 text-xs text-gray-400 pt-2">
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 size={13} className="text-primary/60" />
                                    No credit card
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 size={13} className="text-primary/60" />
                                    MT5 Auto-Sync
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 size={13} className="text-primary/60" />
                                    AI Analytics
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

            </main>

            {/* Footer */}
            <footer className="py-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                    <span className="font-black text-gray-500 tracking-tight">
                        <span>TheNext</span><span className="text-primary">Trade</span>
                    </span>
                    <span>&middot;</span>
                    <span>&copy; {new Date().getFullYear()}</span>
                </div>
            </footer>
        </div>
    );
}
