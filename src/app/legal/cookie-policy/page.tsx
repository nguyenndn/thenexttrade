import { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import {
    LegalPageShell,
    type LegalSectionItem,
} from "@/components/legal/LegalPageShell";
import { TELEGRAM_CHANNEL_URL } from "@/config/telegram";

export const metadata: Metadata = {
    title: "Cookie Policy — TheNextTrade",
    description:
        "How TheNextTrade uses essential cookies, local storage, and optional opt-in analytics cookies.",
    alternates: {
        canonical: "/legal/cookie-policy",
    },
    openGraph: {
        title: "Cookie Policy — TheNextTrade",
        description:
            "How TheNextTrade uses essential cookies, local storage, and optional opt-in analytics cookies.",
        url: "/legal/cookie-policy",
        siteName: "TheNextTrade",
        type: "website",
    },
};

const COOKIE_SECTIONS: LegalSectionItem[] = [
    { id: "what-are-cookies", label: "What Are Cookies?" },
    { id: "how-we-use-cookies", label: "How We Use Cookies" },
    { id: "cookie-categories", label: "Cookie Categories" },
    { id: "third-party-providers", label: "Service Providers" },
    { id: "your-choices", label: "Your Choices" },
    { id: "contact", label: "Contact" },
];

export default function CookiePolicyPage() {
    return (
        <LegalPageShell
            title="Cookie Policy"
            lead="Effective June 1, 2026 · How we use strictly necessary cookies, local storage, and optional opt-in analytics cookies."
            sections={COOKIE_SECTIONS}
            numbered={true}
            footerNote="We may update this Cookie Policy as our infrastructure evolves. When we do, we will update the effective date at the top of this page."
            intro={
                <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-5 sm:p-6 shadow-sm">
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-600 dark:text-gold mb-3">
                        In short
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                            "Essential cookies keep your Supabase login session and workspace secure.",
                            "Optional analytics cookies load only if you click 'Accept All' on the cookie banner.",
                            "Zero third-party advertising networks or cross-site ad profiling.",
                        ].map((point) => (
                            <li
                                key={point}
                                className="flex items-start gap-2.5 rounded-lg bg-gray-50/80 dark:bg-[#151925] border border-gray-200 dark:border-white/10 p-3.5 text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200"
                            >
                                <CheckCircle2
                                    size={16}
                                    className="text-emerald-500 shrink-0 mt-0.5"
                                    aria-hidden="true"
                                />
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            }
        >
            {/* 1. What Are Cookies? */}
            <section id="what-are-cookies" className="pb-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5 flex items-center gap-2">
                    <span className="tabular-nums text-amber-600 dark:text-gold">
                        1.
                    </span>
                    <span>What Are Cookies?</span>
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    Cookies are small text files placed on your device when you
                    visit a website. We use first-party cookies and browser
                    local storage to keep you signed in, protect your session
                    against unauthorized access, remember your interface
                    settings, and — if you explicitly opt in — measure aggregate
                    page performance.
                </p>
            </section>

            {/* 2. How We Use Cookies */}
            <section id="how-we-use-cookies" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5 flex items-center gap-2">
                    <span className="tabular-nums text-amber-600 dark:text-gold">
                        2.
                    </span>
                    <span>How We Use Cookies</span>
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    When you first visit TheNextTrade, our Cookie Preferences
                    banner lets you choose between{" "}
                    <strong className="font-bold text-gray-900 dark:text-white">
                        Essential Only
                    </strong>{" "}
                    and{" "}
                    <strong className="font-bold text-gray-900 dark:text-white">
                        Accept All
                    </strong>
                    . Optional analytics scripts remain disabled unless you
                    actively select &ldquo;Accept All&rdquo;. We never use
                    behavioral advertising networks or sell browsing profiles to
                    third parties.
                </p>
            </section>

            {/* 3. Cookie Categories */}
            <section id="cookie-categories" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-3.5 flex items-center gap-2">
                    <span className="tabular-nums text-amber-600 dark:text-gold">
                        3.
                    </span>
                    <span>Cookie Categories</span>
                </h2>
                <dl className="divide-y divide-gray-200 dark:divide-white/10 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-[#151925] overflow-hidden">
                    {[
                        [
                            "Strictly necessary (Always active)",
                            "Required for secure authentication, session persistence, CSRF protection, and access to your Trading Journal and Dashboard.",
                        ],
                        [
                            "Preferences & Local Storage (Always active)",
                            "Stores your selected theme (Dark or Light mode), cookie consent choice (tnt_cookie_consent), and calculator defaults.",
                        ],
                        [
                            "Optional Analytics (Opt-in only)",
                            "Google Analytics 4 cookies (_ga) with IP anonymization enabled, used to understand aggregate traffic and improve platform usability. Loaded only when you click 'Accept All'.",
                        ],
                    ].map(([term, desc]) => (
                        <div
                            key={term}
                            className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 p-4 text-sm"
                        >
                            <dt className="sm:col-span-4 font-bold text-gray-900 dark:text-white">
                                {term}
                            </dt>
                            <dd className="sm:col-span-8 text-gray-600 dark:text-gray-300 leading-relaxed">
                                {desc}
                            </dd>
                        </div>
                    ))}
                </dl>
            </section>

            {/* 4. Service Providers */}
            <section id="third-party-providers" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5 flex items-center gap-2">
                    <span className="tabular-nums text-amber-600 dark:text-gold">
                        4.
                    </span>
                    <span>Service Providers</span>
                </h2>
                <ul className="space-y-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 list-disc pl-5">
                    <li>
                        <strong className="font-bold text-gray-900 dark:text-white">
                            Supabase Auth (Essential):
                        </strong>{" "}
                        Places encrypted session tokens so your Trading Journal
                        remains securely tied to your account.
                    </li>
                    <li>
                        <strong className="font-bold text-gray-900 dark:text-white">
                            Cloudflare (Essential):
                        </strong>{" "}
                        Uses security tokens to filter malicious bot traffic and
                        protect the platform from DDoS attacks.
                    </li>
                    <li>
                        <strong className="font-bold text-gray-900 dark:text-white">
                            Google Analytics 4 (Optional, Opt-in):
                        </strong>{" "}
                        Collects anonymized page-view statistics only after you
                        grant consent via the Cookie Preferences banner.
                    </li>
                </ul>
            </section>

            {/* 5. Your Choices */}
            <section id="your-choices" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5 flex items-center gap-2">
                    <span className="tabular-nums text-amber-600 dark:text-gold">
                        5.
                    </span>
                    <span>Your Choices</span>
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    You can select{" "}
                    <strong className="font-bold text-gray-900 dark:text-white">
                        Essential Only
                    </strong>{" "}
                    when prompted on your first visit, or clear site data /
                    cookies at any time through your browser settings to reset
                    your Cookie Preferences banner. Blocking strictly necessary
                    authentication cookies will prevent you from signing in to
                    your dashboard.
                </p>
            </section>

            {/* 6. Contact */}
            <section id="contact" className="pt-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5 flex items-center gap-2">
                    <span className="tabular-nums text-amber-600 dark:text-gold">
                        6.
                    </span>
                    <span>Contact</span>
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    For questions about cookies or data storage, contact us on
                    Telegram at{" "}
                    <a
                        href={TELEGRAM_CHANNEL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-amber-600 dark:text-gold hover:underline"
                    >
                        @GoldScalperNinja
                    </a>{" "}
                    or by email at{" "}
                    <a
                        href="mailto:support@thenexttrade.com"
                        className="font-bold text-amber-600 dark:text-gold hover:underline"
                    >
                        support@thenexttrade.com
                    </a>
                    .
                </p>
            </section>
        </LegalPageShell>
    );
}
