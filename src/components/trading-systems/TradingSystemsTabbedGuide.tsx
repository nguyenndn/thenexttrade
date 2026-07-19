"use client";

import React, { useState } from "react";
import {
    KeyRound,
    Wrench,
    Download,
    CheckCircle2,
    ArrowRight,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import Link from "next/link";

interface StepItem {
    step: string;
    title: string;
    description: string;
    icon?: React.ComponentType<any>;
}

const ACCESS_STEPS: StepItem[] = [
    {
        step: "01",
        icon: KeyRound,
        title: "Create account",
        description: "Sign up and open your dashboard.",
    },
    {
        step: "02",
        icon: Wrench,
        title: "Submit MT5 account",
        description: "Add the broker account you want to verify.",
    },
    {
        step: "03",
        icon: Download,
        title: "Unlock downloads",
        description: "Get the compiled files after approval.",
    },
    {
        step: "04",
        icon: CheckCircle2,
        title: "Install on MT5",
        description: "Deploy the preset and start algo trading.",
    },
];

const INSTALLATION_STEPS: StepItem[] = [
    {
        step: "01",
        title: "Download File",
        description:
            "Get the compiled `.ex5` file from your dashboard download tab once verified.",
    },
    {
        step: "02",
        title: "Deploy to MT5",
        description:
            "Open MT5, go to File > Open Data Folder, navigate to MQL5/Experts, and paste the file.",
    },
    {
        step: "03",
        title: "Allow DLL Imports",
        description:
            "Drag the EA onto your chart. In the settings window, check 'Allow DLL imports' and 'Allow Algo Trading'.",
    },
    {
        step: "04",
        title: "Load Preset File",
        description:
            "Apply the recommended `.set` preset file provided in your dashboard to load optimal parameters.",
    },
];

interface TabbedGuideProps {
    primaryCtaUrl: string;
}

export function TradingSystemsTabbedGuide({ primaryCtaUrl }: TabbedGuideProps) {
    const [activeTab, setActiveTab] = useState<"access" | "install">("access");

    const steps = activeTab === "access" ? ACCESS_STEPS : INSTALLATION_STEPS;

    return (
        <section className="mb-12 rounded-[2.5rem] border border-gold/15 bg-white/80 p-6 shadow-lg shadow-gold/[0.02] dark:border-white/5 dark:bg-[#111318]/45 sm:p-10 relative overflow-hidden">
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-gold/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-gold/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Title & Navigation Header */}
            <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
                <div className="max-w-xl text-left">
                    <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-gold">
                        <KeyRound size={12} />
                        Setup & Deployment Guide
                    </span>
                    <h2 className="font-heading text-2xl sm:text-3xl font-black text-gray-900 dark:text-white leading-tight">
                        How to Access & Install
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm font-semibold leading-relaxed text-gray-550 dark:text-gray-400">
                        {activeTab === "access"
                            ? "Expert Advisors are free to unlock for eligible partner accounts. Follow the steps below to verify your account."
                            : "Follow these standardized technical steps to deploy the downloaded Expert Advisors or manual panels on MT5."}
                    </p>
                </div>

                {/* Tab Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
                    <Tabs
                        value={activeTab}
                        onValueChange={(val) => setActiveTab(val as any)}
                        tabsId="trading-systems-guide-tabs"
                        className="w-full sm:w-auto"
                    >
                        <TabsList className="bg-gray-50/75 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-xl p-1 gap-1 w-full sm:w-auto">
                            {[
                                {
                                    id: "access",
                                    label: "1. Access Path",
                                    icon: KeyRound,
                                },
                                {
                                    id: "install",
                                    label: "2. Install on MT5",
                                    icon: Wrench,
                                },
                            ].map((tab) => {
                                const IconComp = tab.icon;
                                return (
                                    <TabsTrigger
                                        key={tab.id}
                                        value={tab.id}
                                        className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-transparent hover:border-gray-200/50 dark:hover:border-white/10 shrink-0 flex-1 sm:flex-initial"
                                        activeIndicatorClassName="!bg-gold shadow-md border-0"
                                        activeTextClassName="!text-white"
                                    >
                                        <IconComp size={12} />
                                        <span>{tab.label}</span>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* Grid of Steps */}
            <div className="grid gap-6 md:grid-cols-4 relative z-10 transition-all duration-300">
                {steps.map((item) => {
                    const StepIcon = item.icon;
                    return (
                        <div
                            key={item.step}
                            className="rounded-2xl border border-gray-200/60 bg-white/70 p-5 dark:border-white/5 dark:bg-white/[0.01] flex flex-col justify-between min-h-[160px] shadow-sm hover:border-gold/30 hover:shadow-md transition-all duration-300 relative overflow-hidden group"
                        >
                            {/* Visual glow on card hover */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            <div className="flex items-center justify-between mb-4 relative z-10">
                                {StepIcon ? (
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 text-gold border border-gold/15">
                                        <StepIcon
                                            size={16}
                                            className="stroke-[2.5]"
                                        />
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded bg-gold/10 text-gold border border-gold/20">
                                        Step {item.step}
                                    </span>
                                )}
                                <span className="text-2xl font-black text-gold/20">
                                    0{item.step}
                                </span>
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xs font-black text-gray-850 dark:text-white uppercase tracking-wider leading-tight">
                                    {item.title}
                                </h3>
                                <p className="mt-2 text-[11px] font-semibold leading-relaxed text-gray-505 dark:text-gray-400">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {activeTab === "access" && (
                <div className="mt-8 flex justify-center relative z-10">
                    <Link
                        href={primaryCtaUrl}
                        className="inline-flex items-center gap-2 rounded-xl bg-gold hover:bg-amber-600 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-gold/20 hover:shadow-gold/30 transition-all duration-200 active:scale-[0.98] group"
                    >
                        Start Eligibility Check
                        <ArrowRight
                            size={14}
                            className="group-hover:translate-x-1 transition-transform duration-200"
                        />
                    </Link>
                </div>
            )}
        </section>
    );
}
