import { prisma } from "@/lib/prisma";
import { TradeShareCard } from "@/components/journal/TradeShareCard";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Medal } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";

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
            }
        }
    });

    if (!trade) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col font-sans selection:bg-blue-500/30">
            {/* Navbar / Header - Clean look */}
            <header className="absolute top-0 left-0 w-full z-50 p-6 flex justify-end">
                {/* Optional: Add a small branding or login button here if needed later, kept empty/minimal for now as requested */}
            </header>

            <main className="flex-1 container mx-auto px-4 py-12 md:py-20 flex flex-col items-center justify-center gap-10 md:gap-16">

                {/* User Profile Section */}
                <div className="w-full max-w-3xl flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="relative">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-white/10 overflow-hidden bg-gray-800">
                            {trade.user.image ? (
                                <Image
                                    src={trade.user.image}
                                    alt={trade.user.name || "User"}
                                    width={80}
                                    height={80}
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xl md:text-2xl font-bold text-gray-500">
                                    {(trade.user.name?.[0] || "U").toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full border-4 border-[#0B0E14]" title="Verified Trader">
                            <CheckCircle2 size={14} strokeWidth={3} className="md:w-4 md:h-4" />
                        </div>
                    </div>

                    <div className="text-center md:text-left space-y-2">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <h1 className="text-xl md:text-2xl font-bold">
                                {trade.user.name || "Unknown Trader"}
                            </h1>
                            <span className="px-2.5 py-0.5 md:px-3 md:py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] md:text-xs font-bold uppercase tracking-wider border border-blue-500/20 flex items-center gap-1.5">
                                <Medal size={12} />
                                Trade Verified
                            </span>
                        </div>
                        <p className="text-gray-400 max-w-lg text-sm leading-relaxed italic">
                            "{trade.shareDescription || "A disciplined approach to the markets. Tracking every trade to master the craft of scalping."}"
                        </p>
                    </div>
                </div>

                {/* Trade Card Section */}
                <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 mb-4 md:mb-8">
                    <TradeShareCard entry={trade} variant={trade.shareMode as "basic" | "full" || "full"} className="max-w-none" />
                </div>

                {/* Prominent Join Block */}
                <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-[#1E2028] to-[#0F1117] border border-white/5 p-6 md:p-12 text-center group hover:border-blue-500/30 transition-all duration-500 shadow-2xl shadow-black/50">
                        {/* Background Effects */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.1),transparent_50%)]"></div>

                        <div className="relative z-10 flex flex-col items-center gap-4 md:gap-6">
                            <div className="space-y-3 md:space-y-4">
                                <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-gray-400 bg-clip-text text-transparent">
                                    Start Your Trading Journal
                                </h2>
                                <p className="text-gray-400 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed">
                                    Join thousands of traders who are mastering their psychology and strategy with GSN Trading.
                                </p>
                            </div>

                            <Link href="/auth/register">
                                <Button className="h-12 md:h-14 px-8 md:px-10 rounded-xl font-bold text-base md:text-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 transition-all duration-300">
                                    Get Started Free
                                    <ArrowRight size={18} className="md:w-5 md:h-5 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

            </main>

            {/* Simple Footer Text */}
            <footer className="py-8 text-center text-xs text-gray-600">
                &copy; {new Date().getFullYear()} GSN Trading. All rights reserved.
            </footer>
        </div>
    );
}
