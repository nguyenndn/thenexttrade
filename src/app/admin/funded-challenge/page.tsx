"use client";

import { useState, useEffect } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
    Trophy,
    FlaskConical,
    Power,
    Loader2,
    Construction,
    ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

const FEATURE_KEY = "feature_funded_challenge";

export default function AdminFundedChallengePage() {
    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);

    useEffect(() => {
        fetch("/api/admin/feature-flags")
            .then((res) => res.json())
            .then((data) => {
                setEnabled(data.flags?.[FEATURE_KEY] ?? false);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleToggle = async () => {
        const newValue = !enabled;
        setToggling(true);
        try {
            const res = await fetch("/api/admin/feature-flags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: FEATURE_KEY, enabled: newValue }),
            });
            if (res.ok) {
                setEnabled(newValue);
                toast.success(`Funded Challenge ${newValue ? "enabled" : "disabled"} for users`);
            } else {
                toast.error("Failed to update feature flag");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setToggling(false);
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <AdminPageHeader
                title="Funded Challenge"
                description="Manage the Funded Challenge feature visibility for users."
            />

            {/* Feature Toggle Card */}
            <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${enabled ? "bg-emerald-500/10" : "bg-gray-100 dark:bg-white/5"}`}>
                            <Power size={20} className={enabled ? "text-emerald-500" : "text-gray-400"} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 dark:text-white">Feature Visibility</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {enabled ? "Funded Challenge page is visible to users" : "Funded Challenge page is hidden from users"}
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <Loader2 size={20} className="animate-spin text-gray-400" />
                    ) : (
                        <button
                            onClick={handleToggle}
                            disabled={toggling}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 dark:focus:ring-offset-[#151925] ${
                                enabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-white/20"
                            } ${toggling ? "opacity-50" : ""}`}
                        >
                            <span
                                className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                                    enabled ? "translate-x-6" : "translate-x-1"
                                }`}
                            />
                        </button>
                    )}
                </div>
            </div>

            {/* Under Research Placeholder */}
            <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                    <div className="relative mb-6">
                        <div className="w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                            <FlaskConical size={36} className="text-amber-500" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Construction size={16} className="text-blue-500" />
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-700 dark:text-white mb-2">
                        Under Research & Development
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed mb-6">
                        The Funded Challenge feature is currently being researched and designed.
                        Challenge tiers, rules, payment integration, and risk management modules
                        will be implemented in a future update.
                    </p>

                    <div className="flex flex-wrap gap-3 justify-center mb-8">
                        {[
                            "Challenge Tiers & Pricing",
                            "Evaluation Rules Engine",
                            "Progress Tracking",
                            "Payment Integration",
                            "Profit Split System",
                        ].map((item) => (
                            <span
                                key={item}
                                className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-500 dark:text-gray-400"
                            >
                                {item}
                            </span>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Trophy size={14} />
                        <span>This placeholder replaces the previous mock data display</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
