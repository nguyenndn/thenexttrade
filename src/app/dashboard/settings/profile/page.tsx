"use client";

import { useState, useEffect, useTransition } from "react";
import {
    Globe,
    Eye,
    EyeOff,
    Shield,
    Trophy,
    BarChart3,
    Clock,
    Award,
    ExternalLink,
    Check,
    Loader2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface ProfileSettings {
    username: string | null;
    isPublicProfile: boolean;
    showTradeScore: boolean;
    showBadges: boolean;
    showPairStats: boolean;
    showSessionStats: boolean;
    profileHeadline: string | null;
}

export default function PublicProfileSettings() {
    const [settings, setSettings] = useState<ProfileSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/profile/settings")
            .then((res) => res.json())
            .then((data) => {
                setSettings(data);
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to load settings");
                setLoading(false);
            });
    }, []);

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        setError(null);

        try {
            const res = await fetch("/api/profile/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });

            if (!res.ok) throw new Error("Failed to save");

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch {
            setError("Failed to save settings. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = (field: keyof ProfileSettings) => {
        if (!settings) return;
        setSettings({ ...settings, [field]: !settings[field] });
    };

    if (loading) {
        return (
            <div className="py-8">
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                <p>Unable to load profile settings.</p>
            </div>
        );
    }

    return (
        <div className="py-6 max-w-2xl space-y-6">
            {/* Main Toggle */}
            <div className="bg-white dark:bg-[#1E2028] rounded-xl p-6 border border-gray-200 dark:border-white/10 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 shrink-0 mt-0.5">
                            <Globe size={20} className="text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Public Profile</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                Make your trading profile visible at{" "}
                                {settings.username ? (
                                    <span className="text-primary font-medium">/trader/{settings.username}</span>
                                ) : (
                                    <span className="text-gray-400">Set a username first</span>
                                )}
                            </p>
                        </div>
                    </div>
                    <ToggleSwitch
                        enabled={settings.isPublicProfile}
                        onToggle={() => handleToggle("isPublicProfile")}
                        disabled={!settings.username}
                    />
                </div>
                {!settings.username && (
                    <div className="mt-4 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-500/20">
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                            You need to set a username in your{" "}
                            <Link href="/dashboard/settings" className="font-bold underline">
                                Account Settings
                            </Link>{" "}
                            before enabling your public profile.
                        </p>
                    </div>
                )}
            </div>

            {/* Headline */}
            {settings.isPublicProfile && (
                <div className="bg-white dark:bg-[#1E2028] rounded-xl p-6 border border-gray-200 dark:border-white/10 shadow-sm">
                    <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                        Profile Headline{" "}
                        <span className="font-normal text-gray-400">(Optional, max 160 chars)</span>
                    </label>
                    <input
                        type="text"
                        value={settings.profileHeadline || ""}
                        onChange={(e) =>
                            setSettings({ ...settings, profileHeadline: e.target.value.slice(0, 160) })
                        }
                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        placeholder='e.g., "Swing Trader | London Session Specialist"'
                        maxLength={160}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">
                        {(settings.profileHeadline || "").length}/160
                    </p>
                </div>
            )}

            {/* Visibility Toggles */}
            {settings.isPublicProfile && (
                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Shield size={16} className="text-gray-400" />
                            Privacy Controls
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Choose what information is visible on your public profile.
                        </p>
                    </div>

                    <ToggleRow
                        icon={Trophy}
                        title="Trade Score"
                        description="Show your calculated Trade Score (0-100)"
                        enabled={settings.showTradeScore}
                        onToggle={() => handleToggle("showTradeScore")}
                    />
                    <ToggleRow
                        icon={Award}
                        title="Badges"
                        description="Display your earned badges and achievements"
                        enabled={settings.showBadges}
                        onToggle={() => handleToggle("showBadges")}
                    />
                    <ToggleRow
                        icon={BarChart3}
                        title="Top Pairs"
                        description="Show your best performing trading pairs"
                        enabled={settings.showPairStats}
                        onToggle={() => handleToggle("showPairStats")}
                    />
                    <ToggleRow
                        icon={Clock}
                        title="Preferred Session"
                        description="Display your most active trading session"
                        enabled={settings.showSessionStats}
                        onToggle={() => handleToggle("showSessionStats")}
                        last
                    />
                </div>
            )}

            {/* Privacy Notice */}
            {settings.isPublicProfile && (
                <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-4 border border-gray-200 dark:border-white/10">
                    <div className="flex items-start gap-3">
                        <Shield size={16} className="text-gray-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            Your account balance, P&L amounts, and individual trade details are{" "}
                            <span className="font-bold text-gray-700 dark:text-gray-300">never</span> shown
                            on your public profile. Only aggregate statistics (win rate, trade count, etc.)
                            are displayed.
                        </p>
                    </div>
                </div>
            )}

            {/* Save */}
            <div className="flex items-center gap-4">
                <Button
                    variant="primary"
                    onClick={handleSave}
                    isLoading={saving}
                >
                    {saved ? <Check size={16} /> : null}
                    {saved ? "Saved!" : "Save Changes"}
                </Button>

                {settings.isPublicProfile && settings.username && (
                    <Link
                        href={`/trader/${settings.username}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                    >
                        Preview Profile <ExternalLink size={14} />
                    </Link>
                )}
            </div>

            {error && (
                <p className="text-sm text-red-500 font-medium">{error}</p>
            )}
        </div>
    );
}

// ============================================================================
// TOGGLE COMPONENTS
// ============================================================================

function ToggleSwitch({
    enabled,
    onToggle,
    disabled,
}: {
    enabled: boolean;
    onToggle: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            aria-label={enabled ? "Disable" : "Enable"}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                disabled
                    ? "opacity-50"
                    : enabled
                    ? "bg-primary"
                    : "bg-gray-200 dark:bg-white/10"
            }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    enabled ? "translate-x-6" : "translate-x-1"
                }`}
            />
        </button>
    );
}

function ToggleRow({
    icon: Icon,
    title,
    description,
    enabled,
    onToggle,
    last,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
    last?: boolean;
}) {
    return (
        <div
            className={`flex items-center justify-between gap-4 px-6 py-4 ${
                !last ? "border-b border-gray-100 dark:border-white/5" : ""
            }`}
        >
            <div className="flex items-center gap-3 min-w-0">
                <Icon size={16} className="text-gray-400 shrink-0" />
                <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
                </div>
            </div>
            <ToggleSwitch enabled={enabled} onToggle={onToggle} />
        </div>
    );
}
