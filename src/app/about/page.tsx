import { Metadata } from 'next';
import { Target, Shield, TrendingUp, Users, Globe2, ChevronRight, BookOpen, Flame, Search, Rocket } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/Button';

export const metadata: Metadata = {
    title: 'About TheNextTrade — From Blown Accounts to Building the Platform I Wish I Had',
    description: 'The story behind TheNextTrade. After years of losses and scattered learning, I built a free forex education platform so new traders don\'t repeat my mistakes.',
    openGraph: {
        title: 'About TheNextTrade | My Journey from Losses to Building Free Trading Tools',
        description: 'From blown accounts to building the platform I wish I had — the personal story behind TheNextTrade.',
    },
};

const TIMELINE = [
    {
        phase: "01",
        icon: Flame,
        color: "text-red-500",
        bg: "bg-red-100 dark:bg-red-500/10",
        borderColor: "border-red-200 dark:border-red-500/20",
        accentColor: "from-red-500 to-orange-500",
        title: "The Pink Glasses",
        period: "The Beginning",
        story: "A friend introduced me to forex, and everything looked rosy. Every trade seemed to win. I felt invincible — like I had discovered a secret money machine. The charts moved, my balance grew, and I thought this was it."
    },
    {
        phase: "02",
        icon: Search,
        color: "text-amber-500",
        bg: "bg-amber-100 dark:bg-amber-500/10",
        borderColor: "border-amber-200 dark:border-amber-500/20",
        accentColor: "from-amber-500 to-red-500",
        title: "The Wake-Up Call",
        period: "Rock Bottom",
        story: "Then came the moment of truth. I went all in. Oversized lots. No stop loss. No plan. The market didn't care about my confidence — it took everything. I stared at a blown account and realized: I had been gambling, not trading. I had zero real knowledge."
    },
    {
        phase: "03",
        icon: BookOpen,
        color: "text-blue-500",
        bg: "bg-blue-100 dark:bg-blue-500/10",
        borderColor: "border-blue-200 dark:border-blue-500/20",
        accentColor: "from-blue-500 to-cyan-500",
        title: "The Hard Way",
        period: "Self-Education",
        story: "Desperate and broke, I chased the holy grail — magic indicators, secret strategies, paid signals. None of it worked. So I did the only thing left: I taught myself. But the knowledge was scattered across hundreds of sites, YouTube channels, and forums. There was no single structured path. It took years of pain, trial, and error — but slowly, the losses stopped, and I started seeing consistent profits."
    },
    {
        phase: "04",
        icon: Rocket,
        color: "text-primary",
        bg: "bg-emerald-100 dark:bg-primary/10",
        borderColor: "border-emerald-200 dark:border-primary/20",
        accentColor: "from-primary to-teal-400",
        title: "TheNextTrade",
        period: "The Solution",
        story: "After years of hard-won experience, I had one burning thought: no new trader should have to go through what I went through. The scattered knowledge, the scams, the loneliness of figuring it out alone — I wanted to change that. So I built TheNextTrade: a free, structured platform where everything a retail trader needs — tools, courses, knowledge, and community — lives in one place."
    },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0F1117] text-gray-900 dark:text-white overflow-hidden relative">

            {/* Background Glows */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

            <PublicHeader />

            <main className="py-24 relative z-10">
                {/* 1. Hero Section */}
                <section className="px-4 mb-20">
                    <div className="max-w-4xl mx-auto text-center space-y-8 mt-12">
                        <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/10 text-primary mb-2 ring-4 ring-primary/5">
                            <Globe2 size={40} strokeWidth={1.5} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-900 dark:text-white leading-tight">
                            From Blown Accounts to <br className="hidden md:block"/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">Building What I Wished Existed</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
                            I lost everything chasing shortcuts. Then I spent years learning the hard way. This is why I built TheNextTrade — so you don&apos;t have to.
                        </p>
                    </div>
                </section>

                {/* 2. Timeline Journey */}
                <section className="px-4 mb-24 max-w-5xl mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white">My Journey</h2>
                        <p className="text-lg text-gray-500 dark:text-gray-400">Four phases that shaped everything</p>
                    </div>

                    <div className="relative">
                        {/* Timeline vertical line */}
                        <div className="absolute left-6 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-300 via-amber-300 via-blue-300 to-primary/50 dark:from-red-500/30 dark:via-amber-500/30 dark:via-blue-500/30 dark:to-primary/30 hidden md:block" />
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-300 via-amber-300 via-blue-300 to-primary/50 dark:from-red-500/30 dark:via-amber-500/30 dark:via-blue-500/30 dark:to-primary/30 md:hidden" />

                        <div className="space-y-12 md:space-y-16">
                            {TIMELINE.map((item, idx) => {
                                const isLeft = idx % 2 === 0;
                                return (
                                    <div key={idx} className="relative">
                                        {/* Timeline dot */}
                                        <div className={`absolute left-6 md:left-1/2 -translate-x-1/2 w-12 h-12 rounded-full ${item.bg} ${item.color} flex items-center justify-center z-10 border-4 border-white dark:border-[#0F1117] shadow-lg`}>
                                            <item.icon size={20} strokeWidth={2.5} />
                                        </div>

                                        {/* Content card */}
                                        <div className={`ml-20 md:ml-0 md:w-[calc(50%-40px)] ${isLeft ? 'md:mr-auto md:pr-0' : 'md:ml-auto md:pl-0'}`}>
                                            <div className={`bg-white dark:bg-[#1E2028] border ${item.borderColor} rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 group`}>
                                                {/* Phase badge */}
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className={`text-xs font-black uppercase tracking-widest bg-gradient-to-r ${item.accentColor} bg-clip-text text-transparent`}>
                                                        Phase {item.phase}
                                                    </span>
                                                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                                                        {item.period}
                                                    </span>
                                                </div>

                                                <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
                                                    {item.title}
                                                </h3>

                                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                                    {item.story}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* 3. Mission & Vision */}
                <section className="px-4 mb-24 max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Mission */}
                        <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-10 md:p-14 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
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

                        {/* Vision */}
                        <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-10 md:p-14 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
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
                    </div>
                </section>

                {/* 4. Core Values */}
                <section className="px-4 mb-24 max-w-6xl mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white">What I Believe In</h2>
                        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                            The principles that guide every feature I build.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: Shield, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-500/10", title: "No Shortcuts", desc: "I don't sell signals or promise overnight riches. Trading is a skill — it takes time, discipline, and real education to develop." },
                            { icon: TrendingUp, color: "text-primary", bg: "bg-emerald-100 dark:bg-primary/10", title: "Systems Over Gambling", desc: "Every tool and lesson on this platform teaches systematic, rule-based trading. Because consistent profits come from consistent processes." },
                            { icon: Users, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-500/10", title: "Free for Everyone", desc: "I built this because quality forex education shouldn't be expensive. The core tools, Academy, and knowledge base will always be free." }
                        ].map((item, i) => (
                            <div key={i} className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/5 rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 group">
                                <div className={`w-14 h-14 rounded-xl ${item.bg} ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <item.icon size={28} />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{item.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5. CTA Bottom */}
                <section className="px-4 mb-10 max-w-4xl mx-auto">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-950 dark:from-[#1E2028] dark:to-[#0A0D14] border border-gray-800 dark:border-white/10 rounded-3xl p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[500px] bg-primary/20 blur-[100px] pointer-events-none rounded-full" />

                        <div className="relative z-10 space-y-8">
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">Ready to Start Your Journey?</h2>
                            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                                Don&apos;t make the mistakes I made. Start with the right tools, the right knowledge, and a clear path forward.
                            </p>
                            <Link
                                href="/register"
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
                </section>

            </main>

            <SiteFooter />
        </div>
    );
}
