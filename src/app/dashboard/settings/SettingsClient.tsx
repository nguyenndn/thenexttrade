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
    Wallet,
    Coins,
    CheckCircle2,
    ChevronDown,
    Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/switch";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { normalizeCountryCode, getCountryName } from "@/lib/country-utils";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const USDT_NETWORKS: {
    value: "BEP20" | "TRC20" | "ERC20";
    label: string;
    sublabel: string;
}[] = [
    {
        value: "BEP20",
        label: "BNB Smart Chain (BEP-20)",
        sublabel: "Recommended (Low Gas Fee)",
    },
    {
        value: "TRC20",
        label: "TRON (TRC-20)",
        sublabel: "TRC-20 Transfers",
    },
    {
        value: "ERC20",
        label: "Ethereum (ERC-20)",
        sublabel: "High Gas Fee",
    },
];

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
        description: "Get EA access, Discipline Coach, and advanced telemetry",
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
        username: "",
        bio: "",
        telegramId: "",
        country: "",
        image: "",
        tradingGoal: "",
    });

    const [payoutWallet, setPayoutWallet] = useState<{
        network: "BEP20" | "TRC20" | "ERC20";
        address: string;
    }>({
        network: "BEP20",
        address: "",
    });
    const [isSavingWallet, setIsSavingWallet] = useState(false);

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
                    username: data.username || "",
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
                if (prefsData.payoutWallet) {
                    setPayoutWallet({
                        network: prefsData.payoutWallet.network || "BEP20",
                        address: prefsData.payoutWallet.address || "",
                    });
                }
            }
        } catch {
            /* Failed to fetch */
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isLoading && typeof window !== "undefined" && window.location.hash === "#payout-wallet") {
            const el = document.getElementById("payout-wallet");
            if (el) {
                setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
            }
        }
    }, [isLoading]);

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

    const handlePayoutWalletSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanAddress = payoutWallet.address.trim();
        if (cleanAddress && cleanAddress.length < 24) {
            toast.error("Please enter a valid wallet address (at least 24 characters).");
            return;
        }
        if (cleanAddress) {
            if (payoutWallet.network === "TRC20" && !cleanAddress.startsWith("T")) {
                toast.error("TRC-20 USDT address must begin with 'T'.");
                return;
            }
            if (
                (payoutWallet.network === "BEP20" || payoutWallet.network === "ERC20") &&
                !cleanAddress.startsWith("0x")
            ) {
                toast.error(`${payoutWallet.network} USDT address must begin with '0x'.`);
                return;
            }
        }

        setIsSavingWallet(true);
        try {
            const res = await fetch("/api/profile/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    payoutWallet: cleanAddress
                        ? { network: payoutWallet.network, address: cleanAddress }
                        : null,
                }),
            });
            if (!res.ok) throw new Error("Failed to save wallet");
            toast.success("Payout wallet destination saved!");
            router.refresh();
        } catch {
            toast.error("Failed to save payout wallet.");
        } finally {
            setIsSavingWallet(false);
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
                    username: formData.username,
                    bio: formData.bio,
                    telegramId: formData.telegramId,
                    country: formData.country,
                    image: formData.image,
                    tradingGoal: formData.tradingGoal,
                }),
            });
            if (!res.ok) {
                const payload = await res.json().catch(() => null);
                const message =
                    payload?.error?.[0]?.message ??
                    (typeof payload?.error === "string" ? payload.error : null) ??
                    "Could not save your changes.";
                toast.error(message);
                return;
            }
            toast.success("Profile updated successfully!");
            router.refresh();
        } catch {
            toast.error("Could not save your changes. Please check your network connection.");
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
                            <div className="w-[100px] h-[100px] rounded-lg overflow-hidden bg-gray-100 dark:bg-[#151925] border-4 border-white dark:border-[#0B0E14] shadow-lg">
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
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
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
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#151925] border border-dashboard rounded-lg text-sm text-gray-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                            Username
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
                                @
                            </span>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        username: e.target.value
                                            .toLowerCase()
                                            .replace(/[^a-z0-9_]/g, ""),
                                    }))
                                }
                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-[#151925] border border-dashboard rounded-lg text-sm text-gray-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-mono"
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Your unique handle for public profile and leaderboard.
                        </p>
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
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#151925] border border-dashboard rounded-lg text-sm text-gray-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                                Country
                            </label>
                            <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                                <Lock size={11} />
                                Fixed at registration
                            </span>
                        </div>
                        <div className="flex items-center justify-between w-full h-[42px] px-3.5 py-2.5 rounded-lg border border-dashboard bg-gray-100/80 dark:bg-white/[0.04] text-gray-500 dark:text-gray-400 cursor-not-allowed select-none">
                            {formData.country ? (
                                <div className="flex items-center gap-2.5 min-w-0">
                                    {normalizeCountryCode(formData.country) ? (
                                        <img
                                            src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/flags/4x3/${normalizeCountryCode(formData.country)!.toLowerCase()}.svg`}
                                            alt={getCountryName(formData.country)}
                                            className="w-5 h-3.5 rounded object-cover shadow-sm shrink-0"
                                        />
                                    ) : null}
                                    <span className="text-gray-700 dark:text-gray-200 text-sm font-medium truncate">
                                        {getCountryName(formData.country)}
                                    </span>
                                    {normalizeCountryCode(formData.country) ? (
                                        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                            ({normalizeCountryCode(formData.country)})
                                        </span>
                                    ) : null}
                                </div>
                            ) : (
                                <span className="text-gray-400 dark:text-gray-500 text-sm">
                                    Not specified
                                </span>
                            )}
                            <Lock size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Country is registered with your account and cannot be modified.
                        </p>
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
                            maxLength={200}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#151925] border border-dashboard rounded-lg text-sm text-gray-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none transition-all"
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
                                <Button
                                    variant="ghost"
                                    key={g.id}
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            tradingGoal: g.id,
                                        }))
                                    }
                                    className={cn(
                                        "flex items-center justify-start gap-3.5 p-4 h-auto rounded-lg border text-left transition-all duration-200 w-full font-normal active:scale-[0.98]",
                                        isSelected
                                            ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-sm shadow-amber-500/10 hover:bg-amber-500/10"
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
                                </Button>
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

            {/* ── Payout & Milestone Rewards Wallet Card ── */}
            <form
                id="payout-wallet"
                onSubmit={handlePayoutWalletSubmit}
                className="bg-white dark:bg-[#0B0E14] rounded-xl border border-dashboard shadow-sm overflow-hidden scroll-mt-24"
            >
                <div className="px-6 py-5 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                                <Wallet size={14} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-700 dark:text-white">
                                    Payout & Milestone Rewards Wallet (USDT)
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Set your destination address for Milestone Cash Rewards (Level 1–10) and performance payouts.
                                </p>
                            </div>
                        </div>

                        {payoutWallet.address ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 size={12} />
                                Destination Active
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Not Configured
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 items-start">
                        {/* Network Selection via DropdownMenu */}
                        <div className="space-y-1.5 flex flex-col">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                USDT Network
                            </label>
                            <DropdownMenu className="w-full">
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        type="button"
                                        className="w-full h-10 px-3.5 rounded-lg border border-dashboard bg-gray-50/70 dark:bg-slate-900/60 text-sm font-medium text-gray-800 dark:text-gray-100 flex items-center justify-between hover:bg-gray-100/70 dark:hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all cursor-pointer"
                                    >
                                        <span className="truncate">
                                            {USDT_NETWORKS.find((n) => n.value === payoutWallet.network)?.label || payoutWallet.network}
                                        </span>
                                        <ChevronDown size={15} className="text-gray-400 shrink-0 ml-2" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="start"
                                    className="w-[--radix-dropdown-menu-trigger-width] rounded-xl p-1.5 shadow-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028]"
                                >
                                    {USDT_NETWORKS.map((opt) => {
                                        const isSelected = payoutWallet.network === opt.value;
                                        return (
                                            <DropdownMenuItem
                                                key={opt.value}
                                                onClick={() =>
                                                    setPayoutWallet((prev) => ({
                                                        ...prev,
                                                        network: opt.value,
                                                    }))
                                                }
                                                className={cn(
                                                    "flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer",
                                                    isSelected
                                                        ? "bg-amber-500/10 text-amber-900 dark:text-amber-300 font-semibold"
                                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                                                )}
                                            >
                                                <div>
                                                    <p className="font-semibold">{opt.label}</p>
                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">
                                                        {opt.sublabel}
                                                    </p>
                                                </div>
                                                {isSelected && (
                                                    <Check size={14} className="text-amber-500 shrink-0" />
                                                )}
                                            </DropdownMenuItem>
                                        );
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <p className="text-[11px] text-gray-400">
                                {payoutWallet.network === "BEP20"
                                    ? "Fast & low network fee. Recommended by admin."
                                    : payoutWallet.network === "TRC20"
                                    ? "TRC-20 transfers supported."
                                    : "High gas fees may apply."}
                            </p>
                        </div>

                        {/* Receiving Address */}
                        <div className="md:col-span-2 space-y-1.5 flex flex-col">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                USDT Receiving Address
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={payoutWallet.address}
                                    onChange={(e) =>
                                        setPayoutWallet((prev) => ({
                                            ...prev,
                                            address: e.target.value,
                                        }))
                                    }
                                    className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-dashboard bg-gray-50/70 dark:bg-slate-900/60 text-sm font-mono text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                                    aria-label="USDT Receiving Address"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <Wallet size={16} />
                                </div>
                            </div>
                            <p className="text-[11px] text-gray-400">
                                {payoutWallet.network === "TRC20"
                                    ? "Must begin with 'T' (e.g. Txyz...987)."
                                    : "Must begin with '0x' (e.g. 0x71c3...B39)."}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-lg bg-amber-500/5 border border-amber-500/15 p-3.5 flex items-start gap-3">
                        <ShieldCheck size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
                            <span className="font-semibold">Automated Loyalty Claim Integration:</span> When you claim milestone rewards in the Loyalty Dashboard, Admin will verify and dispatch USDT directly to this saved wallet within 24 business hours.
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-dashboard flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                        Make sure your address matches the selected network to prevent loss of funds.
                    </p>
                    <Button
                        type="submit"
                        variant="gold"
                        size="smd"
                        disabled={isSavingWallet}
                    >
                        {isSavingWallet ? (
                            <Loader2 className="animate-spin" size={16} />
                        ) : (
                            <Save size={16} />
                        )}
                        Save Payout Wallet
                    </Button>
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
