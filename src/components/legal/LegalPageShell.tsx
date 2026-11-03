"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, Shield, Cookie, ChevronRight } from "lucide-react";

export interface LegalSectionItem {
    id: string;
    label: string;
}

interface LegalPageShellProps {
    title: string;
    lead: string;
    sections: LegalSectionItem[];
    numbered?: boolean;
    intro?: React.ReactNode;
    footerNote?: string;
    children: React.ReactNode;
}

const LEGAL_NAV_LINKS = [
    {
        href: "/legal/terms-of-service",
        label: "Terms of Service",
        icon: Scale,
    },
    {
        href: "/legal/privacy-policy",
        label: "Privacy Policy",
        icon: Shield,
    },
    {
        href: "/legal/cookie-policy",
        label: "Cookie Policy",
        icon: Cookie,
    },
];

export function LegalPageShell({
    title,
    lead,
    sections,
    numbered = false,
    intro,
    footerNote,
    children,
}: LegalPageShellProps) {
    const pathname = usePathname();
    const [activeId, setActiveId] = useState<string>(sections[0]?.id || "");

    useEffect(() => {
        if (!sections.length) return;

        const elements = sections
            .map((s) => document.getElementById(s.id))
            .filter((el): el is HTMLElement => el !== null);

        if (!elements.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort(
                        (a, b) =>
                            a.boundingClientRect.top - b.boundingClientRect.top
                    );

                if (visible.length > 0) {
                    setActiveId(visible[0].target.id);
                }
            },
            {
                rootMargin: "-110px 0px -65% 0px",
                threshold: [0, 0.25, 0.5, 1],
            }
        );

        elements.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [sections]);

    return (
        <div className="max-w-6xl mx-auto pt-4 sm:pt-8 pb-8">
            {/* Compact Hero Header */}
            <header className="mb-8 sm:mb-10 pb-6 sm:pb-8 border-b border-gray-200 dark:border-white/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                    <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-amber-600 dark:text-gold">
                        <span>Legal Documentation</span>
                        <ChevronRight size={13} className="text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">
                            {title}
                        </span>
                    </div>

                    {/* Legal Document Switcher */}
                    <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-xs self-start md:self-auto">
                        {LEGAL_NAV_LINKS.map((doc) => {
                            const Icon = doc.icon;
                            const isActive = pathname === doc.href;
                            return (
                                <Link
                                    key={doc.href}
                                    href={doc.href}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-150 ${
                                        isActive
                                            ? "bg-gold !text-white shadow-xs"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                                    }`}
                                >
                                    <Icon size={13} />
                                    <span>{doc.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-heading tracking-tight text-gray-900 dark:text-white leading-tight">
                    {title}
                </h1>
                <p className="mt-2.5 text-sm sm:text-base tabular-nums font-medium text-gray-600 dark:text-gray-400 max-w-3xl">
                    {lead}
                </p>
            </header>

            {/* 2-Column Split Layout: Sticky Section TOC + Main Legal Body */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                {/* Left Column: Sticky Table of Contents */}
                <aside className="lg:col-span-3 lg:sticky lg:top-28">
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-3.5 shadow-sm">
                        <div className="px-2.5 pb-2 mb-2 border-b border-gray-100 dark:border-white/10 text-[10px] font-black uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
                            On This Page
                        </div>
                        <nav
                            aria-label="Legal document sections"
                            className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0"
                        >
                            {sections.map((sec, idx) => {
                                const isCurrent = activeId === sec.id;
                                return (
                                    <a
                                        key={sec.id}
                                        href={`#${sec.id}`}
                                        onClick={() => setActiveId(sec.id)}
                                        aria-current={
                                            isCurrent ? "location" : undefined
                                        }
                                        className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap lg:whitespace-normal transition-colors duration-150 ${
                                            isCurrent
                                                ? "bg-gold/10 text-amber-700 dark:text-gold border border-gold/25"
                                                : "text-gray-600 dark:text-gray-400 border border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:text-gray-900 dark:hover:text-white"
                                        }`}
                                    >
                                        {numbered && (
                                            <span
                                                className={`tabular-nums text-[11px] font-black shrink-0 ${
                                                    isCurrent
                                                        ? "text-amber-600 dark:text-gold"
                                                        : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                                                }`}
                                            >
                                                {idx + 1}.
                                            </span>
                                        )}
                                        <span className="truncate">
                                            {sec.label}
                                        </span>
                                    </a>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                {/* Right Column: Intro Callout + Structured Sections */}
                <div className="lg:col-span-9 min-w-0 space-y-6">
                    {intro}

                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-6 sm:p-8 md:p-10 shadow-sm divide-y divide-gray-200/80 dark:divide-white/10">
                        {children}

                        {footerNote && (
                            <div className="pt-6 mt-6 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
                                {footerNote}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

