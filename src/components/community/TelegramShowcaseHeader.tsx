"use client";

import Image from "next/image";
import { Check, CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface TelegramShowcaseHeaderProps {
    copied: boolean;
    onCopyLink: () => void;
}

export function TelegramShowcaseHeader({
    copied,
    onCopyLink,
}: TelegramShowcaseHeaderProps) {
    return (
        <div className="bg-slate-100/90 dark:bg-[#17212B] px-4 py-3 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full p-0.5 bg-gold shadow-sm">
                        <Image
                            src="/images/logo_ninja.png"
                            alt="GoldScalperNinja Logo"
                            width={40}
                            height={40}
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#17212B]" />
                </div>
                <div>
                    <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-gray-900 dark:text-white">
                            GoldScalperNinja Official
                        </span>
                        <CheckCircle2
                            size={15}
                            className="text-[#2AABEE] fill-[#2AABEE]"
                        />
                    </div>
                    <span className="text-[11px] tabular-nums text-gray-500 dark:text-gray-400 font-semibold">
                        12,000+ subscribers - GoldScalperNinja
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onCopyLink}
                    title="Copy Telegram Channel Link"
                    aria-label="Copy Telegram channel invite link"
                    className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-slate-200/80 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-slate-300 dark:hover:bg-white/[0.16] transition-all"
                >
                    {copied ? (
                        <Check size={13} className="text-emerald-500" />
                    ) : (
                        <Copy size={13} />
                    )}
                    <span className="hidden sm:inline">Copy Link</span>
                </Button>
            </div>
        </div>
    );
}
