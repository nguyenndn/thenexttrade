
import Link from "next/link";
import { Facebook, Send, Instagram, Youtube, LinkIcon, TrendingUp, FolderOpen, Mail, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function SiteFooter() {
    return (
        <footer id="site-footer" className="relative bg-slate-50 dark:bg-[#0d1117] text-gray-700 dark:text-white border-t border-gray-200 dark:border-transparent overflow-hidden transition-colors duration-300">
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
                                <h4 className="text-3xl font-black tracking-tight text-gray-700 dark:text-white">The Next <span className="text-primary">Trade</span></h4>
                            </Link>
                            <p className="text-base leading-relaxed text-gray-600 dark:text-gray-300 mb-8">
                                Empowering global traders with institutional-grade data, expert education, and advanced analysis tools.
                            </p>
                        </div>
                        
                        {/* Socials & Contact */}
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-3">
                                {[
                                    { icon: Facebook, href: "https://facebook.com/thenexttrade", label: "Facebook" },
                                    { icon: Youtube, href: "https://youtube.com/@thenexttrade", label: "Youtube" },
                                    { icon: Send, href: "https://t.me/thenexttrade", label: "Telegram" },
                                    { icon: Instagram, href: "https://instagram.com/thenexttrade", label: "Instagram" },
                                ].map((social, i) => (
                                    <a
                                        key={i}
                                        href={social.href}
                                        aria-label={social.label}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 transition-all hover:text-primary hover:border-primary/30 hover:bg-primary/5 hover:-translate-y-1 shadow-sm"
                                    >
                                        <social.icon size={18} />
                                    </a>
                                ))}
                            </div>
                            <a href="mailto:support@thenexttrade.com" className="text-base font-medium text-gray-600 hover:text-primary transition-colors flex items-center gap-2">
                                <Mail size={16} /> support@thenexttrade.com
                            </a>
                        </div>
                    </div>

                    {/* SEO Links Section */}
                    <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-0 sm:gap-8 lg:pl-12">
                        
                        {/* Column 1: Academy & Insights */}
                        <div className="w-full">
                            {/* Mobile Accordion */}
                            <details className="sm:hidden group border-b border-gray-200 dark:border-white/10">
                                <summary className="flex justify-between items-center font-bold text-gray-700 dark:text-white text-sm uppercase tracking-wider py-4 cursor-pointer list-none marker:hidden [&::-webkit-details-marker]:hidden">
                                    Academy & Insights
                                    <span className="transition group-open:rotate-180 text-gray-500">
                                        <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <ul className="space-y-3 px-2 pb-4">
                                    <li><Link href="/academy" className="text-sm text-gray-600 hover:text-primary transition-colors">Trading Academy</Link></li>
                                    <li><Link href="/knowledge" className="text-sm text-gray-600 hover:text-primary transition-colors">Knowledge Base</Link></li>
                                    <li><Link href="/analysis" className="text-sm text-gray-600 hover:text-primary transition-colors">Market Analysis</Link></li>
                                    <li><Link href="/knowledge?tag=technical-analysis" className="text-sm text-gray-600 hover:text-primary transition-colors">Technical Analysis</Link></li>
                                    <li><Link href="/knowledge?tag=psychology" className="text-sm text-gray-600 hover:text-primary transition-colors">Trading Psychology</Link></li>
                                </ul>
                            </details>
                            {/* Desktop View */}
                            <div className="hidden sm:block">
                                <h4 className="font-bold text-gray-700 dark:text-white text-sm uppercase tracking-wider mb-6">Academy & Insights</h4>
                                <ul className="space-y-3">
                                    <li><Link href="/academy" className="text-sm text-gray-600 hover:text-primary transition-colors">Trading Academy</Link></li>
                                    <li><Link href="/knowledge" className="text-sm text-gray-600 hover:text-primary transition-colors">Knowledge Base</Link></li>
                                    <li><Link href="/analysis" className="text-sm text-gray-600 hover:text-primary transition-colors">Market Analysis</Link></li>
                                    <li><Link href="/knowledge?tag=technical-analysis" className="text-sm text-gray-600 hover:text-primary transition-colors">Technical Analysis</Link></li>
                                    <li><Link href="/knowledge?tag=psychology" className="text-sm text-gray-600 hover:text-primary transition-colors">Trading Psychology</Link></li>
                                </ul>
                            </div>
                        </div>

                        {/* Column 2: Trading Tools */}
                        <div className="w-full">
                            {/* Mobile Accordion */}
                            <details className="sm:hidden group border-b border-gray-200 dark:border-white/10">
                                <summary className="flex justify-between items-center font-bold text-gray-700 dark:text-white text-sm uppercase tracking-wider py-4 cursor-pointer list-none marker:hidden [&::-webkit-details-marker]:hidden">
                                    Trading Tools
                                    <span className="transition group-open:rotate-180 text-gray-500">
                                        <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <ul className="space-y-3 px-2 pb-4">
                                    <li><Link href="/tools/economic-calendar" className="text-sm text-gray-600 hover:text-primary transition-colors">Economic Calendar</Link></li>
                                    <li><Link href="/tools/market-hours" className="text-sm text-gray-600 hover:text-primary transition-colors">Market Hours</Link></li>
                                    <li><Link href="/tools/risk-calculator" className="text-sm text-gray-600 hover:text-primary transition-colors">Risk Calculator</Link></li>
                                </ul>
                            </details>
                            {/* Desktop View */}
                            <div className="hidden sm:block">
                                <h4 className="font-bold text-gray-700 dark:text-white text-sm uppercase tracking-wider mb-6">Trading Tools</h4>
                                <ul className="space-y-3">
                                    <li><Link href="/tools/economic-calendar" className="text-sm text-gray-600 hover:text-primary transition-colors">Economic Calendar</Link></li>
                                    <li><Link href="/tools/market-hours" className="text-sm text-gray-600 hover:text-primary transition-colors">Market Hours</Link></li>
                                    <li><Link href="/tools/risk-calculator" className="text-sm text-gray-600 hover:text-primary transition-colors">Risk Calculator</Link></li>
                                </ul>
                            </div>
                        </div>

                        {/* Column 3: Resources */}
                        <div className="w-full">
                            {/* Mobile Accordion */}
                            <details className="sm:hidden group border-b border-gray-200 dark:border-white/10">
                                <summary className="flex justify-between items-center font-bold text-gray-700 dark:text-white text-sm uppercase tracking-wider py-4 cursor-pointer list-none marker:hidden [&::-webkit-details-marker]:hidden">
                                    Resources
                                    <span className="transition group-open:rotate-180 text-gray-500">
                                        <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <ul className="space-y-3 px-2 pb-4">
                                    <li><Link href="/brokers" className="text-sm text-gray-600 hover:text-primary transition-colors">Trusted Brokers</Link></li>
                                    <li><Link href="/dashboard/trading-systems" className="text-sm text-gray-600 hover:text-primary transition-colors">Trading Systems</Link></li>
                                    <li><Link href="/about" className="text-sm text-gray-600 hover:text-primary transition-colors">About Us</Link></li>
                                    <li><Link href="/contact" className="text-sm text-gray-600 hover:text-primary transition-colors">Contact Us</Link></li>
                                </ul>
                            </details>
                            {/* Desktop View */}
                            <div className="hidden sm:block">
                                <h4 className="font-bold text-gray-700 dark:text-white text-sm uppercase tracking-wider mb-6">Resources</h4>
                                <ul className="space-y-3">
                                    <li><Link href="/brokers" className="text-sm text-gray-600 hover:text-primary transition-colors">Trusted Brokers</Link></li>
                                    <li><Link href="/dashboard/trading-systems" className="text-sm text-gray-600 hover:text-primary transition-colors">Trading Systems</Link></li>
                                    <li><Link href="/about" className="text-sm text-gray-600 hover:text-primary transition-colors">About Us</Link></li>
                                    <li><Link href="/contact" className="text-sm text-gray-600 hover:text-primary transition-colors">Contact Us</Link></li>
                                </ul>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Risk Warning - Enhanced */}
                <div className="py-4 px-5 my-4 rounded-xl bg-orange-50/50 dark:bg-orange-500/5 border border-orange-500/20 dark:border-orange-500/20">
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <AlertTriangle size={16} className="text-orange-600 dark:text-orange-500" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h5 className="font-bold text-orange-600 dark:text-orange-400 mb-1.5 text-sm uppercase tracking-wider">Risk Warning & Disclaimer</h5>
                            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-500">
                                Trading forex, cryptocurrencies, and CFDs carries a <strong className="text-orange-600 dark:text-orange-400">high level of risk</strong> and may not be suitable for all investors. You may lose more than your initial investment. Only trade with money you can afford to lose. Past performance is not indicative of future results. Please ensure you fully understand the risks involved and seek independent advice if necessary.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Row - Copyright & Legal */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-500">
                        &copy; 2026 The Next Trade. All rights reserved.
                    </p>
                    <div className="flex flex-wrap gap-4 sm:gap-6 justify-center items-center">
                        <Link href="/legal/privacy-policy" className="text-sm font-bold text-gray-600 hover:text-primary transition-colors">Privacy</Link>
                        <Link href="/legal/terms-of-service" className="text-sm font-bold text-gray-600 hover:text-primary transition-colors">Terms Of Service</Link>
                        <Link href="/legal/cookie-policy" className="text-sm font-bold text-gray-600 hover:text-primary transition-colors">Cookies</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
