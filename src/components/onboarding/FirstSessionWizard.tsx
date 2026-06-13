"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
 Monitor,
 Cable,
 PenLine,
 ArrowRight,
 Clock,
 Sparkles,
 BarChart3,
 Zap,
 HelpCircle,
 ChevronRight,
 X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogDescription,
} from "@/components/ui/Dialog";
import {
 saveFirstSessionSyncMethodAction,
 dismissFirstSessionWizardAction,
 completeFirstSessionWizardAction,
 recordMobileSyncFallbackViewedAction,
 sendDesktopSetupLinkAction,
 recordMobileSyncManualFallbackAction,
 recordMobileSyncContinueAnywayAction,
} from "@/actions/first-session-onboarding";
import { trackEvent } from "@/lib/track";
import type {
 FirstSessionStep,
 FirstSessionComputedState,
 SyncMethod,
} from "@/lib/onboarding/first-session.server";
import { SetupProgressTrail } from "@/components/onboarding/SetupProgressTrail";
import { useIsMobileSyncDevice } from "@/lib/device";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FirstSessionWizardProps {
 state: FirstSessionComputedState;
 open: boolean;
 onOpenChange: (open: boolean) => void;
}



// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FirstSessionWizard({
 state,
 open,
 onOpenChange,
}: FirstSessionWizardProps) {
 const router = useRouter();
 const hasTrackedRef = useRef(false);
 const isMobile = useIsMobileSyncDevice();
 const [mobileFallbackMethod, setMobileFallbackMethod] = useState<"TNT_CONNECT" | "EA_SYNC" | null>(null);
 const [linkSent, setLinkSent] = useState(false);
 const [isPending, startTransition] = useTransition();

 // Track wizard shown — only once
 useEffect(() => {
 if (open && !hasTrackedRef.current) {
 hasTrackedRef.current = true;
 trackEvent("first_session_wizard_shown", { step: state.currentStep });
 }
 if (!open) {
 hasTrackedRef.current = false;
 }
 }, [open, state.currentStep]);

 // Reset fallback state when modal closes
 useEffect(() => {
 if (!open) {
 setMobileFallbackMethod(null);
 setLinkSent(false);
 }
 }, [open]);

 // If user opens the wizard at BRING_FIRST_DATA and has a sync method on mobile, auto-show fallback
 useEffect(() => {
 if (open && isMobile && state.currentStep === "BRING_FIRST_DATA" && !mobileFallbackMethod) {
 if (state.preferredSyncMethod === "TNT_CONNECT" || state.preferredSyncMethod === "EA_SYNC") {
 setMobileFallbackMethod(state.preferredSyncMethod);
 recordMobileSyncFallbackViewedAction(state.preferredSyncMethod);
 }
 }
 }, [open, isMobile, state.currentStep, state.preferredSyncMethod, mobileFallbackMethod]);

 const handleDismiss = async () => {
 trackEvent("first_session_wizard_dismissed");
 await dismissFirstSessionWizardAction();
 onOpenChange(false);
 };

 const handleComplete = async () => {
 trackEvent("first_session_wizard_completed");
 await completeFirstSessionWizardAction();
 onOpenChange(false);
 };

 const handleCtaClick = (step: string, href: string) => {
 trackEvent("first_session_cta_clicked", { step, href });
 onOpenChange(false);
 };

 /**
 * Handle manual journal selection from Step 1 (Connect Account).
 * Saves MANUAL preference before routing so dashboard shows correct CTA on return.
 */
 const handleManualSelect = async (href: string) => {
 trackEvent("first_session_sync_method_selected", { method: "MANUAL" });
 await saveFirstSessionSyncMethodAction("MANUAL");
 trackEvent("first_session_cta_clicked", { step: "CONNECT_ACCOUNT", href });
 onOpenChange(false);
 router.push(href);
 };

 /**
 * Handle sync method selection from Step 2 (Choose Sync Method).
 * Saves preference AND navigates to the setup URL (or shows mobile fallback warning).
 */
 const handleSyncMethodSelect = async (method: SyncMethod, href: string) => {
 trackEvent("first_session_sync_method_selected", { method });
 await saveFirstSessionSyncMethodAction(method);

 if (isMobile && (method === "TNT_CONNECT" || method === "EA_SYNC")) {
 await recordMobileSyncFallbackViewedAction(method);
 setMobileFallbackMethod(method);
 } else {
 trackEvent("first_session_cta_clicked", {
 step: "CHOOSE_SYNC_METHOD",
 href,
 });
 onOpenChange(false);
 router.push(href);
 }
 };

 const handleSendLink = () => {
 if (!mobileFallbackMethod) return;
 startTransition(async () => {
 const res = await sendDesktopSetupLinkAction(mobileFallbackMethod);
 if (res.success) {
 setLinkSent(true);
 } else {
 alert(res.error || "Failed to send email");
 }
 });
 };

 const handleLogManually = () => {
 if (!mobileFallbackMethod) return;
 startTransition(async () => {
 await recordMobileSyncManualFallbackAction(mobileFallbackMethod);
 await saveFirstSessionSyncMethodAction("MANUAL");
 onOpenChange(false);
 router.push("/dashboard/journal?action=log-trade&source=mobile-fallback");
 });
 };

 const handleContinueAnyway = () => {
 if (!mobileFallbackMethod) return;
 startTransition(async () => {
 await recordMobileSyncContinueAnywayAction(mobileFallbackMethod);
 const pathMethod = mobileFallbackMethod === "EA_SYNC" ? "ea" : "tnt";
 const href = `/dashboard/accounts?setup=sync&method=${pathMethod}&source=first-session`;
 onOpenChange(false);
 router.push(href);
 });
 };

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent
 hideCloseButton
 className="border-dashboard bg-white dark:bg-[#0F1116] p-0 rounded-2xl shadow-2xl overflow-hidden"
 style={{
 width: "min(560px, calc(100vw - 32px))",
 maxWidth: "560px",
 maxHeight: "min(680px, calc(100vh - 32px))",
 whiteSpace: "normal",
 wordBreak: "break-word",
 }}
 >
 <div className="flex items-center justify-between border-b border-dashboard px-5 py-3">
 <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
 Setup Guide
 </span>
 <button
 type="button"
 aria-label="Close setup wizard"
 onClick={() => onOpenChange(false)}
 className="flex h-8 w-8 items-center justify-center rounded-full border border-dashboard bg-white text-gray-500 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-white"
 >
 <X size={15} strokeWidth={2.4} />
 </button>
 </div>

 {/* Progress Indicator */}
 <div className="px-5 pt-4 pb-0">
 <SetupProgressTrail currentStep={state.currentStep} source="wizard" />
 </div>

 {/* Header */}
 <DialogHeader className="px-5 pt-3 pb-0">
 <DialogTitle className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
 {mobileFallbackMethod ? "Mobile setup warning" : "Set up your trading workspace"}
 </DialogTitle>
 <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 mt-1">
 {mobileFallbackMethod 
 ? "MetaTrader 5 auto-sync setup requires desktop" 
 : "One account, one sync path, one useful dashboard."}
 </DialogDescription>
 </DialogHeader>

 {/* Step Content */}
 <div className="px-5 pt-4 pb-1">
 {mobileFallbackMethod ? (
 <StepMobileSyncFallback
 method={mobileFallbackMethod}
 onSendLink={handleSendLink}
 onLogManually={handleLogManually}
 onContinueAnyway={handleContinueAnyway}
 linkSent={linkSent}
 isPending={isPending}
 />
 ) : (
 <>
 {state.currentStep === "CONNECT_ACCOUNT" && (
 <StepConnectAccount
 onCtaClick={handleCtaClick}
 onManualSelect={handleManualSelect}
 />
 )}
 {state.currentStep === "CHOOSE_SYNC_METHOD" && (
 <StepChooseSyncMethod onSelect={handleSyncMethodSelect} />
 )}
 {state.currentStep === "BRING_FIRST_DATA" && (
 <StepBringFirstData
 method={state.preferredSyncMethod}
 onCtaClick={handleCtaClick}
 />
 )}
 {state.currentStep === "REVIEW_DASHBOARD" && (
 <StepReviewDashboard
 tradeCount={state.tradeCount}
 onComplete={handleComplete}
 />
 )}
 </>
 )}
 </div>

 {/* Footer */}
 <div className="px-5 pb-5 pt-2 flex items-center justify-between">
 <button
 onClick={handleDismiss}
 className="text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-1"
 >
 <Clock size={12} />
 <span>Remind me later</span>
 </button>
 <Link
 href="/get-started"
 className="text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
 >
 <HelpCircle size={12} />
 <span>Need help?</span>
 </Link>
 </div>
 </DialogContent>
 </Dialog>
 );
}

// ---------------------------------------------------------------------------
// Step 1: Connect Account
// ---------------------------------------------------------------------------

function StepConnectAccount({
 onCtaClick,
 onManualSelect,
}: {
 onCtaClick: (step: string, href: string) => void;
 onManualSelect: (href: string) => Promise<void>;
}) {
 const addHref = "/dashboard/accounts?action=add&source=first-session";
 const manualHref =
 "/dashboard/journal?action=log-trade&source=first-session";
 const [isPending, startTransition] = useTransition();

 const handleManualClick = () => {
 startTransition(async () => {
 await onManualSelect(manualHref);
 });
 };

 return (
 <div className="space-y-3">
 <div className="p-3.5 bg-gradient-to-br from-primary/[0.04] to-cyan-500/[0.02] border border-primary/15 rounded-xl space-y-2.5">
 <div className="flex items-start gap-2.5">
 <div className="p-2 bg-primary/10 rounded-lg shrink-0">
 <Cable size={18} className="text-primary" />
 </div>
 <div className="min-w-0">
 <h3 className="text-sm font-black text-gray-800 dark:text-white">
 Connect your first MT5 account
 </h3>
 <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
 Add your account number so TheNextTrade can organize trades and
 build your dashboard.
 </p>
 </div>
 </div>
 <div className="flex justify-end mt-1">
 <Link
 href={addHref}
 onClick={() => onCtaClick("CONNECT_ACCOUNT", addHref)}
 >
 <Button className="bg-primary hover:bg-primary/90 text-white font-extrabold text-xs h-9 px-5 rounded-xl shadow-sm shadow-primary/20 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-1.5 border-0 group">
 <span>Add Account</span>
 <ArrowRight
 size={14}
 className="transition-transform group-hover:translate-x-0.5"
 />
 </Button>
 </Link>
 </div>
 </div>

 {/* Secondary: Manual Journal — saves MANUAL preference then routes */}
 <button
 type="button"
 onClick={handleManualClick}
 disabled={isPending}
 className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-dashboard hover:border-primary/30 dark:hover:border-primary/20 bg-white dark:bg-white/[0.01] transition-all duration-300 group disabled:opacity-60"
 >
 <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg shrink-0">
 <PenLine size={16} className="text-gray-500 dark:text-gray-400" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
 I want to log manually
 </p>
 <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
 Start with manual entries — set up sync later.
 </p>
 </div>
 <ChevronRight
 size={14}
 className="text-gray-300 dark:text-gray-600 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
 />
 </button>
 </div>
 );
}

// ---------------------------------------------------------------------------
// Step 2: Choose Sync Method
// ---------------------------------------------------------------------------

function StepChooseSyncMethod({
 onSelect,
}: {
 onSelect: (method: SyncMethod, href: string) => void;
}) {
 const options: {
 method: SyncMethod;
 label: string;
 badge: string;
 description: string;
 href: string;
 icon: React.ReactNode;
 badgeClass: string;
 }[] = [
 {
 method: "TNT_CONNECT",
 label: "TNT Connect",
 badge: "Recommended",
 description:
 "Best for Windows MT5 users. Sync selected periods from the desktop app.",
 href: "/dashboard/accounts?setup=sync&method=tnt&source=first-session",
 icon: <Monitor size={20} className="text-primary" />,
 badgeClass:
 "bg-primary/10 text-primary border-primary/20",
 },
 {
 method: "EA_SYNC",
 label: "EA Sync",
 badge: "Advanced",
 description:
 "Best for VPS or continuous chart-based sync.",
 href: "/dashboard/accounts?setup=sync&method=ea&source=first-session",
 icon: <Zap size={20} className="text-amber-500" />,
 badgeClass:
 "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
 },
 {
 method: "MANUAL",
 label: "Manual Journal",
 badge: "Manual",
 description:
 "Best if you want to test the journal before installing anything.",
 href: "/dashboard/journal?action=log-trade&source=first-session",
 icon: <PenLine size={20} className="text-gray-500 dark:text-gray-400" />,
 badgeClass:
 "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 border-dashboard ",
 },
 ];

 return (
 <div className="space-y-2.5">
 <div className="space-y-1 mb-1">
 <h3 className="text-sm font-black text-gray-800 dark:text-white">
 Choose how trades get into your journal
 </h3>
 <p className="text-xs text-gray-500 dark:text-gray-400">
 Pick the setup that matches how you use MT5. You can change this later.
 </p>
 </div>

 {options.map((opt) => (
 <button
 key={opt.method}
 onClick={() => onSelect(opt.method, opt.href)}
 className="w-full text-left flex items-start gap-3 p-3 rounded-xl border border-dashboard hover:border-primary/30 dark:hover:border-primary/20 bg-white dark:bg-white/[0.01] transition-all duration-300 group"
 >
 <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg shrink-0 group-hover:bg-primary/10 transition-colors">
 {React.cloneElement(opt.icon as React.ReactElement<{ size?: number }>, {
 size: 18,
 })}
 </div>
 <div className="flex-1 min-w-0 space-y-1">
 <div className="flex items-center gap-2">
 <span className="text-sm font-bold text-gray-800 dark:text-white">
 {opt.label}
 </span>
 <span
 className={`text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded border ${opt.badgeClass}`}
 >
 {opt.badge}
 </span>
 </div>
 <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
 {opt.description}
 </p>
 </div>
 <ChevronRight
 size={14}
 className="text-gray-300 dark:text-gray-600 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-2"
 />
 </button>
 ))}
 </div>
 );
}

// ---------------------------------------------------------------------------
// Step 3: Bring First Data
// ---------------------------------------------------------------------------

function StepBringFirstData({
 method,
 onCtaClick,
}: {
 method: SyncMethod;
 onCtaClick: (step: string, href: string) => void;
}) {
 const config: Record<
 SyncMethod,
 { title: string; description: string; cta: string; href: string; icon: React.ReactNode }
 > = {
 TNT_CONNECT: {
 title: "Sync your first trades",
 description:
 "Open TNT Connect, paste your Sync API Key, then sync Today or Last Week.",
 cta: "Open Sync Setup",
 href: "/dashboard/accounts?setup=sync&method=tnt&source=first-session",
 icon: <Monitor size={20} className="text-primary" />,
 },
 EA_SYNC: {
 title: "Verify EA Sync",
 description:
 "Attach the EA to MT5, paste your Sync API Key, and confirm the heartbeat.",
 cta: "Open EA Setup",
 href: "/dashboard/accounts?setup=sync&method=ea&source=first-session",
 icon: <Zap size={20} className="text-amber-500" />,
 },
 MANUAL: {
 title: "Log your first trade",
 description:
 "One trade is enough to unlock the first useful dashboard and review flow.",
 cta: "Log First Trade",
 href: "/dashboard/journal?action=log-trade&source=first-session",
 icon: <PenLine size={20} className="text-gray-500" />,
 },
 };

 const c = config[method];

 return (
 <div className="space-y-3">
 <div className="p-3.5 bg-gradient-to-br from-primary/[0.04] to-cyan-500/[0.02] border border-primary/15 rounded-xl space-y-2.5">
 <div className="flex items-center gap-2">
 <div className="p-2 bg-primary/10 rounded-lg">{c.icon}</div>
 <h3 className="text-sm font-black text-gray-800 dark:text-white">
 {c.title}
 </h3>
 </div>
 <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
 {c.description}
 </p>
 <Link
 href={c.href}
 onClick={() => onCtaClick("BRING_FIRST_DATA", c.href)}
 >
 <Button className="bg-primary hover:bg-primary/90 text-white font-extrabold text-xs h-9 px-4 rounded-xl shadow-sm shadow-primary/20 hover:shadow-md active:scale-95 transition-all duration-300 flex items-center gap-1.5 border-0 group mt-1">
 <span>{c.cta}</span>
 <ArrowRight
 size={14}
 className="transition-transform group-hover:translate-x-0.5"
 />
 </Button>
 </Link>
 </div>

 {/* Context hint */}
 <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-dashboard">
 <HelpCircle
 size={14}
 className="text-gray-400 dark:text-gray-500 shrink-0"
 />
 <p className="text-[11px] text-gray-500 dark:text-gray-400">
 {method === "MANUAL"
 ? "Manual journal is fine for starting. You can set up TNT Connect or EA Sync later from Account Hub."
 : "Your account is connected, but there is no trade data yet. Sync history or log one trade manually."}
 </p>
 </div>
 </div>
 );
}

// ---------------------------------------------------------------------------
// Step 4: Review Dashboard
// ---------------------------------------------------------------------------

function StepReviewDashboard({
 tradeCount,
 onComplete,
}: {
 tradeCount: number;
 onComplete: () => void;
}) {
 return (
 <div className="space-y-3">
 <div className="p-4 bg-gradient-to-br from-emerald-500/[0.05] to-primary/[0.03] border border-emerald-500/15 rounded-xl space-y-3 text-center">
 <div className="w-10 h-10 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center">
 <Sparkles size={20} className="text-emerald-500" />
 </div>
 <div className="space-y-1">
 <h3 className="text-base font-black text-gray-800 dark:text-white">
 Your dashboard is ready
 </h3>
 <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-md mx-auto">
 You can now review win rate, P/L, symbols, reports, and next actions
 from real trade data.
 </p>
 </div>

 <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
 <Link href="/dashboard" onClick={onComplete}>
 <Button className="bg-primary hover:bg-primary/90 text-white font-extrabold text-xs h-9 px-5 rounded-xl shadow-sm shadow-primary/20 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-1.5 border-0 group">
 <BarChart3 size={14} />
 <span>Open Dashboard</span>
 </Button>
 </Link>
 {tradeCount >= 3 && (
 <Link href="/dashboard/reports/weekly" onClick={onComplete}>
 <Button
 variant="outline"
 className="font-extrabold text-xs h-9 px-4 rounded-xl border-dashboard hover:border-primary/30 transition-all"
 >
 Generate Weekly Review
 </Button>
 </Link>
 )}
 </div>
 </div>
 </div>
 );
}

// ---------------------------------------------------------------------------
// Step Mobile Sync Fallback
// ---------------------------------------------------------------------------

interface StepMobileSyncFallbackProps {
 method: "TNT_CONNECT" | "EA_SYNC";
 onSendLink: () => void;
 onLogManually: () => void;
 onContinueAnyway: () => void;
 linkSent: boolean;
 isPending: boolean;
}

function StepMobileSyncFallback({
 method,
 onSendLink,
 onLogManually,
 onContinueAnyway,
 linkSent,
 isPending,
}: StepMobileSyncFallbackProps) {
 const setupName = method === "EA_SYNC" ? "EA Sync" : "TNT Connect";
 return (
 <div className="space-y-4">
 <div className="p-4 bg-gradient-to-br from-amber-500/[0.05] to-red-500/[0.02] border border-amber-500/15 rounded-xl space-y-3">
 <div className="flex items-start gap-3">
 <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-500 shrink-0 text-lg">
 💻
 </div>
 <div>
 <h3 className="text-sm font-black text-gray-800 dark:text-white">
 Desktop Required for {setupName}
 </h3>
 <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-semibold">
 Because MetaTrader 5 auto-syncing requires running our local helper app, setup must be completed on a <strong>Windows Desktop or VPS</strong>.
 </p>
 </div>
 </div>
 </div>

 <div className="space-y-2">
 {/* Action 1: Send desktop link */}
 <Button
 onClick={onSendLink}
 disabled={isPending || linkSent}
 className="w-full h-11 bg-primary text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2"
 >
 {linkSent ? "📩 Setup Link Sent to Email!" : "📩 Send Setup Link to Desktop Email"}
 </Button>

 {/* Action 2: Log manually */}
 <Button
 variant="outline"
 onClick={onLogManually}
 disabled={isPending}
 className="w-full h-11 border-dashboard text-gray-700 dark:text-gray-300 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2"
 >
 ✍️ Log Trades Manually for Now
 </Button>

 {/* Action 3: Continue anyway */}
 <button
 type="button"
 onClick={onContinueAnyway}
 disabled={isPending}
 className="w-full text-center text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-black uppercase tracking-wider py-2"
 >
 Continue anyway (I am on a remote desktop/VPS)
 </button>
 </div>
 </div>
 );
}

