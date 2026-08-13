"use client";

import { CheckCircle2, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export interface PendingApproval {
    id: string;
    type: "VIP_REQUEST";
    title: string;
    broker: string;
    account: string;
    createdAt: Date;
    href: string;
    user: {
        name: string | null;
        image: string | null;
        email: string | null;
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

export function PendingApprovalsWidget({
    approvals,
}: {
    approvals: PendingApproval[];
}) {
    return (
        <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-6 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-700 dark:text-white flex items-center gap-2">
                    <Clock
                        className="w-5 h-5 text-amber-500"
                        aria-hidden="true"
                    />
                    Pending Approvals
                </h3>
                {approvals.length > 0 && (
                    <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {approvals.length} Actions
                    </span>
                )}
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {approvals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                        <CheckCircle2 className="w-10 h-10 mb-3 text-emerald-500 opacity-50" />
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                            All caught up!
                        </p>
                        <p className="text-xs mt-1">
                            No pending approvals at the moment.
                        </p>
                    </div>
                ) : (
                    approvals.map((item, i) => (
                        <motion.div
                            key={`${item.type}-${item.id}`}
                            custom={i}
                            initial="hidden"
                            animate="visible"
                            variants={itemVariants}
                        >
                            <Link
                                href={item.href}
                                className="flex items-center justify-between group p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0",
                                            "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 ring-1 ring-purple-500/20"
                                        )}
                                    >
                                        {item.user?.image ? (
                                            <Image
                                                src={item.user.image}
                                                alt={item.user.name || "User"}
                                                width={40}
                                                height={40}
                                                className="rounded-xl object-cover w-full h-full"
                                            />
                                        ) : (
                                            <ShieldCheck size={18} />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-sm text-gray-700 dark:text-white flex items-center gap-2 truncate">
                                            {item.user?.name || "Unknown User"}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate mt-0.5">
                                            <span className="font-medium mr-1 text-purple-500">
                                                {item.title}
                                            </span>
                                            • {item.broker} ({item.account})
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                    <div className="text-xs text-gray-400 whitespace-nowrap">
                                        {formatDistanceToNow(
                                            new Date(item.createdAt),
                                            { addSuffix: true }
                                        )}
                                    </div>
                                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                        <ArrowRight size={12} />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
