"use client";

import { UsersRound, Magnet, ArrowUpRight, UserCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";

export interface IBLead {
    id: string;
    broker: string;
    source: string;
    clickedAt: Date;
    convertedAt: Date | null;
    user: {
        name: string | null;
        email: string | null;
        image: string | null;
    } | null;
}

const itemVariants = {
    hidden: { opacity: 0, x: -16 },
    visible: (i: number) => ({
        opacity: 1,
        x: 0,
        transition: {
            delay: i * 0.08,
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
        },
    }),
};

export function RecentIBLeadsWidget({ leads }: { leads: IBLead[] }) {
    return (
        <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-6 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-700 dark:text-white mb-4 flex items-center gap-2">
                <Magnet
                    className="w-5 h-5 text-indigo-500"
                    aria-hidden="true"
                />
                Recent IB Leads
            </h3>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                        <UsersRound className="w-10 h-10 mb-3 opacity-30" />
                        <p className="font-medium">No IB leads yet</p>
                        <p className="text-xs mt-1">
                            New leads will appear here
                        </p>
                    </div>
                ) : (
                    leads.map((lead, i) => (
                        <motion.div
                            key={lead.id}
                            custom={i}
                            initial="hidden"
                            animate="visible"
                            variants={itemVariants}
                            className="flex items-center justify-between group p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0",
                                        lead.convertedAt
                                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 ring-1 ring-emerald-500/20"
                                            : "bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-gray-400 ring-1 ring-gray-200 dark:ring-white/10"
                                    )}
                                >
                                    {lead.user?.image ? (
                                        <Image
                                            src={lead.user.image}
                                            alt={lead.user.name || "User"}
                                            width={40}
                                            height={40}
                                            className="rounded-xl object-cover w-full h-full"
                                        />
                                    ) : lead.convertedAt ? (
                                        <UserCheck size={18} />
                                    ) : (
                                        <ArrowUpRight size={18} />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-sm text-gray-700 dark:text-white flex items-center gap-2 truncate">
                                        {lead.user?.name ||
                                            lead.user?.email ||
                                            "Anonymous Click"}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate mt-0.5">
                                        {lead.broker} • {lead.source}
                                    </div>
                                </div>
                            </div>

                            <div className="text-right shrink-0">
                                <div
                                    className={cn(
                                        "font-bold text-xs",
                                        lead.convertedAt
                                            ? "text-emerald-500"
                                            : "text-gray-400"
                                    )}
                                >
                                    {lead.convertedAt ? "Converted" : "Clicked"}
                                </div>
                                <div className="text-[11px] text-gray-500">
                                    {formatDistanceToNow(
                                        new Date(lead.clickedAt),
                                        { addSuffix: true }
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
