"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Download,
    Lock,
    Shield,
    Bot,
    SlidersHorizontal,
    Cpu,
    ListChecks,
    BookOpen,
    HelpCircle,
    ArrowRight,
    Server,
    AlertTriangle,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { EAProduct } from "@prisma/client";
import { getSystemBySlug } from "@/config/trading-systems-data";
import { TradingSystemsParamsTable } from "@/components/trading-systems/TradingSystemsParamsTable";
import { InstallationWizard } from "./InstallationWizard";

interface SystemDetailModalProps {
    product: EAProduct;
    isLocked: boolean;
    isOpen: boolean;
    onClose: () => void;
    onDownload: () => Promise<void>;
    downloading: boolean;
    initialTab?: string;
}

export function SystemDetailModal({
    product,
    isLocked,
    isOpen,
    onClose,
    onDownload,
    downloading,
    initialTab = "specs",
}: SystemDetailModalProps) {
    const router = useRouter();
    const system = getSystemBySlug(product.slug);
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        if (isOpen && initialTab) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    const guideType =
        product.type === "INDICATOR" ? "MT5_INDICATOR" : "MT5_EA";

    const specItems = system?.specHighlights?.length
        ? system.specHighlights
        : [
              {
                  label: "Target Instrument",
                  value: system?.targetAsset || "XAUUSD (Gold)",
              },
              {
                  label: "Execution Style",
                  value: system?.strategyStyle || "Automated Trend & Grid",
              },
              {
                  label: "Setup Difficulty",
                  value: system?.setupDifficulty || "Easy (5 min)",
              },
              {
                  label: "Recommended Leverage",
                  value: system?.recommendedLeverage || "1:100 or higher",
              },
          ];

    const navItems = [
        {
            id: "specs",
            num: "01",
            label: "Specifications",
            icon: ListChecks,
            category: "ARCHITECTURE & SPECS",
            title: "Specifications & Core Engine",
        },
        {
            id: "parameters",
            num: "02",
            label: `Parameters (${system?.parameters?.length || 0})`,
            icon: Cpu,
            category: "INPUT SETTINGS",
            title: "Configuration Parameters",
        },
        {
            id: "guide",
            num: "03",
            label: "Installation",
            icon: BookOpen,
            category: "SETUP WIZARD",
            title: "Step-by-Step Installation",
        },
        {
            id: "risk",
            num: "04",
            label: "Risk Management",
            icon: Shield,
            category: "CAPITAL PROTECTION",
            title: "Risk Controls & VPS Setup",
        },
        {
            id: "faqs",
            num: "05",
            label: "FAQs & Support",
            icon: HelpCircle,
            category: "KNOWLEDGE BASE",
            title: "Frequently Asked Questions",
        },
    ];

    const currentNavItem = navItems.find((n) => n.id === activeTab) || navItems[0];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl p-0 overflow-hidden bg-white dark:bg-[#12141C] border-dashboard dark:border-white/[0.08] h-[90vh] max-h-[860px] flex flex-col rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-dashboard dark:border-white/[0.08] bg-gray-50/70 dark:bg-[#151822]">
                    <DialogHeader>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 text-gold">
                                    {product.type === "MANUAL_ASSIST" ? (
                                        <SlidersHorizontal size={24} />
                                    ) : (
                                        <Bot size={24} />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <DialogTitle className="text-xl font-black uppercase tracking-tight text-gray-900 dark:text-white">
                                            {product.name}
                                        </DialogTitle>
                                        <span className="px-2 py-0.5 bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-[10px] font-semibold rounded-lg font-mono">
                                            v{product.version}
                                        </span>
                                        {(product as any).isFree ? (
                                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-semibold border border-amber-500/20">
                                                FREE
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-semibold border border-emerald-500/20">
                                                <Shield size={9} />
                                                MT5 VERIFIED
                                            </span>
                                        )}
                                    </div>
                                    <DialogDescription className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                                        {product.description ||
                                            system?.description ||
                                            "Institutional execution algorithm designed for disciplined trading."}
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Download & Access Action Surface */}
                    <div className="mt-3.5 p-3 sm:p-3.5 rounded-lg border border-dashboard dark:border-white/[0.08] bg-white dark:bg-[#161924] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                {isLocked ? (
                                    <Lock size={15} className="text-amber-500" />
                                ) : (
                                    <Shield size={15} className="text-emerald-500" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-white">
                                    <span>
                                        {isLocked
                                            ? "Institutional Partner License Required"
                                            : "Ready to Deploy • Compiled .ex5 Binary"}
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                    {isLocked
                                        ? "Connect your MT5 account under our partner network to unlock instant EA downloads."
                                        : "Licensed for all approved MT5 trading accounts in your profile."}
                                </p>
                            </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                            {isLocked ? (
                                <Button
                                    variant="gold"
                                    size="smd"
                                    onClick={() => {
                                        onClose();
                                        router.push(
                                            "/dashboard/accounts?action=add&intent=unlock-pro"
                                        );
                                    }}
                                    className="font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 h-8 px-3 text-xs"
                                >
                                    <span>Unlock Partner Pro</span>
                                    <ArrowRight size={13} />
                                </Button>
                            ) : (
                                <Button
                                    variant="gold"
                                    size="smd"
                                    disabled={downloading}
                                    onClick={onDownload}
                                    className="font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 h-8 px-3 text-xs"
                                >
                                    <Download
                                        size={13}
                                        className={
                                            downloading
                                                ? "animate-bounce"
                                                : ""
                                        }
                                    />
                                    <span>
                                        {downloading
                                            ? "Downloading..."
                                            : "Download EA (.ex5)"}
                                    </span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2-Column Body: Left Sidebar (Vertical Navigation) + Right Main Content */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
                    {/* Left Sidebar: CONTENTS (Vertical Navigation) */}
                    <div className="w-full md:w-60 lg:w-64 shrink-0 border-b md:border-b-0 md:border-r border-dashboard dark:border-white/[0.08] bg-gray-50/70 dark:bg-[#0F1118] flex flex-col">
                        <div className="px-5 py-3 border-b border-dashboard dark:border-white/[0.06] flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                CONTENTS
                            </span>
                            <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
                                {navItems.length} SECTIONS
                            </span>
                        </div>

                        {/* Navigation Items */}
                        <div className="flex md:flex-col overflow-x-auto md:overflow-y-auto p-2 sm:p-2.5 gap-1 scrollbar-none">
                            {navItems.map((item) => {
                                const isActive = activeTab === item.id;
                                const Icon = item.icon;
                                return (
                                    <Button
                                        variant="ghost"
                                        key={item.id}
                                        type="button"
                                        onClick={() => setActiveTab(item.id)}
                                        className={cn(
                                            "flex items-center justify-start gap-3 px-3 py-2.5 h-auto rounded-lg text-left text-xs transition-all duration-200 cursor-pointer shrink-0 md:shrink w-auto md:w-full font-normal",
                                            isActive
                                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/25 shadow-sm hover:bg-amber-500/15"
                                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/60 dark:hover:bg-white/[0.04]"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "text-[11px] font-mono font-bold tracking-wider",
                                                isActive
                                                    ? "text-amber-500"
                                                    : "text-gray-400 dark:text-gray-600"
                                            )}
                                        >
                                            {item.num}
                                        </span>
                                        <span className="truncate flex-1">{item.label}</span>
                                        <Icon
                                            size={14}
                                            className={cn(
                                                "shrink-0 hidden md:block",
                                                isActive
                                                    ? "text-amber-500"
                                                    : "text-gray-400 dark:text-gray-600 opacity-60"
                                            )}
                                        />
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Main Content Area */}
                    <div className="flex-1 overflow-y-auto p-5 sm:p-7 bg-white dark:bg-[#141620]">
                        {/* Dynamic Section Header */}
                        {currentNavItem && (
                            <div className="mb-6 pb-4 border-b border-dashboard dark:border-white/[0.08]">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                        <currentNavItem.icon size={13} />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 font-mono">
                                        {currentNavItem.num} • {currentNavItem.category}
                                    </span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                    {currentNavItem.title}
                                </h3>
                            </div>
                        )}

                        {/* Section 01: Specifications */}
                        {activeTab === "specs" && (
                            <div className="space-y-6">
                                {/* 2x2 Matrix Card */}
                                <div className="grid grid-cols-2 rounded-lg border border-dashboard dark:border-white/[0.08] bg-gray-50/50 dark:bg-white/[0.02] divide-x divide-y divide-dashboard dark:divide-white/[0.08] overflow-hidden">
                                    {specItems.map((spec, i) => (
                                        <div key={i} className="p-4">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                {spec.label}
                                            </p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1 break-words">
                                                {spec.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Features list */}
                                {system?.functions && system.functions.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3">
                                            Core Architecture &amp; Capabilities
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {system.functions.map((func, idx) => (
                                                <div
                                                    key={idx}
                                                    className="p-3.5 rounded-lg border border-dashboard dark:border-white/[0.08] bg-gray-50/40 dark:bg-white/[0.02]"
                                                >
                                                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                                                        {func.title}
                                                    </p>
                                                    <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                                        {func.desc}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Execution Logic Points */}
                                {system?.logic && system.logic.length > 0 && (
                                    <div className="p-4 rounded-xl border border-dashboard dark:border-white/[0.08] bg-gray-50/30 dark:bg-white/[0.01]">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                                            Execution Logic
                                        </h4>
                                        <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400 list-disc list-inside">
                                            {system.logic.map((item, idx) => (
                                                <li
                                                    key={idx}
                                                    className="leading-relaxed"
                                                >
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Section 02: Parameters */}
                        {activeTab === "parameters" && (
                            <div className="space-y-4">
                                {system?.parameters && system.parameters.length > 0 ? (
                                    <TradingSystemsParamsTable
                                        parameters={system.parameters}
                                    />
                                ) : (
                                    <div className="p-8 text-center text-xs text-gray-500">
                                        No parameters specified for this system.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Section 03: Installation Guide */}
                        {activeTab === "guide" && (
                            <div className="rounded-xl border border-dashboard dark:border-white/[0.08] p-4 bg-gray-50/30 dark:bg-white/[0.01]">
                                <InstallationWizard type={guideType} />
                            </div>
                        )}

                        {/* Section 04: Risk Management */}
                        {activeTab === "risk" && (
                            <div className="space-y-5">
                                {/* Important Risk Note callout mimicking Image 2 */}
                                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.05] dark:bg-amber-500/[0.08] flex items-start gap-3.5">
                                    <AlertTriangle
                                        className="text-amber-500 shrink-0 mt-0.5"
                                        size={18}
                                    />
                                    <div className="space-y-1">
                                        <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                            Important Risk Note
                                        </p>
                                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                                            Algorithmic trading entails capital risk. Always test this EA on a demo account first to understand its drawdown profile, basket dynamics, and lot multiplication before deploying live capital. Never disable hard equity stop-loss limits.
                                        </p>
                                    </div>
                                </div>

                                {/* VPS Continuous Execution Notice */}
                                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 flex items-start gap-3">
                                    <Server
                                        size={18}
                                        className="text-emerald-500 shrink-0 mt-0.5"
                                    />
                                    <div>
                                        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                                            VPS Continuous Execution Recommended
                                        </p>
                                        <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                                            For automated Expert Advisors, running on a low-latency Virtual Private Server ensures 24/7 uptime without risk of home internet drops or power interruptions.
                                        </p>
                                    </div>
                                </div>

                                {/* Risk Controls */}
                                {system?.riskControls && system.riskControls.length > 0 && (
                                    <div className="space-y-2 pt-2">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                            Capital Protection &amp; Risk Controls
                                        </h4>
                                        <div className="space-y-2">
                                            {system.riskControls.map((ctrl, idx) => (
                                                <div
                                                    key={idx}
                                                    className="p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.03] text-xs"
                                                >
                                                    <span className="font-bold text-gray-900 dark:text-white">
                                                        {ctrl.title}:{" "}
                                                    </span>
                                                    <span className="text-gray-600 dark:text-gray-400">
                                                        {ctrl.desc}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Section 05: FAQs & Support */}
                        {activeTab === "faqs" && (
                            <div className="space-y-4">
                                {system?.faqs && system.faqs.length > 0 ? (
                                    <div className="space-y-3">
                                        {system.faqs.map((faq, idx) => (
                                            <div
                                                key={idx}
                                                className="p-4 rounded-lg border border-dashboard dark:border-white/[0.08] bg-gray-50/40 dark:bg-white/[0.02]"
                                            >
                                                <p className="text-xs font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-[10px] font-bold">
                                                        Q
                                                    </span>
                                                    <span>{faq.question}</span>
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 pl-7 leading-relaxed">
                                                    {faq.answer}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-xs text-gray-500">
                                        No frequently asked questions available for this system.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3.5 px-6 border-t border-dashboard dark:border-white/[0.08] bg-gray-50/70 dark:bg-[#151822] flex items-center justify-between">
                    <Button
                        variant="outline"
                        size="smd"
                        onClick={onClose}
                        className="font-bold h-8 px-4 text-xs"
                    >
                        Close
                    </Button>

                    <div className="flex items-center gap-2">
                        {isLocked ? (
                            <Button
                                variant="gold"
                                size="smd"
                                onClick={() => {
                                    onClose();
                                    router.push(
                                        "/dashboard/accounts?action=add&intent=unlock-pro"
                                    );
                                }}
                                className="font-bold flex items-center gap-1.5 h-8 px-4 text-xs"
                            >
                                <span>Unlock Partner Pro</span>
                                <ArrowRight size={13} />
                            </Button>
                        ) : (
                            <Button
                                variant="gold"
                                size="smd"
                                disabled={downloading}
                                onClick={onDownload}
                                className="font-bold flex items-center gap-1.5 h-8 px-4 text-xs"
                            >
                                <Download size={13} />
                                <span>
                                    {downloading
                                        ? "Downloading..."
                                        : "Download EA (.ex5)"}
                                </span>
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
