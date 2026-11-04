import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSystemBySlug, TRADING_SYSTEMS_DATA } from "@/config/trading-systems-data";
import { TradingSystemsPageShell } from "@/components/trading-systems/TradingSystemsPageShell";
import { TradingSystemsDetailTabs } from "@/components/trading-systems/TradingSystemsDetailTabs";
import { TradingSystemMockPanel } from "@/components/trading-systems/TradingSystemMockPanel";
import { FAQAccordion } from "@/components/tools/FAQAccordion";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { JsonLd } from "@/components/seo/JsonLd";
import {
    ArrowLeft,
    Shield,
    HelpCircle,
    CheckCircle,
    UserPlus,
    KeyRound,
} from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import { buttonVariants } from "@/components/ui/button-variants";
import type { Metadata } from "next";

export function generateStaticParams() {
    return TRADING_SYSTEMS_DATA.map((sys) => ({
        slug: sys.slug,
    }));
}

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { slug } = await params;
    let system = getSystemBySlug(slug);

    if (!system) {
        const productById = await prisma.eAProduct.findUnique({
            where: { id: slug },
        }).catch(() => null);
        if (productById?.slug) {
            system = getSystemBySlug(productById.slug);
        }
    }

    if (!system) {
        return {
            title: "System Not Found | TheNextTrade",
        };
    }

    return {
        title: `${system.title} Specs & Parameters | TheNextTrade`,
        description: system.description,
        alternates: {
            canonical: `/trading-systems/${system.slug}`,
        },
        openGraph: {
            title: `${system.title} Specs & Parameters | TheNextTrade`,
            description: system.description,
            url: `/trading-systems/${system.slug}`,
            siteName: "TheNextTrade",
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: `${system.title} Specs & Parameters | TheNextTrade`,
            description: system.description,
        },
    };
}

export default async function TradingSystemDetailPage({ params }: PageProps) {
    const { slug } = await params;
    let system = getSystemBySlug(slug);

    if (!system) {
        const productById = await prisma.eAProduct.findUnique({
            where: { id: slug },
        }).catch(() => null);
        if (productById?.slug) {
            redirect(`/trading-systems/${productById.slug}`);
        }
        notFound();
    }

    const user = await getAuthUser();
    const isLoggedIn = !!user;
    if (slug !== system.slug) {
        redirect(`/trading-systems/${system.slug}`);
    }

    const features = system.functions;

    // Query database product stats if available
    const dbProduct = await prisma.eAProduct.findFirst({
        where: {
            slug:
                system.slug === "gsn-shadown-matrix"
                    ? { in: ["gsn-shadown-matrix", "gsn-phoenix-grid"] }
                    : system.slug,
        },
    });

    let displayVersion =
        system.version ||
        dbProduct?.version ||
        system.parameters.find((p) => p.name.toLowerCase() === "version")
            ?.defaultValue ||
        "1.0";
    if (displayVersion.startsWith("v")) {
        displayVersion = displayVersion.substring(1);
    }

    return (
        <TradingSystemsPageShell maxWidth="max-w-7xl">
            <JsonLd
                type="SoftwareApplication"
                data={{
                    name: system.title,
                    description: system.description,
                    operatingSystem: "Windows, MetaTrader 5",
                    applicationCategory: "FinanceApplication",
                    softwareVersion: displayVersion,
                    offers: {
                        "@type": "Offer",
                        price: "0",
                        priceCurrency: "USD",
                        availability: "https://schema.org/InStock",
                        description: "Available for eligible partner accounts",
                    },
                }}
            />
            {/* Back button & Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <Link
                    href="/trading-systems"
                    className="inline-flex items-center gap-2 text-xs font-bold text-gray-550 dark:text-gray-400 hover:text-gold transition-colors uppercase tracking-wider"
                >
                    <ArrowLeft size={14} />
                    Back to Systems
                </Link>
                <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                    TRADING SYSTEMS &bull; {system.platform} &bull;{" "}
                    {system.title.toUpperCase()}
                </div>
            </div>

            {/* Header Panel */}
            <div className="relative rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-6 md:p-8 shadow-sm mb-8 overflow-hidden">
                {/* Ambient background glow inside header */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-72 h-72 bg-gold/5 dark:bg-gold/[0.03] rounded-full blur-3xl pointer-events-none" />

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-stretch lg:gap-6 xl:gap-8 relative z-10">
                    <div className="min-w-0 flex flex-col h-full">
                        <div className="mb-3.5 flex min-w-0 flex-wrap items-center gap-2 shrink-0">
                            {/* Platform & Type Badge */}
                            <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-lg bg-gold/10 dark:bg-gold/15 text-gold border border-gold/25 shadow-[0_2px_10px_-3px_rgba(250,204,21,0.2)]">
                                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                                {system.platform}{" "}
                                {system.type === "AUTO_TRADE"
                                    ? "EXPERT ADVISOR"
                                    : "UTILITY"}
                            </span>

                            {/* Version Badge */}
                            <span className="inline-flex items-center font-mono tabular-nums text-[9px] font-black tracking-wider px-2.5 py-1 bg-gray-50/70 dark:bg-[#151925] text-gray-600 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-white/10 uppercase">
                                v{displayVersion}
                            </span>

                            {/* Verified Badge with Pulse */}
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-wider border border-emerald-500/25 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.2)]">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                </span>
                                <span>MT5 Verified</span>
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black font-heading tracking-tight text-gray-900 dark:text-white leading-tight shrink-0">
                            {system.title}
                        </h1>
                        <div
                            className="mt-3 flex-1 flex flex-col text-xs sm:text-[13px] leading-relaxed text-gray-600 dark:text-gray-300 tabular-nums"
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(
                                    system.longDescription
                                ),
                            }}
                        />
                    </div>

                    <div className="w-full shrink-0 flex justify-center lg:justify-end">
                        <TradingSystemMockPanel slug={system.slug} />
                    </div>
                </div>
            </div>

            {/* Detail Technical Tabs */}
            <div className="mb-8">
                <TradingSystemsDetailTabs
                    system={{
                        slug: system.slug,
                        title: system.title,
                        targetAsset: system.targetAsset,
                        strategyStyle: system.strategyStyle,
                        setupDifficulty: system.setupDifficulty,
                        recommendedLeverage: system.recommendedLeverage,
                        specHighlights: system.specHighlights,
                        logic: system.logic,
                        riskControls: system.riskControls,
                        colorTheme: system.colorTheme,
                        features: features,
                    }}
                />
            </div>

            {/* Main vertical stack */}
            <div className="space-y-8">
                {/* Unlock License (CTA Widget Banner) */}
                <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-6 md:p-8 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-gold/5 dark:bg-gold/[0.03] rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold border border-gold/25">
                                    <Shield size={18} />
                                </div>
                                <div>
                                    <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gold">
                                        <span>Partner Verified Access</span>
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white">
                                        Unlock License
                                    </h3>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-semibold mt-4">
                                This system is fully compiled and ready to
                                download. You can unlock your MT5 account
                                license key by opening and maintaining an
                                eligible account under our partner network.
                                Access is free and activated automatically upon
                                partner account verification.
                            </p>
                        </div>

                        <div className="shrink-0 min-w-[240px]">
                            {isLoggedIn ? (
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] font-black uppercase tracking-wider">
                                        <CheckCircle size={14} />
                                        <span>You are signed in</span>
                                    </div>
                                    <Link
                                        href="/dashboard/accounts"
                                        className={buttonVariants({
                                            variant: "gold",
                                            className:
                                                "w-full h-10 px-4 font-black text-xs sm:text-sm uppercase tracking-wider shadow-sm flex items-center justify-center gap-2",
                                        })}
                                    >
                                        <KeyRound size={15} className="shrink-0" />
                                        <span>Verify Partner Eligibility</span>
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2.5">
                                    <Link
                                        href="/auth/signup?next=/dashboard/accounts&source=trading_systems"
                                        className={buttonVariants({
                                            variant: "gold",
                                            className:
                                                "w-full h-10 px-4 font-black text-xs sm:text-sm uppercase tracking-wider shadow-sm flex items-center justify-center gap-2",
                                        })}
                                    >
                                        <UserPlus size={15} className="shrink-0" />
                                        <span>Sign Up for Eligibility</span>
                                    </Link>
                                    <Link
                                        href="/auth/login?next=/dashboard/accounts"
                                        className={buttonVariants({
                                            variant: "outline",
                                            className:
                                                "w-full h-10 px-4 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/15 hover:border-gold/40 text-gray-800 dark:text-gray-200 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2",
                                        })}
                                    >
                                        <span>Sign In</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Product-specific disclaimer */}
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/10 text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex items-start gap-2 relative z-10">
                        <Shield
                            size={14}
                            className="text-gold shrink-0 mt-0.5"
                        />
                        <div>
                            {system.slug === "goldscalperninja" && (
                                <p>
                                    Risk Note: GoldScalperNinja EA utilizes
                                    automated grid execution. Grid systems can
                                    increase market exposure quickly; ensure you
                                    configure strict daily loss limits and test
                                    on demo/cent environments before live
                                    deployment.
                                </p>
                            )}
                            {system.slug === "trade-manager" && (
                                <p>
                                    Usage Note: Trade Manager is an execution
                                    assistant tool. All trading decisions,
                                    manual entries, and risk parameters remain
                                    the sole responsibility of the user.
                                </p>
                            )}
                            {system.slug === "gsn-shadown-matrix" && (
                                <p>
                                    Risk Warning: GSN Shadow Matrix is an
                                    advanced grid and hedging system designed
                                    for experienced traders only. It uses
                                    aggressive multipliers and hedging cycles
                                    that carry high margin exposure risk.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* FAQ */}
                <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold border border-gold/25">
                            <HelpCircle size={18} />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white">
                            FAQ
                        </h3>
                    </div>

                    <FAQAccordion items={system.faqs} />
                </div>
            </div>
        </TradingSystemsPageShell>
    );
}
