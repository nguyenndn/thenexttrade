import Link from "next/link";
import { FOOTER_SECTIONS } from "./footer/footer-navigation-data";
import { FooterNavColumn } from "./footer/FooterNavColumn";
import { FooterSocialLinks } from "./footer/FooterSocialLinks";
import { FooterRiskWarning } from "./footer/FooterRiskWarning";

export function SiteFooter() {
    return (
        <footer
            id="site-footer"
            role="contentinfo"
            className="relative bg-slate-50 dark:bg-[#070a10] text-gray-700 dark:text-white border-t border-gray-200 dark:border-white/10 overflow-hidden transition-colors duration-200"
        >
            {/* Top Subtle Accent Line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

            <div className="w-full lg:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 relative z-10">
                {/* Top Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-12">
                    {/* Brand Section */}
                    <FooterSocialLinks />

                    {/* SEO Links Section */}
                    <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-0 sm:gap-8 lg:pl-12">
                        {FOOTER_SECTIONS.map((section) => (
                            <FooterNavColumn key={section.title} section={section} />
                        ))}
                    </div>
                </div>

                {/* Risk Warning & Disclaimer */}
                <FooterRiskWarning />

                {/* Bottom Row - Copyright & Legal */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm tabular-nums font-bold text-gray-600 dark:text-slate-500">
                        &copy; 2026 TheNextTrade. All rights reserved.
                    </p>
                    <div className="flex flex-wrap gap-4 sm:gap-6 justify-center items-center">
                        <Link
                            href="/legal/privacy-policy"
                            className="text-sm font-bold text-gray-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-gold transition-colors"
                        >
                            Privacy
                        </Link>
                        <Link
                            href="/legal/terms-of-service"
                            className="text-sm font-bold text-gray-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-gold transition-colors"
                        >
                            Terms
                        </Link>
                        <Link
                            href="/legal/cookie-policy"
                            className="text-sm font-bold text-gray-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-gold transition-colors"
                        >
                            Cookies
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
