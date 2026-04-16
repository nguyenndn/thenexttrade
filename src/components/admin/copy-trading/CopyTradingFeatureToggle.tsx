"use client";

import { useState, useEffect } from "react";
import { Power, Loader2 } from "lucide-react";
import { toast } from "sonner";

const FEATURE_KEY = "feature_copy_trading";

export function CopyTradingFeatureToggle() {
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
                toast.success(`Copy Trading ${newValue ? "enabled" : "disabled"} for users`);
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
        <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${enabled ? "bg-emerald-500/10" : "bg-gray-100 dark:bg-white/5"}`}>
                        <Power size={20} className={enabled ? "text-emerald-500" : "text-gray-400"} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 dark:text-white">Feature Visibility</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {enabled ? "Copy Trading page is visible to users" : "Copy Trading page is hidden from users"}
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
    );
}
