import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth-cache";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { buttonVariants } from "@/components/ui/Button";
import { FAQAccordion } from "@/components/tools/FAQAccordion";
import Link from "next/link";
import { FeedbackCarousel } from "@/components/community/FeedbackCarousel";
import {
 Send,
 BarChart3,
 BookOpen,
 Users,
 Crown,
 CheckCircle2,
 Star,
 MessageCircle,
 TrendingUp,
 ArrowRight,
 ChevronRight,
 Copy,
 GraduationCap,
 Trophy,
 Shield,
 Clock,
 Headphones,
 Bot,
 Sparkles,
 HelpCircle,
 Compass,
} from "lucide-react";

export const metadata: Metadata = {
 title: "Community — Gold Scalper Ninja | Free XAUUSD Signals & Analysis",
 description:
 "Join 12,000+ traders in the Gold Scalper Ninja Telegram community. Free daily XAUUSD analysis, trading signals, Price Action education, and VIP access — all from real trading experience.",
 openGraph: {
 title: "Gold Scalper Ninja Community — Free Gold Trading Signals",
 description:
 "Free daily XAUUSD analysis, signals & trading education. Join 12K+ traders. Get VIP access free with our partner broker.",
 },
 keywords: [
 "gold trading signals",
 "XAUUSD analysis",
 "free forex signals",
 "gold scalping",
 "price action trading",
 "telegram trading community",
 "copy trading",
 "VIP trading signals",
 ],
};

const TELEGRAM_URL = "https://t.me/GoldScalperNinja";
const BROKER_URL = "#"; // TODO: Replace with actual broker affiliate link

// ═══════ DATA ═══════

const freeFeatures = [
 {
 icon: BarChart3,
 title: "Daily Market Analysis",
 description:
 "Fresh XAUUSD analysis every morning — buy/sell zones, key levels, and market context. All mapped out so you can start your day prepared.",
 highlights: ["XAUUSD chart breakdown", "Buy & Sell potential zones", "Key support & resistance"],
 color: "text-amber-600 dark:text-gold",
 bg: "bg-gradient-to-br from-amber-100 to-orange-50 dark:from-gold/15 dark:to-orange-500/5",
 border: "border-amber-200/60 dark:border-gold/15",
 },
 {
 icon: Send,
 title: "Free Trading Signals",
 description:
 "No paywall for the basics. Free signals with clear entry, TP, and SL levels shared daily in the channel.",
 highlights: ["Clear entry & exit points", "Risk management included", "Real-time updates"],
 color: "text-emerald-600 dark:text-primary",
 bg: "bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-primary/15 dark:to-teal-500/5",
 border: "border-emerald-200/60 dark:border-primary/15",
 },
 {
 icon: BookOpen,
 title: "Education & Experience",
 description:
 "Real trading experience, not textbook theory. Price action, momentum trading, and the psychology behind every trade.",
 highlights: ["Price Action strategies", "Trading psychology", "Real experience sharing"],
 color: "text-amber-600 dark:text-gold",
 bg: "bg-gradient-to-br from-amber-100 to-orange-50 dark:from-gold/15 dark:to-orange-500/5",
 border: "border-amber-200/60 dark:border-gold/15",
 },
 {
 icon: Copy,
 title: "Copy Trading Available",
 description:
 "Follow professional strategies with automated copy trading. Connect your MT5 account and let verified strategies work for you.",
 highlights: ["Auto-copy to MT5", "Ultra-low latency", "Full fund control"],
 color: "text-emerald-600 dark:text-primary",
 bg: "bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-primary/15 dark:to-teal-500/5",
 border: "border-emerald-200/60 dark:border-primary/15",
 },
];

const vipBenefits = [
 { icon: TrendingUp, text: "3 - 7 Premium Signals daily" },
 { icon: BookOpen, text: "Ebook SMC (Smart Money Concept)" },
 { icon: Bot, text: "EA Trade Manager & EA GoldScalperNinja" },
 { icon: Clock, text: "24/7 Trader Room" },
 { icon: BarChart3, text: "Advanced Signals, Insights & Indicators" },
 { icon: Headphones, text: "1:1 Technical Support" },
];



const platformLinks = [
 {
 title: "Academy",
 description: "Learn trading from scratch with structured courses — from basics to advanced strategies.",
 icon: GraduationCap,
 href: "/dashboard/academy",
 color: "text-amber-600 dark:text-gold",
 bg: "bg-amber-500/10 dark:bg-gold/15",
 },
 {
 title: "Copy Trading",
 description: "Auto-copy professional strategies to your MT5 account with ultra-low latency.",
 icon: Copy,
 href: "/dashboard/copy-trading",
 color: "text-emerald-600 dark:text-primary",
 bg: "bg-emerald-500/10 dark:bg-primary/15",
 },
 {
 title: "Leaderboard",
 description: "See top traders, compare performance, and find the best strategies to follow.",
 icon: Trophy,
 href: "/dashboard/leaderboard",
 color: "text-amber-600 dark:text-gold",
 bg: "bg-amber-500/10 dark:bg-gold/15",
 },
];

const COMMUNITY_FAQ = [
 {
 question: "What is Gold Scalper Ninja?",
 answer: "A Telegram community of 12,000+ traders sharing daily XAUUSD analysis, trading signals, and real experience. Built by a Price Action & Momentum Trader who believes education should be accessible to everyone.",
 },
 {
 question: "Is it really free to join?",
 answer: "Yes! The free channel gives you daily market analysis, basic signals, and education content. No payment required — just join the Telegram channel and start learning.",
 },
 {
 question: "What's the difference between Free and VIP?",
 answer: "The free channel gives you daily analysis and basic signals. VIP gives you 3-7 signals daily, exclusive EAs, ebooks, 24/7 TraderRoom, and 1:1 support.",
 },
 {
 question: "Can I leave anytime?",
 answer: "Absolutely. No lock-in, no contracts. If you want to leave, just leave the Telegram group. No questions asked.",
 },
];

const VIP_FAQ = [
 {
 question: "Is VIP really free?",
 answer: "Yes! VIP access is 100% free. You just need to open a trading account with our partner broker using our referral link. No hidden fees, no subscription.",
 },
 {
 question: "Which broker do I need to use?",
 answer: "We partner with a regulated, reputable broker. Click the 'Open Account' button to sign up. Your funds stay in your own account — we never touch your money.",
 },
 {
 question: "What if I already have a broker account?",
 answer: "You can open an additional account with our partner broker specifically for trading with our signals. Many traders use multiple brokers.",
 },
 {
 question: "How quickly will I get VIP access?",
 answer: "Usually within a few hours after you send your account ID to our admin on Telegram. Sometimes even faster!",
 },
];

import fs from "fs";
import path from "path";

export default async function CommunityPage() {
 const user = await getAuthUser();
 const vipUrl = user ? "/dashboard" : "/auth/signup";

 // Dynamically read all feedback images in public/images/feedbacks
 let feedbackImages: string[] = [];
 try {
 const feedbacksDir = path.join(process.cwd(), "public", "images", "feedbacks");
 if (fs.existsSync(feedbacksDir)) {
 const files = fs.readdirSync(feedbacksDir);
 feedbackImages = files
 .filter(file => /\.(png|jpe?g|webp|gif)$/i.test(file))
 .map(file => `/images/feedbacks/${file}`);
 }
 } catch (error) {
 console.error("Failed to read feedback images:", error);
 }

 return (
 <div className="min-h-screen bg-slate-50 dark:bg-[#0F1117] text-gray-700 dark:text-white overflow-hidden relative">
 {/* Background Glows */}
 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#2AABEE]/5 dark:bg-[#2AABEE]/8 rounded-full blur-[120px] pointer-events-none" />
 <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-primary/5 dark:bg-primary/8 rounded-full blur-[120px] pointer-events-none" />

 <PublicHeader user={user} />

 <main className="pt-16 md:pt-24 pb-16 sm:pb-24 relative z-10">

 {/* ═══════ 1. HERO ═══════ */}
 <section className="px-4 sm:px-6 mb-10 sm:mb-16">
 <ScrollReveal>
 <div className="max-w-4xl mx-auto text-center space-y-5 sm:space-y-6 md:space-y-8 mt-6 md:mt-12">
 <div className="inline-flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#2AABEE]/10 border border-[#2AABEE]/20 ring-4 ring-[#2AABEE]/5">
 <Send size={14} className="text-[#2AABEE] sm:hidden" />
 <Send size={16} className="text-[#2AABEE] hidden sm:block" />
 <span className="text-[10px] sm:text-xs font-bold text-[#2AABEE] uppercase tracking-wider">Telegram Community</span>
 </div>

 <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-gray-800 dark:text-white leading-tight lg:whitespace-nowrap">
 Trade Gold with{" "}
 <span className="text-gold">
 Up to 90% Win Rate
 </span>
 </h1>

 <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed px-2 sm:px-0">
 Free daily analysis, trading signals, and real experience.
 No fluff, no fake promises. Just honest trading, every day.
 </p>

 {/* Stats inline */}
 <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 pt-2">
 {[
 { value: "12,000+", label: "Traders", icon: Users },
 { value: "3–7/day", label: "VIP Signals", icon: TrendingUp },
 { value: "24/7", label: "Live Updates", icon: Clock },
 { value: "Free", label: "To Join", icon: Sparkles },
 ].map((stat) => (
 <div key={stat.label} className="flex items-center gap-2 sm:gap-2.5">
 <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-white/5 border border-dashboard flex items-center justify-center shadow-sm">
 <stat.icon size={16} className="text-gold sm:hidden" />
 <stat.icon size={18} className="text-gold hidden sm:block" />
 </div>
 <div className="text-left">
 <div className="text-base sm:text-lg font-black text-gray-800 dark:text-white leading-none">{stat.value}</div>
 <div className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}</div>
 </div>
 </div>
 ))}
 </div>

 {/* CTA */}
 <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-4 px-2 sm:px-0">
 <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
 style={{ backgroundColor: "#2AABEE", color: "#ffffff" }}
 className="inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm rounded-xl shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 active:scale-95 hover:scale-[1.03] transition-all duration-300 hover:opacity-95"
 >
 <Send size={16} /> Join Telegram
 </a>
 <a href={vipUrl}
 className="inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 hover:scale-[1.03] active:scale-95 hover:from-amber-600 hover:to-orange-600 text-white"
 >
 <Crown size={16} /> Get VIP Free <ArrowRight size={14} />
 </a>
 </div>
 </div>
 </ScrollReveal>
 </section>

 {/* ═══════ 2. WHAT YOU GET (FREE) ═══════ */}
 <section className="px-4 sm:px-6 mb-10 sm:mb-16 max-w-6xl mx-auto">
 <ScrollReveal>
 <div className="text-center mb-12 space-y-4">
 <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-800 dark:text-white">
 Everything You Get — For Free
 </h2>
 <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
 No hidden costs for the core experience. Join the channel and start learning immediately.
 </p>
 </div>
 </ScrollReveal>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {freeFeatures.map((feature, i) => (
 <ScrollReveal key={i} delay={0.1 * i} direction="up">
 <div className="bg-white/80 dark:bg-[#131622]/80 border border-amber-500/15 dark:border-white/[0.06] hover:border-amber-500/35 dark:hover:border-gold/30 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-[0_12px_30px_rgba(245,158,11,0.05)] dark:hover:shadow-[0_12px_30px_rgba(245,158,11,0.02)] hover:-translate-y-1 transition-all duration-300 group h-full">
 <div className="flex items-start gap-5">
 <div className={`w-14 h-14 rounded-xl ${feature.bg} ${feature.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
 <feature.icon size={28} />
 </div>
 <div className="flex-1">
 <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{feature.title}</h3>
 <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{feature.description}</p>
 <ul className="space-y-2">
 {feature.highlights.map((h) => (
 <li key={h} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
 <CheckCircle2 size={14} className="text-primary shrink-0" />
 {h}
 </li>
 ))}
 </ul>
 </div>
 </div>
 </div>
 </ScrollReveal>
 ))}
 </div>
 </section>

 {/* ═══════ 4. VIP UPGRADE ═══════ */}
 <section id="vip-section" className="px-4 sm:px-6 mb-10 sm:mb-16 max-w-6xl mx-auto scroll-mt-16 md:scroll-mt-24">
 <ScrollReveal>
 <div className="rounded-2xl sm:rounded-3xl border border-amber-500/35 dark:border-amber-500/30 p-5 sm:p-6 md:p-8 relative overflow-hidden bg-gradient-to-br from-amber-500/[0.08] via-amber-50/70 to-orange-500/[0.08] dark:from-transparent dark:to-transparent dark:bg-[#0A0D16] shadow-[0_20px_50px_rgba(245,158,11,0.08)] dark:shadow-[0_0_50px_rgba(245,158,11,0.06)] backdrop-blur-md">
 {/* Futuristic Cyber-Grid Pattern */}
 <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(245,158,11,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.02)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
 
 {/* Glowing Tech Mesh Backdrop */}
 <div className="absolute -top-20 -right-20 w-80 h-80 bg-sky-400/[0.12] dark:bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />
 <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-400/[0.15] dark:bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

 <div className="relative z-10">
 <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
 <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.15)]">
 <Crown size={24} className="text-gold" />
 </div>
 <div>
 <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-amber-800 to-amber-950 dark:from-white dark:via-amber-100 dark:to-amber-400">VIP Group</h2>
 <p className="text-sm text-gray-600 dark:text-gray-400">
 Premium trading access — <span className="text-gold font-bold">completely free</span> with our partner broker
 </p>
 </div>
 </div>

 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/25 mb-5 shadow-[0_0_10px_rgba(245,158,11,0.05)]">
 <Shield size={14} className="text-gold" />
 <span className="text-xs font-bold text-amber-700 dark:text-amber-400">No subscription • No hidden fees • Free forever</span>
 </div>

 {/* Benefits grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
 {vipBenefits.map((b) => (
 <div key={b.text} className="flex items-center gap-3 bg-white/80 dark:bg-[#111625]/60 hover:bg-white/95 dark:hover:bg-[#151C30]/80 rounded-xl border border-amber-500/15 dark:border-white/[0.06] hover:border-amber-500/35 dark:hover:border-gold/30 p-3.5 shadow-[0_4px_12px_rgba(245,158,11,0.02)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] hover:shadow-[0_10px_25px_rgba(245,158,11,0.06)] dark:hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] hover:-translate-y-0.5 dark:hover:-translate-y-0 text-gray-800 dark:text-gray-200 transition-all duration-300">
 <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
 <b.icon size={16} className="text-gold" />
 </div>
 <span className="text-sm font-semibold dark:font-medium leading-snug">{b.text}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 </ScrollReveal>
 </section>

 {/* ═══════ 5. VIP FEEDBACK SCREENSHOT CAROUSEL ═══════ */}
 <ScrollReveal>
 <FeedbackCarousel images={feedbackImages} />
 </ScrollReveal>

 {/* ═══════ 6. PLATFORM LINKS ═══════ */}
 <section className="px-4 sm:px-6 mb-10 sm:mb-16 max-w-6xl mx-auto">
 <ScrollReveal>
 <div className="text-center mb-12 space-y-4">
 <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-800 dark:text-white">
 Explore the Platform
 </h2>
 <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
 More than just a Telegram channel — a full trading ecosystem.
 </p>
 </div>
 </ScrollReveal>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
 {platformLinks.map((p, i) => (
 <ScrollReveal key={i} delay={0.1 * i} direction="up">
 <Link href={p.href} className="bg-white/80 dark:bg-[#131622]/60 rounded-2xl border border-amber-500/15 dark:border-white/[0.06] p-4 sm:p-5 hover:border-amber-500/35 dark:hover:border-gold/30 hover:shadow-[0_12px_30px_rgba(245,158,11,0.03)] dark:hover:shadow-[0_12px_30px_rgba(245,158,11,0.01)] hover:-translate-y-0.5 transition-all duration-300 group flex flex-col h-full backdrop-blur-md">
 <div className="flex items-center gap-3 mb-3">
 <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${p.bg} ${p.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
 <p.icon size={18} className="sm:hidden" />
 <p.icon size={20} className="hidden sm:block" />
 </div>
 <h3 className="text-sm sm:text-base font-bold text-gray-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-gold transition-colors">{p.title}</h3>
 </div>
 <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1">{p.description}</p>
 <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-gold mt-3">
 Explore <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-300" />
 </span>
 </Link>
 </ScrollReveal>
 ))}
 </div>
 </section>

 {/* ═══════ 6.5 GET STARTED CALLOUT ═══════ */}
 <section className="px-4 sm:px-6 mb-10 sm:mb-16 max-w-6xl mx-auto">
 <ScrollReveal>
 {/* Premium Breek-style Callout Card */}
 <div className="relative p-5 sm:p-6 rounded-2xl border border-gold/25 dark:border-gold/15 bg-gradient-to-r from-gold/[0.04] to-amber-500/[0.02] dark:from-gold/[0.02] dark:to-transparent backdrop-blur-md shadow-md shadow-gold/[0.01] overflow-hidden group hover:border-gold/45 dark:hover:border-gold/30 hover:shadow-lg hover:shadow-gold/8 transition-all duration-500">
 {/* Soft decorative glow spot at the right */}
 <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-gold/15 to-amber-500/5 dark:from-gold/5 dark:to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
 
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
 <div className="flex items-start gap-3">
 <div className="mt-1 p-2 rounded-xl bg-gold/10 dark:bg-gold/15 text-gold group-hover:rotate-45 transition-transform duration-500">
 <Compass size={18} className="animate-pulse" />
 </div>
 <div>
 <h4 className="text-base font-extrabold text-gray-800 dark:text-white flex items-center gap-2">
 New here? <span className="text-gold">Start with the setup path</span>
 </h4>
 <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
 Create workspace, sync your trades, and review your edge. Follow our guided setup checklist to get started.
 </p>
 </div>
 </div>
 <Link
 href="/get-started"
 className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-black px-6 py-2.5 shadow-[0_4px_12px_rgba(245,158,11,0.25)] dark:shadow-[0_4px_12px_rgba(245,158,11,0.15)] hover:shadow-[0_4px_20px_rgba(245,158,11,0.4)] dark:hover:shadow-[0_4px_20px_rgba(245,158,11,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group/btn"
 >
 <span>Start Here</span>
 <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform duration-300" />
 </Link>
 </div>
 </div>
 </ScrollReveal>
 </section>

 {/* ═══════ 7. FAQ ═══════ */}
 <section className="px-4 sm:px-6 mb-10 sm:mb-16 max-w-6xl mx-auto">
 <ScrollReveal>
 <div className="text-center mb-12">
 <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-700 dark:text-white mb-3 tracking-tight">
 Frequently Asked Questions
 </h2>
 <p className="text-gray-600 dark:text-gray-500 text-base">
 Quick answers to common questions
 </p>
 </div>
 </ScrollReveal>

 <ScrollReveal>
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 <div>
 <div className="flex items-center gap-2 mb-4">
 <HelpCircle size={18} className="text-amber-500 dark:text-gold" />
 <h3 className="text-lg font-bold text-gray-700 dark:text-white">
 About the Community
 </h3>
 </div>
 <FAQAccordion items={COMMUNITY_FAQ} hoverClassName="hover:border-amber-500/30 dark:hover:border-amber-500/20 hover:shadow-md hover:shadow-amber-500/[0.02] dark:hover:shadow-amber-500/[0.01]" />
 </div>
 <div id="vip-faq" className="scroll-mt-16 md:scroll-mt-24">
 <div className="flex items-center gap-2 mb-4">
 <Crown size={18} className="text-amber-500 dark:text-gold" />
 <h3 className="text-lg font-bold text-gray-700 dark:text-white">
 VIP Access
 </h3>
 </div>
 <FAQAccordion items={VIP_FAQ} hoverClassName="hover:border-amber-500/30 dark:hover:border-amber-500/20 hover:shadow-md hover:shadow-amber-500/[0.02] dark:hover:shadow-amber-500/[0.01]" />
 </div>
 </div>
 </ScrollReveal>
 </section>

 {/* ═══════ 8. BOTTOM CTA ═══════ */}
 <section className="px-4 sm:px-6 mb-6 sm:mb-10 max-w-4xl mx-auto">
 <ScrollReveal>
 <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-16 text-center border border-amber-500/35 dark:border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] via-amber-50/70 to-orange-500/[0.08] dark:from-transparent dark:to-transparent dark:bg-[#0A0D16] shadow-[0_20px_50px_rgba(245,158,11,0.08)] dark:shadow-[0_0_60px_rgba(245,158,11,0.06)] relative overflow-hidden backdrop-blur-md">
 {/* Futuristic Cyber-Grid Pattern */}
 <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(245,158,11,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.02)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
 
 {/* Glowing Tech Mesh Backdrop */}
 <div className="absolute -top-20 -right-20 w-80 h-80 bg-sky-400/[0.12] dark:bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />
 <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-400/[0.15] dark:bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

 <div className="relative z-10 space-y-8">
 <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-gray-900 via-gray-900 to-gray-700 dark:from-white dark:via-white dark:to-gray-300 leading-tight">
 Ready to Join the Community?
 </h2>
 <p className="text-sm sm:text-base md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
 12,000+ traders are already learning and growing together. It&apos;s free, it&apos;s real,
 and we&apos;d love to have you.
 </p>
 <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 px-2 sm:px-0">
 <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
 style={{ backgroundColor: "#2AABEE", color: "#ffffff" }}
 className="inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm rounded-xl shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 active:scale-95 hover:scale-[1.03] transition-all duration-300 hover:opacity-95"
 >
 <Send size={16} /> Join Telegram
 </a>
 <a href={vipUrl}
 className="inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 hover:scale-[1.03] active:scale-95 hover:from-amber-600 hover:to-orange-600 text-white"
 >
 <Crown size={16} /> Get VIP Free <ArrowRight size={14} />
 </a>
 </div>
 <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Free to join • No spam • Leave anytime • Your funds stay in your account</p>
 </div>
 </div>
 </ScrollReveal>
 </section>

 </main>

 <SiteFooter />
 </div>
 );
}
