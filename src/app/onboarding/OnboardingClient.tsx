"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    Camera,
    Loader2,
    Mail,
    Upload,
    ArrowRight,
    ArrowLeft,
    Target,
    Search,
    ShieldCheck,
    Crown,
    Monitor,
    Cable,
    PenLine,
    Check,
    BarChart3,
    FileText,
    Zap,
    Trophy,
    SkipForward,
} from "lucide-react";
import {
    updateProfile,
    saveTradingGoalStep,
    saveSyncPreferenceStep,
    completeOnboardingAction,
    skipOnboardingAction,
} from "./actions";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { ThemeToggleSwitch } from "@/components/ui/ThemeToggleSwitch";
import { toast } from "sonner";
import { CountrySelect } from "@/components/ui/CountrySelect";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/track";
import { useIsMobileSyncDevice } from "@/lib/device";
import { sendDesktopSetupLinkAction } from "@/actions/first-session-onboarding";

type SyncMethod = "EA_SYNC" | "MANUAL";

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

interface OnboardingClientProps {
    initialData: {
        email: string;
        fullName: string;
        username: string;
        bio: string;
        avatarUrl: string | null;
        country: string;
        // Onboarding resume data so a refresh / guard bounce does not restart
        // the wizard from the identity form.
        lastCompletedStep?: number;
        tradingGoal?: string | null;
        preferredSyncMethod?: SyncMethod;
    };
}

export default function OnboardingClient({
    initialData,
}: OnboardingClientProps) {
    // Resume at the step after the last one the user completed (stored 1-based).
    const [step, setStep] = useState<1 | 2 | 3 | 4>(
        Math.min(4, (initialData.lastCompletedStep ?? 0) + 1) as 1 | 2 | 3 | 4
    );
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        initialData.avatarUrl
    );
    const [country, setCountry] = useState<string>(initialData.country);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tradingGoal, setTradingGoal] = useState<string | null>(
        initialData.tradingGoal ?? null
    );
    const [syncMethod, setSyncMethod] = useState<SyncMethod>(
        initialData.preferredSyncMethod ?? "EA_SYNC"
    );
    const isMobile = useIsMobileSyncDevice();
    const [linkSent, setLinkSent] = useState(false);

    const router = useRouter();

    // Track onboarding started
    useEffect(() => {
        trackEvent("onboarding_started");
    }, []);

    // Track mobile sync warning viewed
    useEffect(() => {
        if (step === 3 && isMobile && syncMethod === "EA_SYNC") {
            import("@/actions/first-session-onboarding").then((m) => {
                m.recordMobileSyncFallbackViewedAction(syncMethod);
            });
        }
    }, [step, isMobile, syncMethod]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setError(null);

        if (file) {
            if (file.size > 1024 * 1024) {
                setError("Image size must be less than 1MB");
                e.target.value = "";
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleStep1Submit = async (formData: FormData) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await updateProfile(formData);
            if (result?.error) {
                setError(result.error);
            } else if (result?.success) {
                trackEvent("onboarding_step_completed", { step: "identity" });
                setStep(2);
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStep2Submit = async () => {
        if (!tradingGoal) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await saveTradingGoalStep(tradingGoal);
            if (result?.error) {
                if (result.error === "Unauthorized") {
                    router.push("/auth/login");
                    return;
                }
                setError(result.error);
                return;
            }
            trackEvent("onboarding_step_completed", {
                step: "goal",
                goal: tradingGoal,
            });
            setStep(3);
        } catch {
            setError("Failed to save. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStep3Submit = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await saveSyncPreferenceStep(syncMethod);
            if (result?.error) {
                if (result.error === "Unauthorized") {
                    router.push("/auth/login");
                    return;
                }
                setError(result.error);
                return;
            }
            trackEvent("onboarding_step_completed", { step: "sync" });
            trackEvent("onboarding_sync_method_selected", {
                method: syncMethod,
            });
            setStep(4);
        } catch {
            setError("Failed to save. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleComplete = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await completeOnboardingAction();
            if (result?.error) {
                if (result.error === "Unauthorized") {
                    router.push("/auth/login");
                    return;
                }
                setError(result.error);
                return;
            }
            trackEvent("onboarding_completed", { syncMethod });

            // Check if user came with a Partner Broker signup intent or Trading Style intent
            try {
                const savedIntent = localStorage.getItem("tnt_signup_intent");
                if (savedIntent === "BROKER_FUNDED" || savedIntent === "partner_pro") {
                    localStorage.removeItem("tnt_signup_intent");
                    router.push("/dashboard/accounts?action=add&intent=BROKER_FUNDED&mode=pro");
                    return;
                }
                if (savedIntent === "trading_style") {
                    localStorage.removeItem("tnt_signup_intent");
                    router.push("/dashboard/settings/trading-style");
                    return;
                }
            } catch {
                // Ignore storage error
            }

            // Redirect based on sync method
            if (syncMethod === "EA_SYNC") {
                router.push("/dashboard/accounts?setup=sync&method=ea");
            } else {
                router.push("/dashboard/journal?action=log-trade");
            }
        } catch {
            setError("Failed to complete. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = async () => {
        setIsLoading(true);
        setError(null);
        trackEvent("onboarding_skipped", { atStep: step });
        try {
            const result = await skipOnboardingAction();
            if (result?.error) {
                if (result.error === "Unauthorized") {
                    router.push("/auth/login");
                    return;
                }
                setError(result.error);
                return;
            }

            // Check if user came with a Partner Broker signup intent or Trading Style intent
            try {
                const savedIntent = localStorage.getItem("tnt_signup_intent");
                if (savedIntent === "BROKER_FUNDED" || savedIntent === "partner_pro") {
                    localStorage.removeItem("tnt_signup_intent");
                    router.push("/dashboard/accounts?action=add&intent=BROKER_FUNDED&mode=pro");
                    return;
                }
                if (savedIntent === "trading_style") {
                    localStorage.removeItem("tnt_signup_intent");
                    router.push("/dashboard/settings/trading-style");
                    return;
                }
            } catch {
                // Ignore storage error
            }

            router.push("/dashboard");
        } catch {
            setError("Failed to skip. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const progressPercent = ((step - 1) / 3) * 100;

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white text-slate-800 dark:bg-[#0B0E14] dark:text-white p-4 font-sans relative overflow-hidden transition-colors duration-300">
            {/* Background gradient overlay matching auth pages */}
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(245,158,11,0.08)_0%,rgba(255,255,255,0.85)_40%,rgba(16,185,129,0.06)_100%)] dark:bg-[linear-gradient(135deg,rgba(245,158,11,0.06)_0%,rgba(11,14,20,0.92)_45%,rgba(16,185,129,0.05)_100%)] pointer-events-none" />

            {/* Floating theme switcher top-right for convenience */}
            <div className="absolute top-6 right-6 z-20">
                <ThemeToggleSwitch />
            </div>

            {/* Fullscreen loading overlay */}
            {isLoading && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/85 dark:bg-[#0B0E14]/90 backdrop-blur-md">
                    <Loader2
                        size={40}
                        className="animate-spin text-amber-500 mb-4"
                    />
                    <p className="text-slate-900 dark:text-white font-extrabold text-lg">
                        Setting up your account...
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Please wait, this may take a moment.
                    </p>
                </div>
            )}

            {/* Logo area */}
            <div className="mb-8 relative z-10">
                <Logo />
            </div>

            {/* Level 1 Outer Card Container */}
            <div className="w-full max-w-lg bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl shadow-sm transition-all duration-300 overflow-hidden relative z-10">
                {/* Gold progress bar */}
                <div className="h-1.5 bg-gray-100 dark:bg-white/[0.08]">
                    <div
                        className="h-full bg-gold transition-all duration-500 ease-out shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-between px-8 pt-6 pb-2">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4].map((s) => (
                                <div
                                    key={s}
                                    className={cn(
                                        "h-2 rounded-full transition-all duration-300",
                                        step === s
                                            ? "w-8 bg-gold shadow-sm shadow-amber-500/30"
                                            : step > s
                                              ? "w-2 bg-gold/50"
                                              : "w-2 bg-gray-200 dark:bg-white/10"
                                    )}
                                />
                            ))}
                        </div>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                            {step}/4
                        </span>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSkip}
                        className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-gold border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] rounded-lg font-bold transition-colors uppercase tracking-wider h-8 px-3"
                    >
                        <SkipForward size={12} />
                        Skip
                    </Button>
                </div>

                <div className="p-8 pt-4">
                    {/* ═══════════════════════════════════════════════════════
  STEP 1: IDENTITY
  ═══════════════════════════════════════════════════════ */}
                    {step === 1 && (
                        <div className="animate-in fade-in duration-300">
                            <div className="text-center mb-6">
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                                    Set up your profile
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                                    Your identity on the platform
                                </p>
                            </div>

                            <form
                                action={handleStep1Submit}
                                className="space-y-5"
                            >
                                {error && (
                                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center font-bold">
                                        {error}
                                    </div>
                                )}

                                {/* User Identity Row */}
                                <div className="flex items-center gap-3 p-3.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925]">
                                    <div className="w-9 h-9 rounded-full bg-gold/10 text-amber-600 dark:text-gold flex items-center justify-center font-black text-sm shrink-0 border border-gold/20">
                                        {initialData.fullName
                                            ? initialData.fullName[0].toUpperCase()
                                            : initialData.email
                                              ? initialData.email[0].toUpperCase()
                                              : "U"}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">
                                            Account Identity
                                        </p>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate leading-snug">
                                            {initialData.fullName
                                                ? `${initialData.fullName} (${initialData.email})`
                                                : initialData.email}
                                        </p>
                                    </div>
                                </div>

                                {/* Avatar Upload */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="relative group cursor-pointer">
                                        <div
                                            className={cn(
                                                "w-24 h-24 rounded-full bg-gray-50/80 dark:bg-[#151925] border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors relative",
                                                error?.includes("Image size")
                                                    ? "border-red-400 dark:border-red-500/50"
                                                    : "border-gold/30 group-hover:border-gold"
                                            )}
                                        >
                                            {avatarPreview ? (
                                                <Image
                                                    src={avatarPreview}
                                                    alt="Avatar Preview"
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <Camera
                                                    className="text-slate-400 dark:text-slate-500 group-hover:text-amber-500 transition-colors"
                                                    size={32}
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Upload
                                                    className="text-white"
                                                    size={20}
                                                />
                                            </div>
                                        </div>
                                        <input
                                            type="file"
                                            name="avatar"
                                            accept="image/*"
                                            aria-label="Upload avatar"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleImageChange}
                                        />
                                    </div>
                                    <p
                                        className={`text-xs font-semibold tabular-nums ${error?.includes("Image size") ? "text-red-500" : "text-slate-400 dark:text-slate-500"}`}
                                    >
                                        {error?.includes("Image size")
                                            ? "File too large (>1MB)"
                                            : "Optional • Max 1MB"}
                                    </p>
                                </div>

                                {/* Username */}
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="username"
                                        className="text-sm font-black text-slate-700 dark:text-slate-300"
                                    >
                                        Username{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        id="username"
                                        required
                                        defaultValue={initialData.username}
                                        className="w-full h-11 px-4 bg-gray-50/80 dark:bg-[#151925] border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#151925] focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all rounded-lg focus:outline-none"
                                    />
                                </div>

                                {/* Country Selector */}
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="country"
                                        className="text-sm font-black text-slate-700 dark:text-slate-300"
                                    >
                                        Country{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <CountrySelect
                                        value={country}
                                        onChange={(val) => setCountry(val)}
                                        required={true}
                                        className="bg-gray-50/80 dark:bg-[#151925] border-gray-200 dark:border-white/10"
                                    />
                                </div>

                                {/* Bio */}
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="bio"
                                        className="text-sm font-black text-slate-700 dark:text-slate-300"
                                    >
                                        Bio{" "}
                                        <span className="text-slate-400 dark:text-slate-500 font-normal">
                                            (optional)
                                        </span>
                                    </label>
                                    <textarea
                                        name="bio"
                                        id="bio"
                                        rows={2}
                                        defaultValue={initialData.bio}
                                        className="w-full px-4 py-3 bg-gray-50/80 dark:bg-[#151925] border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#151925] focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all rounded-lg resize-none focus:outline-none"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 rounded-lg bg-gold hover:bg-amber-600 !text-white font-extrabold shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    Continue
                                    <ArrowRight size={16} />
                                </Button>
                            </form>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
  STEP 2: TRADING GOAL
  ═══════════════════════════════════════════════════════ */}
                    {step === 2 && (
                        <div className="animate-in fade-in duration-300">
                            <div className="text-center mb-6">
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                                    What&apos;s your main goal?
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                                    This helps us personalize your experience
                                </p>
                            </div>

                            <div className="space-y-3 mb-6">
                                {TRADING_GOALS.map((g) => {
                                    const Icon = g.icon;
                                    return (
                                        <Button
                                            key={g.id}
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setTradingGoal(g.id)}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all duration-200 h-auto font-normal",
                                                tradingGoal === g.id
                                                    ? "border-gold bg-gold/5 dark:bg-gold/10 shadow-sm shadow-amber-500/10 hover:bg-gold/5 dark:hover:bg-gold/10"
                                                    : "border-gray-200 dark:border-white/10 hover:border-gold/40 bg-gray-50/80 dark:bg-[#151925]"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "p-2 rounded-lg shrink-0 transition-colors",
                                                    tradingGoal === g.id
                                                        ? "bg-gold/15 text-amber-600 dark:text-gold"
                                                        : "bg-white dark:bg-white/5 text-slate-400 dark:text-slate-500"
                                                )}
                                            >
                                                <Icon size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-slate-800 dark:text-white">
                                                    {g.label}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                                    {g.description}
                                                </p>
                                            </div>
                                            {tradingGoal === g.id && (
                                                <Check
                                                    size={16}
                                                    className="text-amber-600 dark:text-gold shrink-0 animate-in fade-in zoom-in duration-200"
                                                />
                                            )}
                                        </Button>
                                    );
                                })}
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex items-center gap-1.5 border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white rounded-lg font-extrabold"
                                >
                                    <ArrowLeft size={14} />
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleStep2Submit}
                                    disabled={!tradingGoal || isLoading}
                                    className="flex-1 h-12 rounded-lg bg-gold hover:bg-amber-600 !text-white font-extrabold shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    Continue
                                    <ArrowRight size={16} />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
  STEP 3: SYNC PREFERENCE
  ═══════════════════════════════════════════════════════ */}
                    {step === 3 && (
                        <div className="animate-in fade-in duration-300">
                            <div className="text-center mb-6">
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                                    How will you log trades?
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                                    You can always change this later
                                </p>
                            </div>

                            <div className="space-y-4 mb-6">
                                {/* Trade Manager EA */}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setSyncMethod("EA_SYNC")}
                                    className={cn(
                                        "w-full rounded-lg border-2 p-4 text-left transition-all duration-200 relative block h-auto font-normal",
                                        syncMethod === "EA_SYNC"
                                            ? "border-gold bg-gold/5 dark:bg-gold/10 shadow-sm shadow-amber-500/10 hover:bg-gold/5 dark:hover:bg-gold/10"
                                            : "border-gray-200 dark:border-white/10 hover:border-gold/40 bg-gray-50/80 dark:bg-[#151925]"
                                    )}
                                >
                                    <span className="absolute -top-2 left-3 px-2 py-0.5 bg-gold !text-white text-[9px] font-black uppercase tracking-widest rounded-lg">
                                        Recommended
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <Zap
                                            size={20}
                                            className="text-amber-600 dark:text-gold shrink-0"
                                        />
                                        <div>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">
                                                Trade Manager EA
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                                Auto-sync trades from MT5 via
                                                unified Expert Advisor
                                            </p>
                                        </div>
                                    </div>
                                </Button>

                                {/* Manual */}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setSyncMethod("MANUAL")}
                                    className={cn(
                                        "w-full rounded-lg border-2 p-4 text-left transition-all duration-200 relative block h-auto font-normal",
                                        syncMethod === "MANUAL"
                                            ? "border-gold bg-gold/5 dark:bg-gold/10 shadow-sm shadow-amber-500/10 hover:bg-gold/5 dark:hover:bg-gold/10"
                                            : "border-gray-200 dark:border-white/10 hover:border-gold/40 bg-gray-50/80 dark:bg-[#151925]"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <PenLine
                                            size={20}
                                            className="text-slate-400 dark:text-slate-500 shrink-0"
                                        />
                                        <div>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">
                                                Manual Journal
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                                Log trades manually. Set up sync
                                                later.
                                            </p>
                                        </div>
                                    </div>
                                </Button>
                            </div>

                            {isMobile && syncMethod === "EA_SYNC" && (
                                <div className="mb-6 p-4 rounded-lg border border-gold/25 bg-gold/5 dark:bg-gold/10 space-y-3 animate-in slide-in-from-top duration-300">
                                    <div className="flex gap-2.5 items-start">
                                        <Monitor
                                            size={18}
                                            className="shrink-0 text-amber-600 dark:text-gold mt-0.5"
                                        />
                                        <div>
                                            <p className="text-xs font-black text-slate-800 dark:text-gold uppercase tracking-wider">
                                                Desktop/VPS Required for
                                                Auto-Sync
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-semibold">
                                                MetaTrader 5 auto-syncing
                                                requires installing our Trade
                                                Manager EA, which only runs on a{" "}
                                                <strong>
                                                    Windows Desktop or VPS
                                                </strong>
                                                . It cannot be set up directly
                                                from a phone browser.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 pt-1">
                                        <Button
                                            variant="outline"
                                            type="button"
                                            size="sm"
                                            onClick={async () => {
                                                setIsLoading(true);
                                                try {
                                                    const res =
                                                        await sendDesktopSetupLinkAction(
                                                            syncMethod
                                                        );
                                                    if (res.success) {
                                                        setLinkSent(true);
                                                        toast.success(
                                                            "Setup link sent to your email!"
                                                        );
                                                    } else {
                                                        toast.error(
                                                            res.error ||
                                                                "Failed to send email"
                                                        );
                                                    }
                                                } finally {
                                                    setIsLoading(false);
                                                }
                                            }}
                                            disabled={linkSent}
                                            className="w-full text-xs font-extrabold h-9 rounded-lg border-gold/30 text-amber-600 dark:text-gold hover:bg-gold/10 shrink-0"
                                        >
                                            {linkSent
                                                ? (<><Mail size={14} className="shrink-0" /> Setup Link Sent!</>)
                                                : (<><Mail size={14} className="shrink-0" /> Send Setup Link to Desktop Email</>)}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            type="button"
                                            size="sm"
                                            onClick={() =>
                                                setSyncMethod("MANUAL")
                                            }
                                            className="w-full text-xs font-bold h-9 rounded-lg border-gray-200 dark:border-white/10 text-slate-500 hover:bg-gray-100 dark:hover:bg-white/5 shrink-0"
                                        >
                                            <PenLine size={14} className="shrink-0" /> Log Manually for Now
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="flex items-center gap-1.5 border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white rounded-lg font-extrabold"
                                >
                                    <ArrowLeft size={14} />
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleStep3Submit}
                                    disabled={isLoading}
                                    className="flex-1 h-12 rounded-lg bg-gold hover:bg-amber-600 !text-white font-extrabold shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    Continue
                                    <ArrowRight size={16} />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
  STEP 4: NEXT ACTION
  ═══════════════════════════════════════════════════════ */}
                    {step === 4 && (
                        <div className="animate-in fade-in duration-300">
                            <div className="text-center mb-6">
                                <div className="inline-flex p-3 bg-gold/15 text-amber-600 dark:text-gold rounded-lg border border-gold/25 mb-3">
                                    <Check
                                        size={28}
                                        className="text-amber-600 dark:text-gold"
                                    />
                                </div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                                    You&apos;re all set!
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                                    Here&apos;s what you&apos;ve unlocked
                                </p>
                            </div>

                            {/* Unlocked features */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                {[
                                    {
                                        icon: BarChart3,
                                        label: "Performance Dashboard",
                                        color: "text-amber-600 dark:text-gold",
                                    },
                                    {
                                        icon: Target,
                                        label: "Trade Score & Intelligence",
                                        color: "text-amber-600 dark:text-gold",
                                    },
                                    {
                                        icon: FileText,
                                        label: "Weekly Review Reports",
                                        color: "text-emerald-500",
                                    },
                                    {
                                        icon: Trophy,
                                        label: "Edge Missions",
                                        color: "text-amber-600 dark:text-gold",
                                    },
                                ].map((f, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925]"
                                    >
                                        <f.icon
                                            size={16}
                                            className={cn(f.color, "shrink-0")}
                                        />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            {f.label}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Primary CTA based on sync method */}
                            <Button
                                type="button"
                                onClick={handleComplete}
                                disabled={isLoading}
                                className="w-full h-12 rounded-lg bg-gold hover:bg-amber-600 !text-white font-extrabold shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
                            >
                                {isLoading ? (
                                    <Loader2
                                        size={18}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <>
                                        {syncMethod === "EA_SYNC" && (
                                            <>
                                                <Cable size={16} />
                                                Set Up Trade Manager
                                            </>
                                        )}
                                        {syncMethod === "MANUAL" && (
                                            <>
                                                <Zap size={16} />
                                                Log First Trade
                                            </>
                                        )}
                                        <ArrowRight size={14} />
                                    </>
                                )}
                            </Button>

                            {syncMethod !== "MANUAL" && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={async () => {
                                        await completeOnboardingAction();
                                        router.push("/dashboard");
                                    }}
                                    className="w-full text-center text-xs text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-gold border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] rounded-lg font-black tracking-wide transition-colors py-2.5 uppercase h-auto"
                                >
                                    Skip setup, go to Dashboard
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
