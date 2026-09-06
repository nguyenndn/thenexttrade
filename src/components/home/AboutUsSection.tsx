import Link from "next/link";
import { ArrowRight, Quote, MessageCircle, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/button-variants";
import { TELEGRAM_CHANNEL_URL } from "@/config/telegram";

export function AboutUsSection() {
    return (
        <div className="relative overflow-hidden border-t border-dashboard bg-slate-50/50 dark:bg-transparent py-12 sm:py-16">
            {/* Background decorative grids and gradients */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,rgba(128,128,128,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.06)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gold/10 dark:bg-gold/15 blur-[120px] rounded-full pointer-events-none -z-10" />

            <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0c0e14]/95 p-6 sm:p-8 lg:p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]">
                    {/* Top highlight bar */}
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-gold to-amber-600/70" />

                    {/* Main Layout: Horizontal layout on desktop */}
                    <div className="flex flex-col lg:flex-row lg:items-center gap-8 xl:gap-12 justify-between">
                        {/* Left Column: Story text and header */}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
                                Built from the tuition I paid the market,
                                <span className="block text-amber-500 dark:text-gold">
                                    engineered to protect your capital.
                                </span>
                            </h2>

                            <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600 dark:text-gray-300 max-w-xl font-normal">
                                I spent years blowing accounts before realizing one truth: manual discipline always breaks under market pressure. You don&apos;t need another magic indicator; you need an automated operating system that catches revenge lot sizes, tracks every tick without friction, and enforces consistent execution.
                            </p>
                        </div>

                        {/* Right Column: Quote panel and CTA Button */}
                        <div className="flex-shrink-0 flex flex-col gap-4 w-full lg:w-[460px]">
                            {/* Quote block */}
                            <div className="relative rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/70 dark:bg-amber-500/10 p-5">
                                <Quote
                                    size={18}
                                    className="absolute -top-2 left-4 text-amber-500 dark:text-gold"
                                />
                                <p className="pl-3 text-sm leading-relaxed text-gray-700 dark:text-gray-200 italic">
                                    &ldquo;Stop relying on memory and willpower. Build a system that makes discipline inevitable.&rdquo;
                                </p>
                            </div>

                            {/* Action Button: Read My Story Only */}
                            <Link href="/about" className="w-full">
                                <Button className="w-full min-h-12 rounded-xl bg-gold px-6 text-sm font-extrabold text-white hover:bg-amber-600 shadow-[0_8px_20px_rgba(245,158,11,0.22)] hover:shadow-[0_12px_28px_rgba(245,158,11,0.32)] flex items-center justify-center animate-btn-shine">
                                    Read My Story{" "}
                                    <ArrowRight
                                        size={16}
                                        className="ml-1.5"
                                    />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Compact Integrated "Ready to build your trading edge?" Strip */}
                    <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                                <Zap size={14} className="text-gold" />
                                <span>Ready to build your trading edge?</span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs text-gray-500 dark:text-gray-400">
                                <span className="inline-flex items-center gap-1">
                                    <ShieldCheck size={13} className="text-emerald-500" />
                                    Free account
                                </span>
                                <span>·</span>
                                <span>Setup in minutes</span>
                                <span>·</span>
                                <span>Official community</span>
                            </div>
                        </div>

                        <a
                            href={TELEGRAM_CHANNEL_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonVariants({
                                variant: "outline",
                                className:
                                    "w-full sm:w-auto min-h-10 px-5 text-xs sm:text-sm font-bold text-gray-800 dark:text-white hover:border-[#2AABEE]/40 hover:text-[#2AABEE] transition-all duration-300 flex items-center justify-center gap-2 shrink-0",
                            })}
                        >
                            <MessageCircle size={15} className="text-[#2AABEE]" />
                            <span>Join Telegram</span>
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
