"use client";

import { useEffect, useState } from "react";
import { BookOpen, Brain, Shield } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { PSYCH_POSTS } from "./showcase-data/psychology-posts";
import { RISK_RULES_POSTS } from "./showcase-data/risk-rules-posts";
import { SD_PA_TIPS_POSTS } from "./showcase-data/sd-pa-tips-posts";
import { resolveVisitIndices } from "./showcase-data/shuffle-deck";
import { useCommunityReactions } from "./showcase-data/use-community-reactions";
import type { ShowcaseIndices, ShowcaseTabType } from "./showcase-data/types";
import { TelegramShowcaseHeader } from "./TelegramShowcaseHeader";
import { TelegramTabCard } from "./TelegramTabCard";
import { TelegramReactionsBar } from "./TelegramReactionsBar";

export interface TelegramShowcaseMockupProps {
    telegramUrl: string;
    initialIndices?: ShowcaseIndices;
}

export function TelegramShowcaseMockup({
    telegramUrl,
    initialIndices,
}: TelegramShowcaseMockupProps) {
    const [activeTab, setActiveTab] = useState<ShowcaseTabType>("psych");
    const [copied, setCopied] = useState(false);
    const { reactions, userReacted, toggleReaction } = useCommunityReactions();
    const [selectedIndices, setSelectedIndices] = useState<ShowcaseIndices>(() => ({
        psych: initialIndices?.psych ?? 0,
        mindset: initialIndices?.mindset ?? 0,
        tips: initialIndices?.tips ?? 0,
    }));

    useEffect(() => {
        setSelectedIndices(resolveVisitIndices(initialIndices));
    }, [initialIndices]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(telegramUrl);
        setCopied(true);
        toast.success("Copied channel invite link");
        setTimeout(() => setCopied(false), 2000);
    };

    const activePost =
        activeTab === "psych"
            ? PSYCH_POSTS[selectedIndices.psych] || PSYCH_POSTS[0]
            : activeTab === "mindset"
              ? RISK_RULES_POSTS[selectedIndices.mindset] || RISK_RULES_POSTS[0]
              : SD_PA_TIPS_POSTS[selectedIndices.tips] || SD_PA_TIPS_POSTS[0];

    return (
        <div className="relative w-full">
            <div className="absolute -inset-1 rounded-xl bg-gold/10 blur-xl opacity-40 pointer-events-none" />
            <style
                dangerouslySetInnerHTML={{
                    __html: `@keyframes border-flow-teaser-new{from{stroke-dashoffset:0}to{stroke-dashoffset:-360}}.animate-flow-teaser-new{stroke-dasharray:120 240;animation:border-flow-teaser-new 12s linear infinite}`,
                }}
            />
            <div className="relative rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:shadow-[0_25px_60px_rgba(15,23,42,0.4)]">
                <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-xl">
                    <defs>
                        <linearGradient id="laser-grad-telegram-teaser" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1" />
                            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.75" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.15" />
                        </linearGradient>
                    </defs>
                    <rect x="0.5" y="0.5" width="calc(100% - 1px)" height="calc(100% - 1px)" rx="11" fill="none" stroke="url(#laser-grad-telegram-teaser)" strokeWidth="1.5" className="animate-flow-teaser-new" />
                </svg>

                <div className="relative rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0E1621] text-gray-800 dark:text-white overflow-hidden flex flex-col">
                    <TelegramShowcaseHeader copied={copied} onCopyLink={handleCopyLink} />

                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ShowcaseTabType)} tabsId="telegramShowcase">
                        <TabsList className="w-full grid grid-cols-3 bg-slate-100 dark:bg-[#17212B] border-b border-gray-200 dark:border-white/10 p-1.5 gap-1.5 rounded-none border-t-0 border-x-0">
                            <TabsTrigger value="psych" className="w-full justify-center py-2 text-xs font-black" activeIndicatorClassName="!bg-gold shadow-md border-0 rounded-lg" activeTextClassName="!text-white">
                                <Brain size={14} className="shrink-0" />
                                <span className="truncate">Psychology</span>
                            </TabsTrigger>
                            <TabsTrigger value="mindset" className="w-full justify-center py-2 text-xs font-black" activeIndicatorClassName="!bg-gold shadow-md border-0 rounded-lg" activeTextClassName="!text-white">
                                <Shield size={14} className="shrink-0" />
                                <span className="truncate">Risk Rules</span>
                            </TabsTrigger>
                            <TabsTrigger value="tips" className="w-full justify-center py-2 text-xs font-black" activeIndicatorClassName="!bg-gold shadow-md border-0 rounded-lg" activeTextClassName="!text-white">
                                <BookOpen size={14} className="shrink-0" />
                                <span className="truncate">S&amp;D + PA Tips</span>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <TelegramTabCard activeTab={activeTab} post={activePost} />
                    <TelegramReactionsBar reactions={reactions} userReacted={userReacted} onReact={toggleReaction} />
                </div>
            </div>
            <p className="mt-2 text-center text-[11px] text-gray-500 dark:text-gray-400">
                Join GoldScalperNinja - 100% Free - Live daily analysis every morning
            </p>
        </div>
    );
}
