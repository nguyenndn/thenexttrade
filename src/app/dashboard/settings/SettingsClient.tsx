"use client";

import { useState, useEffect } from "react";
import {
    User,
    Save,
    Loader2,
    Camera,
    BarChart3,
    Search,
    ShieldCheck,
    Crown,
    Target,
    Check,
    Mail,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface EmailPreferences {
    reports: boolean;
    activation: boolean;
    marketing: boolean;
    welcome: boolean;
    unsubscribedAll: boolean;
}

const DEFAULT_EMAIL_PREFS: EmailPreferences = {
    reports: true,
    activation: true,
    marketing: true,
    welcome: true,
    unsubscribedAll: false,
};

const TRADING_GOALS = [
    {
        id: "track",
        label: "Track my trades",
        description: "Keep an organized record of all my entries and exits",
        icon: BarChart3,
    },
    {
        id: "mistakes",
        label: "Find my mistakes",
        description: "Identify patterns that cost me money",
        icon: Search,
    },
    {
        id: "discipline",
        label: "Build discipline",
        description: "Follow my plan and manage risk consistently",
        icon: ShieldCheck,
    },
    {
        id: "pro",
        label: "Prepare for Pro tools",
        description: "Get EA access, AI coaching, and advanced analytics",
        icon: Crown,
    },
] as const;

export default function SettingsClient() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingEmail, setIsSavingEmail] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [emailPrefs, setEmailPrefs] = useState<EmailPreferences>({
        ...DEFAULT_EMAIL_PREFS,
    });

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        bio: "",
        telegramId: "",
        country: "",
        image: "",
        tradingGoal: "",
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/profile");
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    name: data.name || "",
                    email: data.email || "",
                    bio: data.bio || "",
                    telegramId: data.telegramId || "",
                    country: data.country || "",
                    image: data.image || "",
                    tradingGoal: data.tradingGoal || "",
                });
            }

            // Load email preferences from the settings endpoint (kept separate
            // from /api/profile so profile saves never clobber them).
            const prefsRes = await fetch("/api/profile/settings");
            if (prefsRes.ok) {
                const prefsData = await prefsRes.json();
                if (prefsData.emailPreferences) {
                    setEmailPrefs({
                        ...DEFAULT_EMAIL_PREFS,
                        ...prefsData.emailPreferences,
                    });
                }
            }
        } catch {
            /* Failed to fetch */
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailPrefsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingEmail(true);
        try {
            const res = await fetch("/api/profile/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emailPreferences: emailPrefs }),
            });
            if (!res.ok) throw new Error("Failed to save");
            toast.success("Email preferences updated");
            router.refresh();
        } catch {
            toast.error("Failed to save email preferences.");
        } finally {
            setIsSavingEmail(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    bio: formData.bio,
                    telegramId: formData.telegramId,
                    country: formData.country,
                    image: formData.image,
                    tradingGoal: formData.tradingGoal,
                }),
            });
            if (!res.ok) {
                const text = await res.text();
                console.error("Settings save error:", text);
                throw new Error(text);
            }
            toast.success("Profile updated successfully!");
            router.refresh();
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={28} />
            </div>
        );
    }

    return (
        <div className="w-full space-y-5">
            {/* ── Unified Profile Card ── */}
            <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-dashboard overflow-hidden shadow-sm">
                {/* Gradient Banner + Avatar */}
                <div className="h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent dark:from-primary/30 dark:via-primary/15 dark:to-transparent relative">
                    <div
                        className="absolute inset-0 opacity-30"
                        style={{
                            backgroundImage:
                                "radial-gradient(circle at 20% 50%, #00C888 0%, transparent 60%)",
                        }}
                    />
                </div>

                <div className="px-6 pb-5">
                    <div className="flex items-end gap-5 -mt-12 mb-3">
                        <div className="relative flex-shrink-0">
                            <div className="w-[100px] h-[100px] rounded-xl overflow-hidden bg-gray-100 dark:bg-[#151925] border-4 border-white dark:border-[#0B0E14] shadow-lg">
                                {formData.image ? (
                                    <img
                                        src={formData.image}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                        <User size={36} />
                                    </div>
                                )}
                                {isUploadingAvatar && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                                        <Loader2 size={24} className="animate-spin text-white" />
                                    </div>
                                )}
                            </div>
                            <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors cursor-pointer">
                                <Camera size={14} className="text-white" />
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="sr-only"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        e.target.value = ""; // Reset so same file can be re-selected
                                        if (file.size > 1 * 1024 * 1024) {
                                            toast.error("Image must be under 1MB.");
                                            return;
                                        }
                                        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
                                            toast.error("Only JPG, PNG, and WebP images are accepted.");
                                            return;
                                        }
                                        setIsUploadingAvatar(true);
                                        try {
                                            const fd = new FormData();
                                            fd.append("file", file);
                                            fd.append("purpose", "avatar");
                                            const res = await fetch("/api/upload", { method: "POST", body: fd });
                                            const data = await res.json();
                                            if (!res.ok) {
                                                toast.error(data.error || "Upload failed");
                                                return;
                                            }
                                            setFormData((prev) => ({ ...prev, image: data.url }));
                                            toast.success("Avatar uploaded! Click Save to apply.");
                                        } catch {
                                            toast.error("Upload failed. Please try again.");
                                        } finally {
                                            setIsUploadingAvatar(false);
                                        }
                                    }}
                                />
                            </label>
                        </div>
                        <div className="pb-1">
                            <p className="text-sm font-bold text-gray-700 dark:text-white">
                                {formData.name || "Your Name"}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {formData.email || ""}
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400">
                        JPG, PNG or WebP · Max 1MB · Recommended 400×400px
                    </p>
                </div>

                {/* Personal Information Section */}
                <div className="border-t border-dashboard px-6 py-5 space-y-4">
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                            <User size={14} className="text-primary" />
                        </div>
                        <h2 className="text-sm font-bold text-gray-700 dark:text-white">
                            Personal Information
                        </h2>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#151925] border border-dashboard rounded-xl text-sm text-gray-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                            placeholder="Your full name"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                            Telegram ID
                        </label>
                        <input
                            type="text"
                            value={formData.telegramId}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    telegramId: e.target.value,
                                }))
                            }
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#151925] border border-dashboard rounded-xl text-sm text-gray-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                            placeholder="@username or Chat ID"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                            Country
                        </label>
                        <input
                            type="text"
                            value={formData.country}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    country: e.target.value,
                                }))
                            }
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#151925] border border-dashboard rounded-xl text-sm text-gray-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                            placeholder="e.g. Vietnam"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                            Bio
                        </label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    bio: e.target.value,
                                }))
                            }
                            rows={3}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#151925] border border-dashboard rounded-xl text-sm text-gray-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none transition-all"
                            placeholder="Tell us about your trading journey..."
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            {formData.bio.length}/200 characters
                        </p>
                    </div>
                </div>

                {/* Main Trading Goal Section */}
                <div className="border-t border-dashboard px-6 py-5 space-y-4">
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                            <Target size={14} className="text-amber-500" />
                        </div>
                        <h2 className="text-sm font-bold text-gray-700 dark:text-white">
                            Main Trading Goal
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {TRADING_GOALS.map((g) => {
                            const Icon = g.icon;
                            const isSelected = formData.tradingGoal === g.id;
                            return (
                                <button
                                    key={g.id}
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            tradingGoal: g.id,
                                        }))
                                    }
                                    className={cn(
                                        "flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all duration-200 w-full active:scale-[0.98]",
                                        isSelected
                                            ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-sm shadow-amber-500/10"
                                            : "border-dashboard bg-transparent hover:border-amber-500/35 dark:hover:border-amber-500/25 hover:bg-gray-50/50 dark:hover:bg-white/[0.01]"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "p-2 rounded-lg shrink-0 transition-colors",
                                            isSelected
                                                ? "bg-amber-500/10 text-amber-500"
                                                : "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500"
                                        )}
                                    >
                                        <Icon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-gray-800 dark:text-white">
                                            {g.label}
                                        </p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium leading-relaxed">
                                            {g.description}
                                        </p>
                                    </div>
                                    {isSelected && (
                                        <Check
                                            size={14}
                                            className="text-amber-500 shrink-0"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Save Footer */}
                <div className="px-6 py-4 border-t border-dashboard flex justify-end">
                    <Button
                        type="submit"
                        variant="primary"
                        size="smd"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <Loader2 className="animate-spin" size={16} />
                        ) : (
                            <Save size={16} />
                        )}
                        Save Changes
                    </Button>
                </div>
            </div>
            </form>

            {/* ── Email Preferences Card ── */}
            <form
                onSubmit={handleEmailPrefsSubmit}
                className="bg-white dark:bg-[#0B0E14] rounded-xl border border-dashboard shadow-sm overflow-hidden"
            >
                <div className="px-6 py-5 space-y-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                            <Mail size={14} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-700 dark:text-white">
                                Email Preferences
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Choose which emails you want to receive. Security
                                and account emails are always sent.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        {(
                            [
                                {
                                    key: "reports",
                                    title: "Trading Reports",
                                    desc: "Weekly & monthly performance reports and no-trade nudges",
                                },
                                {
                                    key: "activation",
                                    title: "Activation Reminders",
                                    desc: "Helpful setup reminders when you haven't reached your first value",
                                },
                                {
                                    key: "marketing",
                                    title: "Product & Feature Updates",
                                    desc: "Announcements about new features and content",
                                },
                                {
                                    key: "welcome",
                                    title: "Welcome Emails",
                                    desc: "Your onboarding welcome sequence",
                                },
                            ] as const
                        ).map((row) => {
                            const on =
                                emailPrefs[row.key] && !emailPrefs.unsubscribedAll;
                            return (
                                <div
                                    key={row.key}
                                    className="flex items-center justify-between gap-4 py-2.5 border-b border-dashboard/50 last:border-0"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            {row.title}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {row.desc}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={on}
                                        disabled={emailPrefs.unsubscribedAll}
                                        onCheckedChange={(v) =>
                                            setEmailPrefs((prev) => ({
                                                ...prev,
                                                [row.key]: v,
                                            }))
                                        }
                                    />
                                </div>
                            );
                        })}
                    </div>

                    <div className="rounded-xl bg-rose-50 dark:bg-rose-500/5 border border-rose-200/60 dark:border-rose-500/20 px-4 py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                                Unsubscribe from all emails
                            </p>
                            <p className="text-xs text-rose-500/80 mt-0.5">
                                Stops every product email above. Account & security
                                emails will still arrive.
                            </p>
                        </div>
                        <Switch
                            checked={emailPrefs.unsubscribedAll}
                            onCheckedChange={(v) =>
                                setEmailPrefs((prev) => ({
                                    ...prev,
                                    unsubscribedAll: v,
                                }))
                            }
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-dashboard flex justify-end">
                    <Button
                        type="submit"
                        variant="primary"
                        size="smd"
                        disabled={isSavingEmail}
                    >
                        {isSavingEmail ? (
                            <Loader2 className="animate-spin" size={16} />
                        ) : (
                            <Save size={16} />
                        )}
                        Save Email Preferences
                    </Button>
                </div>
            </form>

        </div>
    );
}
