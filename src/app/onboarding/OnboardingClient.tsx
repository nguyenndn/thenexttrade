"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
 Camera,
 Loader2,
 Upload,
 ArrowRight,
 ArrowLeft,
 Target,
 Search,
 ShieldCheck,
 Sparkles,
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
import { CountrySelect } from "@/components/ui/CountrySelect";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/track";
import { useIsMobileSyncDevice } from "@/lib/device";
import { sendDesktopSetupLinkAction } from "@/actions/first-session-onboarding";

type SyncMethod = "TNT_CONNECT" | "EA_SYNC" | "MANUAL";

const TRADING_GOALS = [
 { id: "track", label: "Track my trades", description: "Keep an organized record of all my entries and exits", icon: BarChart3 },
 { id: "mistakes", label: "Find my mistakes", description: "Identify patterns that cost me money", icon: Search },
 { id: "discipline", label: "Build discipline", description: "Follow my plan and manage risk consistently", icon: ShieldCheck },
 { id: "pro", label: "Prepare for Pro tools", description: "Get EA access, AI coaching, and advanced analytics", icon: Sparkles },
] as const;

interface OnboardingClientProps {
 initialData: {
 email: string;
 fullName: string;
 username: string;
 bio: string;
 avatarUrl: string | null;
 country: string;
 };
}

export default function OnboardingClient({ initialData }: OnboardingClientProps) {
 const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
 const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData.avatarUrl);
 const [country, setCountry] = useState<string>(initialData.country);
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [tradingGoal, setTradingGoal] = useState<string | null>(null);
 const [syncMethod, setSyncMethod] = useState<SyncMethod>("TNT_CONNECT");
 const isMobile = useIsMobileSyncDevice();
 const [linkSent, setLinkSent] = useState(false);

 const router = useRouter();

 // Track onboarding started
 useEffect(() => {
 trackEvent("onboarding_started");
 }, []);

 // Track mobile sync warning viewed
 useEffect(() => {
 if (step === 3 && isMobile && (syncMethod === "TNT_CONNECT" || syncMethod === "EA_SYNC")) {
 import("@/actions/first-session-onboarding").then(m => {
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
 try {
 await saveTradingGoalStep(tradingGoal);
 trackEvent("onboarding_step_completed", { step: "goal", goal: tradingGoal });
 setStep(3);
 } catch {
 setError("Failed to save. Please try again.");
 } finally {
 setIsLoading(false);
 }
 };

 const handleStep3Submit = async () => {
 setIsLoading(true);
 try {
 await saveSyncPreferenceStep(syncMethod);
 trackEvent("onboarding_step_completed", { step: "sync" });
 trackEvent("onboarding_sync_method_selected", { method: syncMethod });
 setStep(4);
 } catch {
 setError("Failed to save. Please try again.");
 } finally {
 setIsLoading(false);
 }
 };

 const handleComplete = async () => {
 setIsLoading(true);
 try {
 await completeOnboardingAction();
 trackEvent("onboarding_completed", { syncMethod });

 // Redirect based on sync method
 if (syncMethod === "TNT_CONNECT") {
 router.push("/dashboard/accounts?setup=sync&method=tnt");
 } else if (syncMethod === "EA_SYNC") {
 router.push("/dashboard/accounts?setup=sync&method=ea");
 } else {
 router.push("/dashboard/journal?action=log-trade");
 }
 } catch {
 router.push("/dashboard");
 }
 };

 const handleSkip = async () => {
 setIsLoading(true);
 trackEvent("onboarding_skipped", { atStep: step });
 try {
 await skipOnboardingAction();
 } finally {
 router.push("/dashboard");
 }
 };

 const progressPercent = ((step - 1) / 3) * 100;

 return (
 <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F7F4EC] text-slate-800 dark:bg-transparent dark:text-white p-4 font-outfit relative overflow-hidden transition-colors duration-300">
 {/* Background gradient overlay to match auth pages exactly */}
 <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(245,158,11,0.16)_0%,rgba(255,255,255,0.72)_34%,rgba(16,185,129,0.10)_100%)] dark:bg-[linear-gradient(135deg,rgba(43,35,68,0.60)_0%,rgba(25,52,81,0.46)_48%,rgba(6,69,79,0.38)_100%)] pointer-events-none" />

 {/* Floating theme switcher top-right for convenience */}
 <div className="absolute top-6 right-6 z-20">
 <ThemeToggleSwitch />
 </div>

 {/* Fullscreen premium loading overlay */}
 {isLoading && (
 <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F7F4EC]/80 dark:bg-slate-950/85 backdrop-blur-md">
 <Loader2 size={40} className="animate-spin text-amber-500 mb-4" />
 <p className="text-slate-900 dark:text-amber-100 font-extrabold text-lg">Setting up your account...</p>
 <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Please wait, this may take a moment.</p>
 </div>
 )}

 {/* Logo area */}
 <div className="mb-8 relative z-10">
 <Logo />
 </div>

 {/* Premium glassmorphic card container */}
 <div className="w-full max-w-lg bg-white/85 dark:bg-[#11100C]/95 border border-amber-900/10 dark:border-amber-300/15 rounded-2xl shadow-[0_28px_90px_rgba(88,64,27,0.15)] dark:shadow-[0_28px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 overflow-hidden relative z-10">
 {/* Gold progress bar */}
 <div className="h-1.5 bg-amber-900/10 dark:bg-white/[0.08]">
 <div
 className="h-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 transition-all duration-500 ease-out shadow-[0_0_12px_rgba(245,158,11,0.3)]"
 style={{ width: `${progressPercent}%` }}
 />
 </div>

 {/* Step indicator */}
 <div className="flex items-center justify-between px-8 pt-6 pb-2">
 <div className="flex items-center gap-2">
 {[1, 2, 3, 4].map((s) => (
 <div
 key={s}
 className={cn(
 "h-2 rounded-full transition-all duration-300",
 step === s
 ? "w-8 bg-amber-500 shadow-sm shadow-amber-500/30"
 : step > s
 ? "w-2 bg-amber-500/50"
 : "w-2 bg-slate-200 dark:bg-white/10"
 )}
 />
 ))}
 </div>
 <button
 onClick={handleSkip}
 className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 font-extrabold transition-colors uppercase tracking-wider"
 >
 <SkipForward size={12} />
 Skip
 </button>
 </div>

 <div className="p-8 pt-4">
 {/* ═══════════════════════════════════════════════════════
 STEP 1: IDENTITY
 ═══════════════════════════════════════════════════════ */}
 {step === 1 && (
 <div className="animate-in fade-in duration-300">
 <div className="text-center mb-6">
 <h1 className="text-2xl font-black text-slate-900 dark:text-white">Set up your profile</h1>
 <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-semibold">Your identity on the platform</p>
 </div>

 <form action={handleStep1Submit} className="space-y-5">
 {error && (
 <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center font-bold">
 {error}
 </div>
 )}

 {/* User Identity Row */}
 <div className="flex items-center gap-3 p-3.5 rounded-xl border border-amber-950/10 bg-slate-500/5 dark:bg-white/[0.02]">
 <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-sm shrink-0 border border-amber-500/20">
 {initialData.fullName ? initialData.fullName[0].toUpperCase() : (initialData.email ? initialData.email[0].toUpperCase() : "U")}
 </div>
 <div className="min-w-0">
 <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Account Identity</p>
 <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate leading-snug">
 {initialData.fullName ? `${initialData.fullName} (${initialData.email})` : initialData.email}
 </p>
 </div>
 </div>

 {/* Avatar Upload */}
 <div className="flex flex-col items-center gap-3">
 <div className="relative group cursor-pointer">
 <div className={cn(
 "w-24 h-24 rounded-full bg-white/50 dark:bg-black/20 border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors relative",
 error?.includes("Image size") 
 ? "border-red-400 dark:border-red-500/50" 
 : "border-amber-500/30 group-hover:border-amber-500"
 )}>
 {avatarPreview ? (
 <Image
 src={avatarPreview}
 alt="Avatar Preview"
 fill
 className="object-cover"
 />
 ) : (
 <Camera className="text-slate-400 dark:text-slate-500 group-hover:text-amber-500 transition-colors" size={32} />
 )}
 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
 <Upload className="text-white" size={20} />
 </div>
 </div>
 <input
 type="file"
 name="avatar"
 accept="image/*"
 className="absolute inset-0 opacity-0 cursor-pointer"
 onChange={handleImageChange}
 />
 </div>
 <p className={`text-xs font-semibold ${error?.includes("Image size") ? "text-red-500" : "text-slate-400 dark:text-slate-500"}`}>
 {error?.includes("Image size") ? "File too large (>1MB)" : "Optional • Max 1MB"}
 </p>
 </div>

 {/* Username */}
 <div className="space-y-1.5">
 <label htmlFor="username" className="text-sm font-black text-slate-700 dark:text-slate-300">Username <span className="text-red-400">*</span></label>
 <input
 type="text"
 name="username"
 id="username"
 required
 defaultValue={initialData.username}
 placeholder="@username"
 className="w-full h-11 px-4 bg-white/50 dark:bg-black/20 border border-amber-900/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-black/25 focus:border-amber-400 dark:focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/30 dark:focus:ring-amber-300/20 transition-all rounded-xl focus:outline-none"
 />
 </div>

 {/* Country Selector */}
 <div className="space-y-1.5">
 <label htmlFor="country" className="text-sm font-black text-slate-700 dark:text-slate-300">Country <span className="text-red-400">*</span></label>
 <CountrySelect
 value={country}
 onChange={(val) => setCountry(val)}
 required={true}
 />
 </div>

 {/* Bio */}
 <div className="space-y-1.5">
 <label htmlFor="bio" className="text-sm font-black text-slate-700 dark:text-slate-300">Bio <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span></label>
 <textarea
 name="bio"
 id="bio"
 rows={2}
 defaultValue={initialData.bio}
 placeholder="Tell us about your trading journey..."
 className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-amber-900/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-black/25 focus:border-amber-400 dark:focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/30 dark:focus:ring-amber-300/20 transition-all rounded-xl resize-none focus:outline-none"
 />
 </div>

 <Button
 type="submit"
 disabled={isLoading}
 className="w-full h-12 rounded-xl border-none bg-[linear-gradient(135deg,#F8D46B_0%,#D99A26_45%,#8A5A13_100%)] text-base font-black text-white shadow-[0_6px_20px_rgba(217,154,38,0.25)] hover:shadow-[0_8px_24px_rgba(217,154,38,0.35)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
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
 <h1 className="text-2xl font-black text-slate-900 dark:text-white">What&apos;s your main goal?</h1>
 <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-semibold">This helps us personalize your experience</p>
 </div>

 <div className="space-y-3 mb-6">
 {TRADING_GOALS.map((g) => {
 const Icon = g.icon;
 return (
 <button
 key={g.id}
 type="button"
 onClick={() => setTradingGoal(g.id)}
 className={cn(
 "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200",
 tradingGoal === g.id
 ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-sm shadow-amber-500/10"
 : "border-amber-900/10 hover:border-amber-500/35 dark:hover:border-amber-500/25 bg-white/30 dark:bg-white/[0.01]"
 )}
 >
 <div className={cn(
 "p-2 rounded-lg shrink-0 transition-colors",
 tradingGoal === g.id ? "bg-amber-500/10 text-amber-500" : "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500"
 )}>
 <Icon size={20} />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-black text-slate-800 dark:text-white">{g.label}</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{g.description}</p>
 </div>
 {tradingGoal === g.id && (
 <Check size={16} className="text-amber-500 shrink-0 animate-in fade-in zoom-in duration-200" />
 )}
 </button>
 );
 })}
 </div>

 <div className="flex gap-3">
 <Button
 variant="outline"
 type="button"
 onClick={() => setStep(1)}
 className="flex items-center gap-1.5 border-amber-900/10 text-slate-600 dark:text-slate-300 hover:bg-amber-500/10 hover:text-slate-900 dark:hover:text-white rounded-xl font-extrabold"
 >
 <ArrowLeft size={14} />
 Back
 </Button>
 <Button
 type="button"
 onClick={handleStep2Submit}
 disabled={!tradingGoal || isLoading}
 className="flex-1 h-12 rounded-xl border-none bg-[linear-gradient(135deg,#F8D46B_0%,#D99A26_45%,#8A5A13_100%)] text-base font-black text-white shadow-[0_6px_20px_rgba(217,154,38,0.25)] hover:shadow-[0_8px_24px_rgba(217,154,38,0.35)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
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
 <h1 className="text-2xl font-black text-slate-900 dark:text-white">How will you log trades?</h1>
 <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-semibold">You can always change this later</p>
 </div>

 <div className="space-y-4 mb-6">
 {/* TNT Connect */}
 <button
 type="button"
 onClick={() => setSyncMethod("TNT_CONNECT")}
 className={cn(
 "w-full rounded-xl border-2 p-4 text-left transition-all duration-200 relative block",
 syncMethod === "TNT_CONNECT"
 ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-sm shadow-amber-500/10"
 : "border-amber-900/10 hover:border-amber-500/35 dark:hover:border-amber-500/25 bg-white/30 dark:bg-white/[0.01]"
 )}
 >
 <span className="absolute -top-2 left-3 px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest rounded-md">Recommended</span>
 <div className="flex items-center gap-3">
 <Monitor size={20} className="text-amber-500 shrink-0" />
 <div>
 <p className="text-sm font-black text-slate-800 dark:text-white">TNT Connect App</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Auto-sync trades from MT5 via system tray app</p>
 </div>
 </div>
 </button>

 {/* EA Sync */}
 <button
 type="button"
 onClick={() => setSyncMethod("EA_SYNC")}
 className={cn(
 "w-full rounded-xl border-2 p-4 text-left transition-all duration-200 relative block",
 syncMethod === "EA_SYNC"
 ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-sm shadow-amber-500/10"
 : "border-amber-900/10 hover:border-amber-500/35 dark:hover:border-amber-500/25 bg-white/30 dark:bg-white/[0.01]"
 )}
 >
 <span className="absolute -top-2 left-3 px-2 py-0.5 bg-amber-700 dark:bg-amber-600 text-white text-[8px] font-black uppercase tracking-widest rounded-md">Advanced</span>
 <div className="flex items-center gap-3">
 <Cable size={20} className="text-amber-600 dark:text-amber-400 shrink-0" />
 <div>
 <p className="text-sm font-black text-slate-800 dark:text-white">EA Sync Package</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Expert Advisor attached to an MT5 chart</p>
 </div>
 </div>
 </button>

 {/* Manual */}
 <button
 type="button"
 onClick={() => setSyncMethod("MANUAL")}
 className={cn(
 "w-full rounded-xl border-2 p-4 text-left transition-all duration-200 relative block",
 syncMethod === "MANUAL"
 ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-sm shadow-amber-500/10"
 : "border-amber-900/10 hover:border-amber-500/35 dark:hover:border-amber-500/25 bg-white/30 dark:bg-white/[0.01]"
 )}
 >
 <div className="flex items-center gap-3">
 <PenLine size={20} className="text-slate-400 dark:text-slate-500 shrink-0" />
 <div>
 <p className="text-sm font-black text-slate-800 dark:text-white">Manual Journal</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Log trades manually. Set up sync later.</p>
 </div>
 </div>
 </button>
 </div>

 {isMobile && (syncMethod === "TNT_CONNECT" || syncMethod === "EA_SYNC") && (
 <div className="mb-6 p-4 rounded-xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-500/10 space-y-3 animate-in slide-in-from-top duration-300">
 <div className="flex gap-2.5 items-start">
 <span className="text-lg">💻</span>
 <div>
 <p className="text-xs font-black text-slate-800 dark:text-amber-300 uppercase tracking-wider">Desktop/VPS Required for Auto-Sync</p>
 <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-semibold">
 MetaTrader 5 auto-syncing requires running our local helper app, which only runs on a <strong>Windows Desktop or VPS</strong>. It cannot be set up directly from a phone browser.
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
 const res = await sendDesktopSetupLinkAction(syncMethod);
 if (res.success) {
 setLinkSent(true);
 alert("Setup link sent to your email!");
 } else {
 alert(res.error || "Failed to send email");
 }
 } finally {
 setIsLoading(false);
 }
 }}
 disabled={linkSent}
 className="w-full text-xs font-extrabold h-9 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 shrink-0"
 >
 {linkSent ? "📩 Setup Link Sent!" : "📩 Send Setup Link to Desktop Email"}
 </Button>
 <Button
 variant="ghost"
 type="button"
 size="sm"
 onClick={() => setSyncMethod("MANUAL")}
 className="w-full text-xs font-bold h-9 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 shrink-0"
 >
 ✍️ Log Manually for Now
 </Button>
 </div>
 </div>
 )}

 <div className="flex gap-3">
 <Button
 variant="outline"
 type="button"
 onClick={() => setStep(2)}
 className="flex items-center gap-1.5 border-amber-900/10 text-slate-600 dark:text-slate-300 hover:bg-amber-500/10 hover:text-slate-900 dark:hover:text-white rounded-xl font-extrabold"
 >
 <ArrowLeft size={14} />
 Back
 </Button>
 <Button
 type="button"
 onClick={handleStep3Submit}
 disabled={isLoading}
 className="flex-1 h-12 rounded-xl border-none bg-[linear-gradient(135deg,#F8D46B_0%,#D99A26_45%,#8A5A13_100%)] text-base font-black text-white shadow-[0_6px_20px_rgba(217,154,38,0.25)] hover:shadow-[0_8px_24px_rgba(217,154,38,0.35)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
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
 <div className="inline-flex p-3 bg-amber-500/15 text-amber-500 rounded-full mb-3 shadow-[0_4px_12px_rgba(245,158,11,0.2)] animate-pulse">
 <Check size={28} className="text-amber-500" />
 </div>
 <h1 className="text-2xl font-black text-slate-900 dark:text-white">You&apos;re all set!</h1>
 <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-semibold">Here&apos;s what you&apos;ve unlocked</p>
 </div>

 {/* Unlocked features */}
 <div className="grid grid-cols-2 gap-3 mb-6">
 {[
 { icon: BarChart3, label: "Performance Dashboard", color: "text-amber-500" },
 { icon: Target, label: "Trade Score & Intelligence", color: "text-amber-600 dark:text-amber-400" },
 { icon: FileText, label: "Weekly Review Reports", color: "text-emerald-500" },
 { icon: Trophy, label: "Edge Missions", color: "text-amber-500" },
 ].map((f, i) => (
 <div
 key={i}
 className="flex items-center gap-2.5 p-3 rounded-xl border border-amber-900/10 bg-white/60 dark:bg-white/[0.02]"
 >
 <f.icon size={16} className={cn(f.color, "shrink-0")} />
 <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{f.label}</span>
 </div>
 ))}
 </div>

 {/* Primary CTA based on sync method */}
 <Button
 type="button"
 onClick={handleComplete}
 disabled={isLoading}
 className="w-full h-12 rounded-xl border-none bg-[linear-gradient(135deg,#F8D46B_0%,#D99A26_45%,#8A5A13_100%)] text-base font-black text-white shadow-[0_6px_20px_rgba(217,154,38,0.25)] hover:shadow-[0_8px_24px_rgba(217,154,38,0.35)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
 >
 {isLoading ? (
 <Loader2 size={18} className="animate-spin" />
 ) : (
 <>
 {syncMethod === "TNT_CONNECT" && (
 <>
 <Monitor size={16} />
 Set Up TNT Connect
 </>
 )}
 {syncMethod === "EA_SYNC" && (
 <>
 <Cable size={16} />
 Set Up EA Sync
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
 <button
 type="button"
 onClick={async () => {
 await completeOnboardingAction();
 router.push("/dashboard");
 }}
 className="w-full text-center text-xs text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 font-black tracking-wide transition-colors py-2 uppercase"
 >
 Skip setup, go to Dashboard →
 </button>
 )}
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
