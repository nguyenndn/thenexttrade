import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import {
    LegalPageShell,
    type LegalSectionItem,
} from "@/components/legal/LegalPageShell";
import { TELEGRAM_CHANNEL_URL } from "@/config/telegram";

export const metadata: Metadata = {
    title: "Privacy Policy — TheNextTrade",
    description:
        "How TheNextTrade collects, uses, and protects your personal and trading journal data. Transparent practices, lifetime journal retention while active, and full user control.",
    alternates: {
        canonical: "/legal/privacy-policy",
    },
    openGraph: {
        title: "Privacy Policy — TheNextTrade",
        description:
            "How TheNextTrade collects, uses, and protects your personal and trading journal data. Transparent practices, lifetime journal retention while active, and full user control.",
        url: "/legal/privacy-policy",
        siteName: "TheNextTrade",
        type: "website",
    },
};

const PRIVACY_SECTIONS: LegalSectionItem[] = [
    { id: "overview", label: "Overview" },
    { id: "controller", label: "Data Controller" },
    { id: "information-we-collect", label: "Information We Collect" },
    { id: "how-we-use-information", label: "How We Use Information" },
    { id: "security", label: "Security" },
    { id: "data-retention", label: "Data Retention" },
    { id: "data-sharing", label: "Data Sharing" },
    { id: "your-rights", label: "Your Rights" },
    { id: "legal-basis", label: "Legal Basis" },
    { id: "international-transfers", label: "International Transfers" },
    { id: "complaints", label: "Right to Complain" },
    { id: "children", label: "Children's Privacy" },
    { id: "cookies", label: "Cookies" },
    { id: "contact", label: "Contact" },
];

export default function PrivacyPolicyPage() {
    return (
        <LegalPageShell
            title="Privacy Policy"
            lead="Effective June 1, 2026 · Plain-language summary of what we collect, why we collect it, and your full control over your Trading Journal data."
            sections={PRIVACY_SECTIONS}
            footerNote="This policy may change as the service evolves. When it does, we'll update the effective date at the top of this page."
            intro={
                <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-5 sm:p-6 shadow-sm">
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-600 dark:text-gold mb-3">
                        In short
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                            "TheNextTrade never sells or rents your personal or trading data.",
                            "Your synced MT5 trade history is kept permanently while your account is active.",
                            "You control cookie preferences and can export or delete your account at any time.",
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
            {/* Overview */}
            <section id="overview" className="pb-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5">
                    Overview
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    TheNextTrade is a free Trading Journal, analytics workspace,
                    and MT5 trading tool ecosystem. We don&apos;t sell your
                    personal information, we don&apos;t charge monthly
                    subscription fees, and we don&apos;t run third-party ad
                    networks. This page explains, in plain language, what we
                    collect when you use the website and MT5 software, why we
                    collect it, and what control you have over it.
                </p>
            </section>

            {/* Data Controller */}
            <section id="controller" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5">
                    Data Controller
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    The data controller responsible for processing and
                    safeguarding your personal data is{" "}
                    <strong className="font-bold text-gray-900 dark:text-white">
                        TheNextTrade Operations Desk
                    </strong>{" "}
                    (contactable at{" "}
                    <a
                        href="mailto:support@thenexttrade.com"
                        className="font-bold text-amber-600 dark:text-gold hover:underline"
                    >
                        support@thenexttrade.com
                    </a>{" "}
                    and via official Telegram{" "}
                    <a
                        href={TELEGRAM_CHANNEL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-amber-600 dark:text-gold hover:underline"
                    >
                        @GoldScalperNinja
                    </a>
                    ).
                </p>
            </section>

            {/* Information We Collect */}
            <section id="information-we-collect" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-3.5">
                    Information We Collect
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300 mb-3.5">
                    In accordance with global privacy standards (including GDPR
                    and applicable Personal Data Protection laws), we classify
                    the data we process into basic and sensitive categories:
                </p>
                <dl className="divide-y divide-gray-200 dark:divide-white/10 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-[#151925] overflow-hidden">
                    {[
                        [
                            "Basic account data",
                            "Name, email address, optional Telegram username, country/timezone, and interface preferences.",
                        ],
                        [
                            "Sensitive financial & trade telemetry",
                            "Read-only MT5 account numbers, broker server names, balance/equity snapshots, and trade execution history synced via your EA Sync Key or imported by you. We never request or store your broker master trading password or withdrawal credentials.",
                        ],
                        [
                            "Technical & optional analytics data",
                            "IP address, browser type, device metadata, security audit logs, and — only if you explicitly choose 'Accept All' on the Cookie Preferences banner — anonymized usage telemetry via Google Analytics 4.",
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

            {/* How We Use Information */}
            <section id="how-we-use-information" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5">
                    How We Use Information
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300 mb-3">
                    TheNextTrade uses the information described above strictly
                    to:
                </p>
                <ul className="space-y-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 list-disc pl-5">
                    <li>
                        Sync and compute your Trading Journal metrics, drawdown
                        diagnostics, AI behavioral insights, and software
                        license eligibility.
                    </li>
                    <li>
                        Verify Introducing Broker (IB) partner affiliation when
                        you apply to unlock complimentary Pro EAs and VIP access.
                    </li>
                    <li>
                        Send transactional emails for account verification,
                        security alerts, and critical system updates (marketing
                        notifications are sent only if you explicitly opt in).
                    </li>
                    <li>
                        Prevent fraud, unauthorized license sharing, and DDoS or
                        brute-force abuse.
                    </li>
                </ul>
            </section>

            {/* Security */}
            <section id="security" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5">
                    Security
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    TheNextTrade uses industry-standard security measures,
                    including SSL/TLS encrypted connections, Cloudflare DDoS
                    protection, hashed password storage, read-only EA sync
                    tokens, and strict row-level access controls.
                </p>
            </section>

            {/* Data Retention */}
            <section id="data-retention" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5">
                    Data Retention
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300 mb-3">
                    <strong className="font-bold text-gray-900 dark:text-white">
                        Trading Journal &amp; Account Data:
                    </strong>{" "}
                    Because TheNextTrade serves as your long-term trading
                    ledger, your profile, connected MT5 accounts, synced
                    trade history, journal notes, and software license keys are
                    retained continuously for as long as your account remains
                    active. We never auto-delete your trade history while your
                    account is open.
                </p>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300 mb-3">
                    <strong className="font-bold text-gray-900 dark:text-white">
                        User-Initiated Deletion:
                    </strong>{" "}
                    You can delete individual trades, disconnect MT5
                    accounts, or permanently delete your entire account and all
                    associated trade records at any time from your Dashboard
                    Settings.
                </p>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    <strong className="font-bold text-gray-900 dark:text-white">
                        Security &amp; System Logs:
                    </strong>{" "}
                    Server security logs, authentication audit trails, and
                    anti-abuse telemetry are retained for up to{" "}
                    <span className="tabular-nums font-bold text-gray-900 dark:text-white">
                        12 months
                    </span>{" "}
                    to fulfill cybersecurity and incident-response obligations
                    before automatic purging.
                </p>
            </section>

            {/* Data Sharing */}
            <section id="data-sharing" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5">
                    Data Sharing
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    <strong className="font-bold text-gray-900 dark:text-white">
                        TheNextTrade does not sell your data.
                    </strong>{" "}
                    Information is shared only with essential infrastructure
                    providers (Supabase for database/authentication, Cloudflare
                    for network security, transactional email delivery, and
                    Google Analytics 4 only when you consent to analytics
                    cookies) or where strictly required by applicable law.
                </p>
            </section>

            {/* Your Rights */}
            <section id="your-rights" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5">
                    Your Rights &amp; Response Timelines
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300 mb-3">
                    You have the right to be informed, access, rectify, export,
                    restrict processing, withdraw consent, or permanently delete
                    your personal data at any time via your Dashboard Settings
                    or by contacting us.
                </p>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    We acknowledge all formal privacy requests within{" "}
                    <span className="tabular-nums font-bold text-gray-900 dark:text-white">
                        2 business days
                    </span>
                    , fulfill data access or correction requests within{" "}
                    <span className="tabular-nums font-bold text-gray-900 dark:text-white">
                        10–15 days
                    </span>
                    , and complete consent withdrawal, processing restriction, or
                    full account deletion within{" "}
                    <span className="tabular-nums font-bold text-gray-900 dark:text-white">
                        15–20 days
                    </span>
                    .
                </p>
            </section>

            {/* Legal Basis */}
            <section id="legal-basis" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5">
                    Legal Basis for Processing
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300 mb-3">
                    We rely on the following legal bases under GDPR and
                    applicable international data protection frameworks:
                </p>
                <ul className="space-y-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 list-disc pl-5">
                    <li>
                        <strong className="font-bold text-gray-900 dark:text-white">
                            Explicit Consent
                        </strong>{" "}
                        — when you register an account, connect an MT5
                        account for journal synchronization, opt in to
                        notifications, or click &ldquo;Accept All&rdquo; on our
                        cookie banner. You may withdraw consent at any time.
                    </li>
                    <li>
                        <strong className="font-bold text-gray-900 dark:text-white">
                            Service Performance &amp; Security
                        </strong>{" "}
                        — protecting the platform against fraud/abuse and
                        verifying Introducing Broker (IB) eligibility so we can
                        provide software tools and community resources for free.
                    </li>
                </ul>
            </section>

            {/* International Transfers */}
            <section id="international-transfers" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5">
                    Where Your Data Is Stored
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    Our cloud database, hosting, and security providers operate
                    globally distributed infrastructure (including outside the
                    EEA and Asia-Pacific jurisdictions). Where personal data is
                    transferred across borders, we apply encryption in transit
                    and at rest alongside Standard Contractual Clauses (SCCs)
                    and statutory cross-border data protection safeguards.
                </p>
            </section>

            {/* Complaints */}
            <section id="complaints" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5">
                    Right to Lodge a Complaint
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    If you believe our processing of your personal data violates
                    applicable data protection law, you have the right to contact
                    us directly for immediate resolution or lodge a complaint
                    with the competent data protection supervisory authority in
                    your jurisdiction of residence.
                </p>
            </section>

            {/* Children's Privacy */}
            <section id="children" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5">
                    Children&apos;s Privacy
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    TheNextTrade is intended strictly for adults aged{" "}
                    <span className="tabular-nums font-semibold text-gray-800 dark:text-gray-200">
                        18
                    </span>{" "}
                    and older due to the nature of financial markets. We do not
                    knowingly collect personal data from anyone under 18. If you
                    believe we have inadvertently collected data from a minor,
                    please contact us immediately and we will delete it
                    promptly.
                </p>
            </section>

            {/* Cookies */}
            <section id="cookies" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5">
                    Cookies
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    TheNextTrade uses strictly necessary cookies to keep you
                    signed in and remember your interface settings, and optional
                    analytics cookies (Google Analytics 4 with IP anonymization)
                    only when you explicitly click &ldquo;Accept All&rdquo; on
                    our Cookie Preferences banner. You can choose{" "}
                    <strong className="font-bold text-gray-900 dark:text-white">
                        Essential Only
                    </strong>{" "}
                    at any time. Read our{" "}
                    <Link
                        href="/legal/cookie-policy"
                        className="font-bold text-amber-600 dark:text-gold hover:underline"
                    >
                        Cookie Policy
                    </Link>{" "}
                    for details.
                </p>
            </section>

            {/* Contact */}
            <section id="contact" className="pt-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5">
                    Contact
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    For privacy questions or data requests, contact us on
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
