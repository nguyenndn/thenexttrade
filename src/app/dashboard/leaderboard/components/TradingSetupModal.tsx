"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/Dialog";

export function TradingSetupModal() {
    const [open, setOpen] = useState(true);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
                {/* Header Gradient */}
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
                    <div className="relative">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto mb-3 shadow-inner">
                            <Trophy size={32} className="text-white" />
                        </div>
                        <h2 className="text-xl font-black text-white">
                            Leaderboard Setup
                        </h2>
                        <p className="text-white/80 text-xs mt-1">
                            Link your real account to compete
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                            No Real Account Configured
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed pt-1">
                            The Leaderboard only displays verified performance
                            from{" "}
                            <strong className="text-gray-700 dark:text-gray-300">
                                Real trading accounts
                            </strong>
                            . Go to your Trading Accounts page and use the{" "}
                            <strong className="text-gray-700 dark:text-gray-300">
                                ⋮ menu → &quot;Use for Leaderboard&quot;
                            </strong>{" "}
                            option.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex-row gap-2 sm:justify-end pt-2">
                        <Button
                            variant="outline"
                            size="smd"
                            onClick={() => setOpen(false)}
                        >
                            Maybe later
                        </Button>
                        <Link
                            href="/dashboard/accounts"
                            className={buttonVariants({
                                variant: "gold",
                                size: "smd",
                                className: "gap-2 shrink-0 font-bold",
                            })}
                        >
                            Go to Accounts
                            <ArrowRight size={14} />
                        </Link>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
