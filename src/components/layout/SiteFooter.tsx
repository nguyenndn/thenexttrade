
import Link from "next/link";
import { Facebook, Send, Instagram, Youtube, LinkIcon, TrendingUp, FolderOpen, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function SiteFooter() {
    return (
        <footer id="site-footer" className="relative bg-slate-50 dark:bg-[#0d1117] text-gray-900 dark:text-white border-t border-gray-200 dark:border-transparent overflow-hidden transition-colors duration-300">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="absolute -top-[200px] -left-[200px] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-[20%] right-[-100px] w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full lg-plus:w-4/5 mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 relative z-10">
                {/* Top Section: Brand + 3 Link Columns + Newsletter */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 mb-12">
                    {/* Brand Column */}
                    <div className="lg:col-span-3 space-y-4">
                        <Link href="/" className="inline-block">
                            <h4 className="text-2xl font-bold text-gray-900 dark:text-white">The Next <span className="text-primary">Trade</span></h4>
                        </Link>
                        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                            Empowering global traders with institutional-grade data, expert education, and advanced analysis tools.
                             <br />
                                <span className="text-primary font-medium mt-2 block">Built for consistent profitability.</span>
                        </p>

                        <div className="flex gap-3 pt-2">
                            {[
                                { icon: Facebook, href: "#" },
                                { icon: Youtube, href: "#" },
                                { icon: Send, href: "#" },
                                { icon: Instagram, href: "#" },
                            ].map((social, i) => (
                                <a
                                    key={i}
                                    href={social.href}
                                    className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-all hover:text-primary hover:border-primary/50"
                                >
                                    <social.icon size={16} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="lg:col-span-2">
                        <h4 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white mb-4">
                            <LinkIcon size={16} className="text-primary" />
                            Quick Links
                        </h4>
                        <ul className="space-y-2.5">
                            <li><Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Home</Link></li>
                            <li><Link href="/dashboard/trading-systems" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">All Trading Systems</Link></li>
                            <li><Link href="/brokers" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Trusted Brokers</Link></li>
                            <li><Link href="/about" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">About Us</Link></li>
                            <li><Link href="/contact" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Popular Topics */}
                    <div className="lg:col-span-2">
                        <h4 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white mb-4">
                            <TrendingUp size={16} className="text-primary" />
                            Popular Topics
                        </h4>
                        <ul className="space-y-2.5">
                            <li><Link href="/knowledge?tag=forex" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Forex Trading</Link></li>
                            <li><Link href="/knowledge?tag=gold" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Gold Trading</Link></li>
                            <li><Link href="/knowledge?tag=scalping" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Scalping Strategies</Link></li>
                            <li><Link href="/knowledge?tag=risk-management" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Risk Management</Link></li>
                            <li><Link href="/knowledge?tag=psychology" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Trading Psychology</Link></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className="lg:col-span-2">
                        <h4 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white mb-4">
                            <FolderOpen size={16} className="text-primary" />
                            Resources
                        </h4>
                        <ul className="space-y-2.5">
                            <li><Link href="/academy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Trading Academy</Link></li>
                            <li><Link href="/knowledge" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Knowledge Base</Link></li>
                            <li><Link href="/analysis" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Market Analysis</Link></li>
                            <li><Link href="/economic-calendar" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Economic Calendar</Link></li>
                            <li><Link href="/tools/market-hours" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Market Hours</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter Box */}
                    <div className="lg:col-span-3">
                        <div className="bg-gray-50 dark:bg-[#161b22] rounded-xl p-5 border border-gray-200 dark:border-white/10 h-full">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-cyan-400 flex items-center justify-center">
                                    <Mail size={18} className="text-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">Stay Updated</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Join 25,000+ traders</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Your name"
                                    className="w-full bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-primary/50"
                                />
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    className="w-full bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-primary/50"
                                />
                                <button className="w-full py-2.5 rounded-lg font-bold text-white bg-gradient-to-r from-primary via-cyan-500 to-purple-500 hover:opacity-90 transition-opacity">
                                    Subscribe
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Risk Warning - Enhanced */}
                <div className="py-8 px-6 my-6 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 dark:from-amber-500/5 dark:via-orange-500/5 dark:to-red-500/5 border border-amber-500/20 dark:border-amber-500/10">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-amber-500 text-xl">⚠️</span>
                        </div>
                        <div>
                            <h5 className="font-bold text-amber-600 dark:text-amber-400 mb-2 text-sm uppercase tracking-wider">Risk Warning & Disclaimer</h5>
                            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                                Trading forex, cryptocurrencies, and CFDs carries a <strong className="text-amber-600 dark:text-amber-400">high level of risk</strong> and may not be suitable for all investors. You may lose more than your initial investment. Only trade with money you can afford to lose. Past performance is not indicative of future results. Please ensure you fully understand the risks involved and seek independent advice if necessary.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="pt-6 border-t border-gray-200 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-500">
                        &copy; 2026 The Next Trade. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link href="/legal/privacy-policy" className="text-xs text-gray-500 hover:text-primary transition-colors">Privacy</Link>
                        <Link href="/legal/terms-of-service" className="text-xs text-gray-500 hover:text-primary transition-colors">Terms</Link>
                        <Link href="/legal/cookie-policy" className="text-xs text-gray-500 hover:text-primary transition-colors">Cookies</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
