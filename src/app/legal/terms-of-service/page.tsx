import { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import {
    LegalPageShell,
    type LegalSectionItem,
} from "@/components/legal/LegalPageShell";
import { TELEGRAM_CHANNEL_URL } from "@/config/telegram";

export const metadata: Metadata = {
    title: "Terms of Service — TheNextTrade",
    description:
        "Terms governing your use of TheNextTrade's MT5 expert advisors, indicators, trading journal, and community tools. Review your rights, responsibilities, and acceptable use.",
    alternates: {
        canonical: "/legal/terms-of-service",
    },
    openGraph: {
        title: "Terms of Service — TheNextTrade",
        description:
            "Terms governing your use of TheNextTrade's MT5 expert advisors, indicators, trading journal, and community tools.",
        url: "/legal/terms-of-service",
        siteName: "TheNextTrade",
        type: "website",
    },
};

const TERMS_SECTIONS: LegalSectionItem[] = [
    { id: "agreement", label: "Agreement" },
    { id: "services", label: "Services Provided" },
    { id: "no-guarantees", label: "No Guarantees" },
    { id: "account", label: "Your Account" },
    { id: "license", label: "License Rules" },
    { id: "ib-requirement", label: "IB & Affiliate Disclosure" },
    { id: "restricted-jurisdictions", label: "Restricted Jurisdictions" },
    { id: "liability", label: "Limitation of Liability" },
    { id: "changes", label: "Changes & Termination" },
    { id: "contact", label: "Contact" },
];

export default function TermsOfServicePage() {
    return (
        <LegalPageShell
            title="Terms of Service"
            lead="Effective June 1, 2026 · Version 1.5"
            sections={TERMS_SECTIONS}
            numbered={true}
            footerNote="By registering an account on TheNextTrade, you explicitly confirm your acceptance of these terms."
            intro={
                <div
                    id="risk-warning"
                    className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] dark:bg-amber-500/[0.08] p-5 sm:p-6 flex items-start gap-3.5 shadow-xs"
                >
                    <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-gold shrink-0 mt-0.5">
                        <AlertTriangle size={18} aria-hidden="true" />
                    </div>
                    <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                        <strong className="font-black text-gray-900 dark:text-white">
                            Risk Warning.
                        </strong>{" "}
                        Trading forex, gold (XAUUSD), cryptocurrencies, and CFDs
                        involves significant risk. You may lose more than your
                        initial investment. Past performance does not guarantee
                        future results. Only trade with money you can afford to
                        lose.
                    </p>
                </div>
            }
        >
            {/* 1. Agreement */}
            <section id="agreement" className="pb-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5 flex items-center gap-2">
                    <span className="tabular-nums text-amber-600 dark:text-gold">
                        1.
                    </span>
                    <span>Agreement</span>
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    By registering for or accessing TheNextTrade&apos;s website,
                    trading journal, MT5 software, or community services, you
                    agree to these terms. You must be at least{" "}
                    <span className="tabular-nums font-semibold text-gray-800 dark:text-gray-200">
                        18
                    </span>{" "}
                    years old and acknowledge the inherent risks of leveraged
                    trading.
                </p>
            </section>

            {/* 2. Services Provided */}
            <section id="services" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5 flex items-center gap-2">
                    <span className="tabular-nums text-amber-600 dark:text-gold">
                        2.
                    </span>
                    <span>Services Provided</span>
                </h2>
                <ul className="space-y-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 list-disc pl-5">
                    <li>
                        Cloud-synced MT5 Trading Journal, AI behavioral
                        analytics, drawdown diagnostics, and verified
                        performance leaderboards.
                    </li>
                    <li>
                        Exclusive MT5 expert advisors, trade management
                        utilities, and risk management calculators.
                    </li>
                    <li>
                        Daily XAUUSD market analysis and community trade
                        discussions via Telegram.
                    </li>
                    <li>
                        License management and partner broker verification for
                        software and VIP access.
                    </li>
                </ul>
            </section>

            {/* 3. No Guarantees */}
            <section id="no-guarantees" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5 flex items-center gap-2">
                    <span className="tabular-nums text-amber-600 dark:text-gold">
                        3.
                    </span>
                    <span>No Guarantees</span>
                </h2>
                <ul className="space-y-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 list-disc pl-5">
                    <li>
                        TheNextTrade does not guarantee any trading profits or
                        specific financial outcomes.
                    </li>
                    <li>
                        TheNextTrade is a software and analytics provider, not a
                        licensed financial advisor or broker; all market
                        commentary, AI insights, and tools are strictly
                        informational and educational in nature.
                    </li>
                    <li>
                        You retain full custody of your broker account and are
                        solely responsible for your own trading decisions.
                    </li>
                </ul>
            </section>

            {/* 4. Your Account */}
            <section id="account" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5 flex items-center gap-2">
                    <span className="tabular-nums text-amber-600 dark:text-gold">
                        4.
                    </span>
                    <span>Your Account</span>
                </h2>
                <ul className="space-y-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 list-disc pl-5">
                    <li>
                        Provide accurate information when registering and
                        submitting MT5 account verification.
                    </li>
                    <li>
                        Keep your login credentials and EA Sync API keys secure.
                    </li>
                    <li>
                        Do not share your dashboard account or VIP access with
                        others.
                    </li>
                </ul>
            </section>

            {/* 5. License Rules */}
            <section id="license" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5 flex items-center gap-2">
                    <span className="tabular-nums text-amber-600 dark:text-gold">
                        5.
                    </span>
                    <span>License Rules</span>
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300 mb-3">
                    Your software license is personal and tied to your verified
                    MT5 account. You may not:
                </p>
                <ul className="space-y-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 list-disc pl-5 mb-3">
                    <li>Share, rent, or sell your license key or EA files.</li>
                    <li>
                        Reverse engineer, decompile, or modify the software.
                    </li>
                    <li>
                        Use unauthorized proxies or spoof account IDs to bypass
                        security controls.
                    </li>
                </ul>
                <p className="text-sm font-bold text-red-600 dark:text-red-400">
                    Violations result in permanent license and VIP revocation.
                </p>
            </section>

            {/* 6. IB & Affiliate Disclosure */}
            <section id="ib-requirement" className="py-7 scroll-mt-28">
                <div id="third-party-brokers" className="scroll-mt-28" />
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5 flex items-center gap-2">
                    <span className="tabular-nums text-amber-600 dark:text-gold">
                        6.
                    </span>
                    <span>IB &amp; Affiliate Disclosure</span>
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    TheNextTrade operates on a transparent Introducing Broker
                    (IB) and partner affiliate model. To unlock complimentary Pro
                    MT5 EAs and VIP community signals, your MT5 trading
                    account must be registered under TheNextTrade&apos;s
                    official partner link with a supported partner broker
                    (such as Exness, Vantage, IC Markets, or Tickmill). When you
                    trade through a partner link, we may receive standard IB
                    volume rebates directly from the broker at{" "}
                    <strong className="font-bold text-gray-900 dark:text-white">
                        zero additional spread or commission markup to you
                    </strong>
                    . Partner brokers are independent third-party institutions;
                    you should verify their regulatory status in your own
                    jurisdiction before opening an account.
                </p>
            </section>

            {/* 7. Restricted Jurisdictions */}
            <section id="restricted-jurisdictions" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5 flex items-center gap-2">
                    <span className="tabular-nums text-amber-600 dark:text-gold">
                        7.
                    </span>
                    <span>Restricted Jurisdictions</span>
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    The information, software tools, and partner broker links on
                    TheNextTrade are intended for global retail traders and are{" "}
                    <strong className="font-bold text-gray-900 dark:text-white">
                        not directed at or intended for distribution to, or use
                        by, any person in any country or jurisdiction where such
                        distribution, offshore brokerage solicitation, or
                        leveraged FX/CFD trading would be contrary to local law
                        or regulation
                    </strong>{" "}
                    (including the United States, Vietnam, and other restricted
                    territories). Visitors accessing this website are solely
                    responsible for complying with the laws and foreign-exchange
                    regulations applicable in their country of residence.
                </p>
            </section>

            {/* 8. Limitation of Liability */}
            <section id="liability" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5 flex items-center gap-2">
                    <span className="tabular-nums text-amber-600 dark:text-gold">
                        8.
                    </span>
                    <span>Limitation of Liability</span>
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    TheNextTrade is not liable for any trading losses, broker
                    slippage, third-party broker insolvency, technical outages,
                    or damages arising from the use of its software, analytics,
                    or community content. All use is strictly at your own risk.
                </p>
            </section>

            {/* 9. Changes & Termination */}
            <section id="changes" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5 flex items-center gap-2">
                    <span className="tabular-nums text-amber-600 dark:text-gold">
                        9.
                    </span>
                    <span>Changes &amp; Termination</span>
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    When we make material changes to these terms, we will update
                    the effective date at the top of this page and notify
                    registered users via dashboard notice or email in advance so
                    you may review the updated terms or close your account if
                    you disagree.
                </p>
            </section>

            {/* 10. Contact */}
            <section id="contact" className="pt-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5 flex items-center gap-2">
                    <span className="tabular-nums text-amber-600 dark:text-gold">
                        10.
                    </span>
                    <span>Contact</span>
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    For questions regarding these terms, contact us on Telegram
                    at{" "}
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
