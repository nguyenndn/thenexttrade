import Link from "next/link";
import {
    Facebook,
    Send,
    Instagram,
    Youtube,
    LinkIcon,
    TrendingUp,
    FolderOpen,
    Mail,
    AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export function SiteFooter() {
    return (
        <footer
            id="site-footer"
            role="contentinfo"
            className="relative bg-slate-50 dark:bg-[#070a10] text-gray-700 dark:text-white border-t border-slate-200 dark:border-white/10 overflow-hidden transition-colors duration-300"
        >
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="absolute -top-[200px] -left-[200px] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-[20%] right-[-100px] w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full lg:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 relative z-10">
                {/* Top Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-12">
                    {/* Brand Section */}
                    <div className="lg:col-span-4 flex flex-col justify-between">
                        <div>
                            <Link href="/" className="inline-block mb-4">
                                <h4 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                                    TheNext<span className="text-amber-500 font-black">Trade</span>
                                </h4>
                            </Link>
                            <p className="text-base leading-relaxed font-semibold text-gray-600 dark:text-gray-400 mb-8">
                                Automated MT5 trade telemetry, institutional risk engines, and execution discipline for serious forex traders. Home of the <strong className="text-amber-500 font-bold">GoldScalperNinja</strong> trading community &amp; EA ecosystem.
                            </p>
                        </div>

                        {/* Socials & Contact */}
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-3">
                                {[
                                    {
                                        icon: Facebook,
                                        href: "https://facebook.com/thenexttrade",
                                        label: "Facebook",
                                    },
                                    {
                                        icon: Youtube,
                                        href: "https://youtube.com/@thenexttrade",
                                        label: "Youtube",
                                    },
                                    {
                                        icon: Send,
                                        href: "https://t.me/thenexttrade",
                                        label: "Telegram",
                                    },
                                    {
                                        icon: Instagram,
                                        href: "https://instagram.com/thenexttrade",
                                        label: "Instagram",
                                    },
                                ].map((social, i) => (
                                    <a
                                        key={i}
                                        href={social.href}
                                        aria-label={social.label}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border border-dashboard dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-slate-400 transition-all hover:text-primary hover:border-primary/30 hover:bg-primary/5 dark:hover:text-white dark:hover:border-primary/50 shadow-sm"
                                    >
                                        <social.icon size={18} />
                                    </a>
                                ))}
                            </div>
                            <a
                                href="mailto:support@thenexttrade.com"
                                className="text-base font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors flex items-center gap-2"
                            >
                                <Mail size={16} /> support@thenexttrade.com
                            </a>
                        </div>
                    </div>

                    {/* SEO Links Section */}
                    <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-0 sm:gap-8 lg:pl-12">
                        {/* Column 1: Academy & Insights */}
                        <div className="w-full">
                            {/* Mobile Accordion */}
                            <details className="sm:hidden group border-b border-dashboard">
                                <summary className="flex justify-between items-center font-bold text-gray-700 dark:text-white text-sm uppercase tracking-wider py-4 cursor-pointer list-none marker:hidden [&::-webkit-details-marker]:hidden">
                                    Academy & Insights
                                    <span className="transition group-open:rotate-180 text-gray-500">
                                        <svg
                                            fill="none"
                                            height="18"
                                            stroke="currentColor"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            viewBox="0 0 24 24"
                                            width="18"
                                        >
                                            <path d="M6 9l6 6 6-6"></path>
                                        </svg>
                                    </span>
                                </summary>
                                <ul className="space-y-3 px-2 pb-4">
                                    <li>
                                        <Link
                                            href="/academy"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Trading Academy
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/knowledge"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Knowledge Base
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/knowledge?category=market-analysis"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Market Analysis
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/knowledge?category=technical-analysis"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Technical Analysis
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/knowledge?category=trading-psychology"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Trading Psychology
                                        </Link>
                                    </li>
                                </ul>
                            </details>
                            {/* Desktop View */}
                            <div className="hidden sm:block">
                                <h4 className="font-bold text-gray-700 dark:text-white text-sm uppercase tracking-wider mb-6">
                                    Academy & Insights
                                </h4>
                                <ul className="space-y-3">
                                    <li>
                                        <Link
                                            href="/academy"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Trading Academy
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/knowledge"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Knowledge Base
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/knowledge?category=market-analysis"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Market Analysis
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/knowledge?category=technical-analysis"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Technical Analysis
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/knowledge?category=trading-psychology"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Trading Psychology
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Column 2: Trading Tools */}
                        <div className="w-full">
                            {/* Mobile Accordion */}
                            <details className="sm:hidden group border-b border-dashboard">
                                <summary className="flex justify-between items-center font-bold text-gray-700 dark:text-white text-sm uppercase tracking-wider py-4 cursor-pointer list-none marker:hidden [&::-webkit-details-marker]:hidden">
                                    Trading Tools
                                    <span className="transition group-open:rotate-180 text-gray-500">
                                        <svg
                                            fill="none"
                                            height="18"
                                            stroke="currentColor"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            viewBox="0 0 24 24"
                                            width="18"
                                        >
                                            <path d="M6 9l6 6 6-6"></path>
                                        </svg>
                                    </span>
                                </summary>
                                <ul className="space-y-3 px-2 pb-4">
                                    <li>
                                        <Link
                                            href="/tools/economic-calendar"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Economic Calendar
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/tools/market-hours"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Market Hours
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/tools/position-size-calculator"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Position Size Calculator
                                        </Link>
                                    </li>
                                </ul>
                            </details>
                            {/* Desktop View */}
                            <div className="hidden sm:block">
                                <h4 className="font-bold text-gray-700 dark:text-white text-sm uppercase tracking-wider mb-6">
                                    Trading Tools
                                </h4>
                                <ul className="space-y-3">
                                    <li>
                                        <Link
                                            href="/tools/economic-calendar"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Economic Calendar
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/tools/market-hours"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Market Hours
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/tools/position-size-calculator"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Position Size Calculator
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Column 3: Resources */}
                        <div className="w-full">
                            {/* Mobile Accordion */}
                            <details className="sm:hidden group border-b border-dashboard">
                                <summary className="flex justify-between items-center font-bold text-gray-700 dark:text-white text-sm uppercase tracking-wider py-4 cursor-pointer list-none marker:hidden [&::-webkit-details-marker]:hidden">
                                    Resources
                                    <span className="transition group-open:rotate-180 text-gray-500">
                                        <svg
                                            fill="none"
                                            height="18"
                                            stroke="currentColor"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            viewBox="0 0 24 24"
                                            width="18"
                                        >
                                            <path d="M6 9l6 6 6-6"></path>
                                        </svg>
                                    </span>
                                </summary>
                                <ul className="space-y-3 px-2 pb-4">
                                    <li>
                                        <Link
                                            href="/get-started"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Get Started
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/brokers"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Trusted Brokers
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/trading-systems"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Trading Systems
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/edge"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            About Edge Gamification
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/about"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            About Us
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/contact"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Contact Us
                                        </Link>
                                    </li>
                                </ul>
                            </details>
                            {/* Desktop View */}
                            <div className="hidden sm:block">
                                <h4 className="font-bold text-gray-700 dark:text-white text-sm uppercase tracking-wider mb-6">
                                    Resources
                                </h4>
                                <ul className="space-y-3">
                                    <li>
                                        <Link
                                            href="/get-started"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Get Started
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/brokers"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Trusted Brokers
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/trading-systems"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Trading Systems
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/edge"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            About Edge Gamification
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/about"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            About Us
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/contact"
                                            className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                        >
                                            Contact Us
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Risk Warning & Disclaimer - Horizontal Alert Box */}
                <div className="flex gap-4 p-5 rounded-2xl border border-amber-500/10 dark:border-amber-500/5 bg-amber-500/[0.02] dark:bg-amber-500/[0.01] text-left my-6">
                    {/* Circular warning icon */}
                    <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-500/90">
                        <AlertTriangle size={16} className="stroke-[2.5]" />
                    </div>

                    {/* Content block */}
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] sm:text-xs leading-relaxed font-semibold text-gray-500 dark:text-gray-400">
                            <span className="text-amber-600 dark:text-amber-500 font-black uppercase tracking-wider mr-1.5">
                                Risk Warning & Disclaimer:
                            </span>
                            Trading forex, cryptocurrencies, and CFDs carries a{" "}
                            <span className="text-amber-600 dark:text-amber-500 font-bold">
                                high level of risk
                            </span>{" "}
                            and may not be suitable for all investors. You may
                            lose more than your initial investment. Only trade
                            with money you can afford to lose. Past performance
                            is not indicative of future results. Please ensure
                            you fully understand the risks involved and seek
                            independent advice if necessary.
                        </p>
                    </div>
                </div>

                {/* Bottom Row - Copyright & Legal */}
                <div className="mt-8 pt-6 border-t border-dashboard dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm font-bold text-gray-600 dark:text-slate-500">
                        &copy; 2026 The Next Trade. All rights reserved.
                    </p>
                    <div className="flex flex-wrap gap-4 sm:gap-6 justify-center items-center">
                        <Link
                            href="/legal/privacy-policy"
                            className="text-sm font-bold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                        >
                            Privacy
                        </Link>
                        <Link
                            href="/legal/terms-of-service"
                            className="text-sm font-bold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                        >
                            Terms Of Service
                        </Link>
                        <Link
                            href="/legal/cookie-policy"
                            className="text-sm font-bold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                        >
                            Cookies
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
