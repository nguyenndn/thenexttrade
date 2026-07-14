import { Metadata } from 'next';
import { Target, Shield, TrendingUp, Users, Globe2, ChevronRight, Send, Mail } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button-variants';
import { AboutTimeline } from '@/components/home/AboutTimeline';
import { ScrollReveal } from '@/components/ui/ScrollReveal';


export const metadata: Metadata = {
 title: 'About TheNextTrade — From Blown Accounts to Building the Platform I Wish I Had',
 description: 'The story behind TheNextTrade. After years of losses and scattered learning, I built a free forex education platform so new traders don\'t repeat my mistakes.',
 openGraph: {
 title: 'About TheNextTrade | My Journey from Losses to Building Free Trading Tools',
 description: 'From blown accounts to building the platform I wish I had — the personal story behind TheNextTrade.',
 },
};

export default async function AboutPage() {

 return (
 <div className="min-h-screen bg-[#F7F4EC] dark:bg-transparent text-gray-700 dark:text-white overflow-hidden relative">

 {/* Premium brand background */}
 <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(245,158,11,0.16)_0%,rgba(255,255,255,0.72)_34%,rgba(16,185,129,0.10)_100%)] dark:bg-[linear-gradient(135deg,rgba(43,35,68,0.60)_0%,rgba(25,52,81,0.46)_48%,rgba(6,69,79,0.38)_100%)] pointer-events-none" />

 <PublicHeader />

 <main className="pt-24 pb-12 sm:pb-24 relative z-10">
 {/* 1. Hero Section */}
 <section className="px-4 mb-10 sm:mb-20">
 <ScrollReveal>
 <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 mt-6 sm:mt-12">
 <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/10 text-primary mb-2 ring-4 ring-primary/5">
 <Globe2 size={40} strokeWidth={1.5} />
 </div>
 <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-700 dark:text-white leading-tight">
 From Blown Accounts to <br className="hidden md:block"/>
 <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">Building What I Wished Existed</span>
 </h1>
 <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
 I lost everything chasing shortcuts. Then I spent years learning the hard way. This is why I built TheNextTrade &mdash; so you don&apos;t have to.
 </p>
 </div>
 </ScrollReveal>
 </section>

 {/* 2. Timeline Journey (already has its own animations) */}
 <AboutTimeline />

 {/* 3. Mission & Vision */}
 <section className="px-4 mb-12 sm:mb-24 max-w-6xl mx-auto">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 {/* Mission */}
 <ScrollReveal delay={0.1} direction="left">
 <div className="bg-gradient-to-br from-white to-emerald-50/50 dark:from-[#1E2028] dark:to-[#1a2520] border border-emerald-200/60 dark:border-primary/20 rounded-2xl p-10 md:p-14 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 relative overflow-hidden group h-full">
 <div className="absolute top-0 right-0 p-10 opacity-[0.04] dark:opacity-[0.03] group-hover:opacity-[0.08] dark:group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none">
 <Target size={200} />
 </div>
 <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-2xl pointer-events-none" />
 <div className="relative z-10 space-y-6">
 <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-400/10 text-primary flex items-center justify-center mb-8 ring-2 ring-primary/10">
 <Target size={32} />
 </div>
 <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">My Mission</h2>
 <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
 To give every retail trader — regardless of budget — free access to the same quality tools and education that I spent years searching for. No paid signals. No get-rich-quick promises. Just real knowledge, structured learning, and honest resources.
 </p>
 </div>
 </div>
 </ScrollReveal>

 {/* Vision */}
 <ScrollReveal delay={0.3} direction="right">
 <div className="bg-gradient-to-br from-white to-cyan-50/50 dark:from-[#1E2028] dark:to-[#1a2025] border border-cyan-200/60 dark:border-cyan-500/20 rounded-2xl p-10 md:p-14 shadow-sm hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-500 relative overflow-hidden group h-full">
 <div className="absolute top-0 right-0 p-10 opacity-[0.04] dark:opacity-[0.03] group-hover:opacity-[0.08] dark:group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none">
 <TrendingUp size={200} />
 </div>
 <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-cyan-400/10 to-transparent rounded-full blur-2xl pointer-events-none" />
 <div className="relative z-10 space-y-6">
 <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-400/10 text-cyan-500 flex items-center justify-center mb-8 ring-2 ring-cyan-500/10">
 <TrendingUp size={32} />
 </div>
 <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">My Vision</h2>
 <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
 One platform where a new trader can learn everything — from what a pip is to building a complete trading system. A place where the knowledge isn&apos;t scattered, the tools aren&apos;t paywalled, and the path is clear from day one.
 </p>
 </div>
 </div>
 </ScrollReveal>
 </div>
 </section>

 {/* 4. Core Values */}
 <section className="px-4 mb-12 sm:mb-24 max-w-6xl mx-auto">
 <ScrollReveal>
 <div className="text-center mb-16 space-y-4">
 <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-700 dark:text-white">What I Believe In</h2>
 <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
 The principles that guide every feature I build.
 </p>
 </div>
 </ScrollReveal>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 {[
 { icon: Shield, color: "text-blue-600 dark:text-blue-400", bg: "bg-gradient-to-br from-blue-100 to-indigo-50 dark:from-blue-500/15 dark:to-indigo-500/5", border: "border-blue-200/60 dark:border-blue-500/15", hoverBorder: "hover:border-blue-500/35 dark:hover:border-blue-500/30", hoverShadow: "hover:shadow-[0_12px_30px_rgba(59,130,246,0.03)] dark:hover:shadow-[0_12px_30px_rgba(59,130,246,0.01)]", title: "No Shortcuts", desc: "I don't sell signals or promise overnight riches. Trading is a skill — it takes time, discipline, and real education to develop." },
 { icon: TrendingUp, color: "text-emerald-600 dark:text-primary", bg: "bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-primary/15 dark:to-teal-500/5", border: "border-emerald-200/60 dark:border-primary/15", hoverBorder: "hover:border-emerald-500/35 dark:hover:border-primary/30", hoverShadow: "hover:shadow-[0_12px_30px_rgba(16,185,129,0.03)] dark:hover:shadow-[0_12px_30px_rgba(16,185,129,0.01)]", title: "Systems Over Gambling", desc: "Every tool and lesson on this platform teaches systematic, rule-based trading. Because consistent profits come from consistent processes." },
 { icon: Users, color: "text-amber-600 dark:text-amber-400", bg: "bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-500/15 dark:to-orange-500/5", border: "border-amber-200/60 dark:border-amber-500/15", hoverBorder: "hover:border-amber-500/35 dark:hover:border-gold/30", hoverShadow: "hover:shadow-[0_12px_30px_rgba(245,158,11,0.03)] dark:hover:shadow-[0_12px_30px_rgba(245,158,11,0.01)]", title: "Free for Everyone", desc: "I built this because quality forex education shouldn't be expensive. The core tools, Academy, and knowledge base will always be free." }
 ].map((item, i) => (
 <ScrollReveal key={i} delay={0.15 * i} direction="up">
 <div className={`bg-white/80 dark:bg-[#131622]/60 border border-amber-500/15 dark:border-white/[0.06] rounded-2xl p-8 shadow-sm hover:-translate-y-0.5 transition-all duration-300 h-full backdrop-blur-md overflow-hidden relative group ${item.hoverBorder} ${item.hoverShadow}`}>
 <div className={`w-14 h-14 rounded-xl ${item.bg} ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
 <item.icon size={28} />
 </div>
 <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-gold transition-colors">{item.title}</h3>
 <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
 </div>
 </ScrollReveal>
 ))}
 </div>
 </section>

 {/* 5. CTA Bottom */}
 <section className="px-4 mb-6 sm:mb-10 max-w-4xl mx-auto">
 <ScrollReveal>
 <div className="rounded-3xl p-10 md:p-16 text-center border border-amber-500/35 dark:border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] via-amber-50/70 to-orange-500/[0.08] dark:from-transparent dark:to-transparent dark:bg-white/[0.04] shadow-[0_20px_50px_rgba(245,158,11,0.08)] dark:shadow-[0_0_60px_rgba(245,158,11,0.06)] relative overflow-hidden backdrop-blur-md">
 {/* Futuristic Cyber-Grid Pattern */}
 <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(245,158,11,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.02)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
 
 {/* Glowing Tech Mesh Backdrop */}
 <div className="absolute -top-20 -right-20 w-80 h-80 bg-sky-400/[0.12] dark:bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />
 <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-400/[0.15] dark:bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

 <div className="relative z-10 space-y-8">
 <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-gray-900 via-gray-900 to-gray-700 dark:from-white dark:via-white dark:to-gray-300 leading-tight">Ready to Start Your Journey?</h2>
 <p className="text-sm sm:text-base md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
 Don&apos;t make the mistakes I made. Start with the right tools, the right knowledge, and a clear path forward.
 </p>
 <div className="grid grid-cols-1 sm:grid-cols-3 md:flex md:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-3xl mx-auto px-4">
 <Link
 href="/auth/signup"
 className="inline-flex min-h-[50px] sm:min-h-13 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-black px-6 sm:px-8 shadow-[0_4px_12px_rgba(245,158,11,0.20)] dark:shadow-[0_4px_12px_rgba(245,158,11,0.10)] hover:shadow-[0_4px_20px_rgba(245,158,11,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-sm sm:text-base group/btn w-full md:w-auto whitespace-nowrap"
 >
 <span>Join TheNextTrade — Free</span>
 <ChevronRight size={18} className="group-hover/btn:translate-x-0.5 transition-transform duration-300" />
 </Link>
 <Link
 href="/contact"
 className="inline-flex min-h-[50px] sm:min-h-13 items-center justify-center gap-2 rounded-xl border border-amber-500/35 bg-white/45 dark:bg-white/5 text-gray-800 dark:text-white hover:bg-white/80 dark:hover:bg-white/10 hover:border-amber-500/60 dark:hover:border-white/20 transition-all duration-300 font-black px-6 sm:px-8 text-sm sm:text-base hover:scale-[1.02] active:scale-[0.98] shadow-sm w-full md:w-auto whitespace-nowrap"
 >
 <Mail size={18} className="text-amber-500 dark:text-gold" />
 <span>Contact Us</span>
 </Link>
 <a
 href="https://t.me/GoldScalperNinja"
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex min-h-[50px] sm:min-h-13 items-center justify-center gap-2 rounded-xl border border-amber-500/35 bg-white/45 dark:bg-white/5 text-gray-800 dark:text-white hover:bg-white/80 dark:hover:bg-white/10 hover:border-amber-500/60 dark:hover:border-white/20 transition-all duration-300 font-black px-6 sm:px-8 text-sm sm:text-base hover:scale-[1.02] active:scale-[0.98] shadow-sm w-full md:w-auto whitespace-nowrap"
 >
 <Send size={18} className="text-amber-500 dark:text-gold" />
 <span>Join Telegram</span>
 </a>
 </div>
 </div>
 </div>
 </ScrollReveal>
 </section>

 </main>

 <SiteFooter />
 </div>
 );
}
