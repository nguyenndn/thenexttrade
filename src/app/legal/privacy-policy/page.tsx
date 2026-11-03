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
        "How TheNextTrade collects, uses, and protects your personal data. Minimal collection, transparent practices, and short retention windows.",
    alternates: {
        canonical: "/legal/privacy-policy",
    },
    openGraph: {
        title: "Privacy Policy — TheNextTrade",
        description:
            "How TheNextTrade collects, uses, and protects your personal data. Minimal collection, transparent practices, and short retention windows.",
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
            lead="Effective June 1, 2026 · Plain-language summary of what we collect, why we collect it, and your full control over it."
            sections={PRIVACY_SECTIONS}
            footerNote="This policy may change as the service evolves. When it does, we'll update the effective date at the top of this page."
            intro={
                <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-5 sm:p-6 shadow-sm">
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-600 dark:text-gold mb-3">
                        In short
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                            "TheNextTrade does not sell your data.",
                            "Operational logs are automatically deleted after seven days.",
                            "You can request full deletion at any time from your dashboard settings.",
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
                    TheNextTrade is a free service. We don&apos;t sell your
                    personal information, we don&apos;t charge monthly
                    subscription fees, and we don&apos;t run third-party ads.
                    This page explains, in plain language, what we collect when
                    you use the site and MT5 software, why we collect it, and
                    what control you have over it. If anything here is unclear,
                    message us and we&apos;ll explain.
                </p>
            </section>

            {/* Data Controller */}
            <section id="controller" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5">
                    Data Controller
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    The data controller responsible for your personal data is
                    TheNextTrade. For privacy-related inquiries, contact us via
                    the details in the Contact section below.
                </p>
            </section>

            {/* Information We Collect (2-Column Definition List matching GPM) */}
            <section id="information-we-collect" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-3.5">
                    Information We Collect
                </h2>
                <dl className="divide-y divide-gray-200 dark:divide-white/10 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-[#151925] overflow-hidden">
                    {[
                        [
                            "Account information",
                            "Name, email address, Telegram username, and country.",
                        ],
                        [
                            "MT4/MT5 account & trade telemetry",
                            "Used to sync your Trading Journal analytics and verify that your trading account is registered under our Introducing Broker for exclusive EA & VIP access.",
                        ],
                        [
                            "Technical data",
                            "IP address, browser type, device information, and session metadata.",
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
                    TheNextTrade uses the information described above to:
                </p>
                <ul className="space-y-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 list-disc pl-5">
                    <li>
                        Provide your Trading Journal analytics and manage your
                        software licenses.
                    </li>
                    <li>
                        Send transactional emails for verification, approvals,
                        and product updates.
                    </li>
                    <li>
                        Prevent fraud and protect the service from abuse.
                    </li>
                    <li>Respond to your support requests.</li>
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
                    protection, secure password storage, and strict row-level
                    access controls. Automated abuse, unauthorized proxies, and
                    disposable email addresses are blocked at sign-up to reduce
                    abuse.
                </p>
            </section>

            {/* Data Retention */}
            <section id="data-retention" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5">
                    Data Retention
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300 mb-3">
                    Operational logs — including license validation records,
                    webhook heartbeat logs, session history, and read
                    notifications — are automatically deleted after{" "}
                    <strong className="font-bold text-gray-900 dark:text-white">
                        seven days
                    </strong>
                    .
                </p>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    Core account data (profile, journaled trades, MT5 accounts,
                    and license keys) is retained for as long as the account
                    remains active. You can request full deletion at any time
                    from your dashboard settings.
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
                    Information is shared only with essential service providers
                    (Supabase for database/authentication, Cloudflare for
                    security, and transactional email delivery) or where
                    required by applicable law.
                </p>
            </section>

            {/* Your Rights */}
            <section id="your-rights" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5">
                    Your Rights
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    You may request to view, update, export, or delete your
                    personal data at any time, or close your account, from your
                    dashboard settings. Requests are typically processed within
                    a few business days.
                </p>
            </section>

            {/* Legal Basis (GDPR) */}
            <section id="legal-basis" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5">
                    Why We&apos;re Allowed to Process This Data (GDPR)
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300 mb-3">
                    Because TheNextTrade is free and not a paid subscription
                    contract, we rely on two GDPR legal bases:
                </p>
                <ul className="space-y-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 list-disc pl-5">
                    <li>
                        <strong className="font-bold text-gray-900 dark:text-white">
                            Consent
                        </strong>{" "}
                        — by creating an account you ask us to provide the
                        service, and you can withdraw consent at any time by
                        deleting your account.
                    </li>
                    <li>
                        <strong className="font-bold text-gray-900 dark:text-white">
                            Legitimate interest
                        </strong>{" "}
                        — keeping the service secure (preventing abuse and
                        fraud) and verifying that accounts belong to our
                        Introducing Broker network so we can offer the software
                        and VIP access for free.
                    </li>
                </ul>
            </section>

            {/* International Transfers */}
            <section id="international-transfers" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5">
                    Where Your Data Is Stored
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    Our hosting and email providers operate servers outside the
                    European Economic Area (EEA). Where data crosses borders, we
                    rely on the European Commission&apos;s Standard Contractual
                    Clauses (SCCs) as the safeguard required by GDPR.
                </p>
            </section>

            {/* Complaints */}
            <section id="complaints" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5">
                    Right to Lodge a Complaint
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    If you believe our processing of your personal data violates
                    your rights under GDPR, you have the right to lodge a
                    complaint with the supervisory authority in your EU member
                    state of residence, place of work, or place of the alleged
                    infringement.
                </p>
            </section>

            {/* Children's Privacy */}
            <section id="children" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5">
                    Children&apos;s Privacy
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    TheNextTrade does not knowingly collect personal data from
                    anyone under the age of <span className="tabular-nums font-semibold text-gray-800 dark:text-gray-200">18</span>. If you believe we have
                    inadvertently collected data from a minor, please contact us
                    immediately and we will delete it promptly.
                </p>
            </section>

            {/* Cookies */}
            <section id="cookies" className="py-7 scroll-mt-28">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2.5">
                    Cookies
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    TheNextTrade uses essential cookies to keep you signed in
                    and remember your preferences. No third-party tracking or
                    advertising cookies are used. Read our{" "}
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
                    For privacy questions, contact us on Telegram at{" "}
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
