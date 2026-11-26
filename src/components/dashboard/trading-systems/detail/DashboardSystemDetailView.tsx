"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, HelpCircle, ListChecks, Shield } from "lucide-react";
import type { EAProduct } from "@prisma/client";
import { toast } from "sonner";
import { getSystemBySlug } from "@/config/trading-systems-data";
import { downloadEaProductBinary } from "./download-ea-binary";
import { SystemDetailHeader } from "./SystemDetailHeader";
import { SystemDetailSections } from "./SystemDetailSections";
import { SystemDetailSidebar, type SystemDetailNavItem } from "./SystemDetailSidebar";

const VALID_TABS = new Set(["specs", "guide", "risk", "faqs"]);

interface DashboardSystemDetailViewProps {
    product: EAProduct;
    isLocked: boolean;
    initialTab?: string;
}

export function DashboardSystemDetailView({
    product,
    isLocked,
    initialTab = "specs",
}: DashboardSystemDetailViewProps) {
    const router = useRouter();
    const system = getSystemBySlug(product.slug);
    const [activeTab, setActiveTab] = useState<string>(
        VALID_TABS.has(initialTab) ? initialTab : "specs"
    );
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        if (isLocked || downloading) return;
        setDownloading(true);
        try {
            const ok = await downloadEaProductBinary(product);
            if (ok) {
                toast.success(`Downloaded ${product.name}`);
                router.refresh();
                setActiveTab("guide");
            }
        } catch {
            toast.error(
                "An error occurred while downloading. Please try again."
            );
        } finally {
            setDownloading(false);
        }
    };

    const navItems: SystemDetailNavItem[] = [
        {
            id: "specs",
            num: "01",
            label: "Specifications",
            icon: ListChecks,
            category: "ARCHITECTURE & SPECS",
            title: "Specifications & Core Engine",
        },
        {
            id: "guide",
            num: "02",
            label: "Installation",
            icon: BookOpen,
            category: "SETUP WIZARD",
            title: "Step-by-Step Installation",
        },
        {
            id: "risk",
            num: "03",
            label: "Risk Management",
            icon: Shield,
            category: "CAPITAL PROTECTION",
            title: "Risk Controls & VPS Setup",
        },
        {
            id: "faqs",
            num: "04",
            label: "FAQs & Support",
            icon: HelpCircle,
            category: "KNOWLEDGE BASE",
            title: "Frequently Asked Questions",
        },
    ];

    const currentNavItem =
        navItems.find((n) => n.id === activeTab) || navItems[0];

    return (
        <div className="space-y-2 md:space-y-5 pb-4 md:pb-8">
            <SystemDetailHeader
                product={product}
                isLocked={isLocked}
                downloading={downloading}
                onDownload={handleDownload}
            />

            <div className="rounded-xl border border-dashboard dark:border-white/[0.08] bg-white dark:bg-[#1E2028] shadow-sm overflow-hidden flex flex-col md:flex-row">
                <SystemDetailSidebar
                    items={navItems}
                    activeTab={activeTab}
                    onSelect={setActiveTab}
                />

                <div className="flex-1 min-w-0 p-3.5 sm:p-7">
                    <div className="mb-3 sm:mb-6 pb-3 sm:pb-4 border-b border-dashboard dark:border-white/[0.08]">
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                <currentNavItem.icon size={13} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 tabular-nums">
                                {currentNavItem.num} &bull;{" "}
                                {currentNavItem.category}
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                            {currentNavItem.title}
                        </h2>
                    </div>

                    <SystemDetailSections
                        activeTab={activeTab}
                        system={system}
                        productDescription={product.description}
                    />
                </div>
            </div>
        </div>
    );
}
