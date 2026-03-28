import { Metadata } from 'next';
import { Target, Shield, TrendingUp, Users, Globe2, ChevronRight } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/Button';
import { AboutTimeline } from '@/components/home/AboutTimeline';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { getAuthUser } from '@/lib/auth-cache';

export const metadata: Metadata = {
    title: 'About TheNextTrade — From Blown Accounts to Building the Platform I Wish I Had',
    description: 'The story behind TheNextTrade. After years of losses and scattered learning, I built a free forex education platform so new traders don\'t repeat my mistakes.',
    openGraph: {
        title: 'About TheNextTrade | My Journey from Losses to Building Free Trading Tools',
        description: 'From blown accounts to building the platform I wish I had — the personal story behind TheNextTrade.',
    },
};

export default async function AboutPage() {
    const user = await getAuthUser();
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0F1117] text-gray-900 dark:text-white overflow-hidden relative">

            {/* Background Glows */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

            <PublicHeader user={user} />

            <main className="py-24 relative z-10">
                {/* 1. Hero Section */}
                <section className="px-4 mb-20">
                    <ScrollReveal>
                        <div className="max-w-4xl mx-auto text-center space-y-8 mt-12">
                            <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/10 text-primary mb-2 ring-4 ring-primary/5">
                                <Globe2 size={40} strokeWidth={1.5} />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-900 dark:text-white leading-tight">
                                From Blown Accounts to <br className="hidden md:block"/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">Building What I Wished Existed</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
                                I lost everything chasing shortcuts. Then I spent years learning the hard way. This is why I built TheNextTrade &mdash; so you don&apos;t have to.
                            </p>
                        </div>
                    </ScrollReveal>
                </section>

                {/* 2. Timeline Journey (already has its own animations) */}
                <AboutTimeline />

                {/* 3. Mission & Vision */}
                <section className="px-4 mb-24 max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Mission */}
                        <ScrollReveal delay={0.1} direction="left">
                            <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-10 md:p-14 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group h-full">
                                <div className="absolute top-0 right-0 p-10 opacity-5 dark:opacity-[0.03] group-hover:opacity-10 dark:group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none">
                                    <Target size={200} />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-8">
                                        <Target size={32} />
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">My Mission</h2>
                                    <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                        To give every retail trader — regardless of budget — free access to the same quality tools and education that I spent years searching for. No paid signals. No get-rich-quick promises. Just real knowledge, structured learning, and honest resources.
                                    </p>
                                </div>
                            </div>
                        </ScrollReveal>

                        {/* Vision */}
                        <ScrollReveal delay={0.3} direction="right">
                            <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-10 md:p-14 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group h-full">
                                <div className="absolute top-0 right-0 p-10 opacity-5 dark:opacity-[0.03] group-hover:opacity-10 dark:group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none">
                                    <TrendingUp size={200} />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div className="w-16 h-16 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-8">
                                        <TrendingUp size={32} />
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">My Vision</h2>
                                    <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                        One platform where a new trader can learn everything — from what a pip is to building a complete trading system. A place where the knowledge isn&apos;t scattered, the tools aren&apos;t paywalled, and the path is clear from day one.
                                    </p>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </section>

                {/* 4. Core Values */}
                <section className="px-4 mb-24 max-w-6xl mx-auto">
                    <ScrollReveal>
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white">What I Believe In</h2>
                            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                                The principles that guide every feature I build.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: Shield, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-500/10", title: "No Shortcuts", desc: "I don't sell signals or promise overnight riches. Trading is a skill — it takes time, discipline, and real education to develop." },
                            { icon: TrendingUp, color: "text-primary", bg: "bg-emerald-100 dark:bg-primary/10", title: "Systems Over Gambling", desc: "Every tool and lesson on this platform teaches systematic, rule-based trading. Because consistent profits come from consistent processes." },
                            { icon: Users, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-500/10", title: "Free for Everyone", desc: "I built this because quality forex education shouldn't be expensive. The core tools, Academy, and knowledge base will always be free." }
                        ].map((item, i) => (
                            <ScrollReveal key={i} delay={0.15 * i} direction="up">
                                <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/5 rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 group h-full">
                                    <div className={`w-14 h-14 rounded-xl ${item.bg} ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                        <item.icon size={28} />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{item.title}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </section>

                {/* 5. CTA Bottom */}
                <section className="px-4 mb-10 max-w-4xl mx-auto">
                    <ScrollReveal>
                        <div className="bg-gradient-to-br from-gray-900 to-gray-950 dark:from-[#1E2028] dark:to-[#0A0D14] border border-gray-800 dark:border-white/10 rounded-3xl p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[500px] bg-primary/20 blur-[100px] pointer-events-none rounded-full" />

                            <div className="relative z-10 space-y-8">
                                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">Ready to Start Your Journey?</h2>
                                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                                    Don&apos;t make the mistakes I made. Start with the right tools, the right knowledge, and a clear path forward.
                                </p>
                                <Link
                                    href="/auth/register"
                                    className={buttonVariants({
                                        variant: 'primary',
                                        size: 'lg',
                                        className: "px-8 py-4 shadow-xl hover:shadow-primary/25 text-lg"
                                    })}
                                >
                                    <span>Join TheNextTrade — Free</span>
                                    <ChevronRight size={20} />
                                </Link>
                            </div>
                        </div>
                    </ScrollReveal>
                </section>

            </main>

            <SiteFooter />
        </div>
    );
}
