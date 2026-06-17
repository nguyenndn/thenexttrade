"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { login, signInWithMagicLink } from "@/app/auth/actions";
import { Mail, Lock, Eye, EyeOff, Sparkles, CheckCircle, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { TurnstileWidget } from "@/components/ui/TurnstileWidget";
import { trackEvent } from "@/lib/track";

// ─── Full-screen loading overlay rendered via portal ───
function LoginSuccessOverlay({ name, redirectTo }: { name: string; redirectTo?: string }) {
 const [progress, setProgress] = useState(0);

 useEffect(() => {
 // Start progress bar animation
 const t1 = setTimeout(() => setProgress(100), 100);

 // Build dashboard URL with accountId + today (same logic as UserMenu dropdown)
 const t2 = setTimeout(() => {
 const match = document.cookie.match(/(?:^|;\s*)last_account_id=([^;]+)/);
 const accountId = match?.[1];
 const today = new Date().toISOString().slice(0, 10);
 const url = redirectTo || (accountId
 ? `/dashboard?accountId=${accountId}&from=${today}&to=${today}`
 : "/dashboard");
 window.location.href = url;
 }, 2400);

 return () => { clearTimeout(t1); clearTimeout(t2); };
 }, [redirectTo]);

 return createPortal(
 <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none bg-[#F7F4EC] dark:bg-[linear-gradient(135deg,#2b2344_0%,#193451_50%,#06454f_100%)] transition-colors" style={{ margin: 0 }}>
 {/* Light mode: warm amber radial glow */}
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,154,38,0.12)_0%,rgba(217,154,38,0.04)_40%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(0,200,136,0.08)_0%,rgba(0,200,136,0.02)_40%,transparent_70%)] pointer-events-none" />
 {/* Secondary glow */}
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(16,185,129,0.06)_0%,transparent_50%)] dark:bg-[radial-gradient(ellipse_at_30%_20%,rgba(247,201,72,0.04)_0%,transparent_50%)] pointer-events-none" />

 <div className="flex flex-col items-center space-y-8 max-w-md px-6 text-center z-10 animate-in fade-in duration-500">
 {/* Logo with glow */}
 <div className="relative mb-2">
 <div className="absolute inset-0 scale-[2.5] rounded-full bg-gradient-to-r from-amber-400/20 via-primary/15 to-amber-400/20 dark:from-primary/20 dark:via-emerald-500/10 dark:to-primary/20 blur-3xl animate-pulse" />
 <div className="relative scale-[1.6]">
 <Logo />
 </div>
 </div>

 {/* Welcome text — more prominent */}
 <div className="space-y-3 animate-in slide-in-from-bottom-3 duration-700 delay-200 fill-mode-both">
 <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
 Welcome back, <span className="text-primary">{name}</span>
 </h2>
 <p className="text-base text-slate-500 dark:text-gray-400 font-medium">
 {redirectTo === "/onboarding" ? "Preparing your setup..." : "Preparing your dashboard..."}
 </p>
 </div>

 {/* Glowing progress bar */}
 <div className="w-64 animate-in fade-in duration-500 delay-400 fill-mode-both">
 <div className="h-1.5 bg-amber-900/10 dark:bg-white/[0.08] rounded-full overflow-hidden">
 <div
 className="h-full rounded-full bg-gradient-to-r from-amber-500 via-primary to-emerald-400 dark:from-primary dark:via-emerald-400 dark:to-primary shadow-[0_0_16px_rgba(0,200,136,0.45),0_0_4px_rgba(0,200,136,0.7)] transition-all duration-[2200ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
 style={{ width: `${progress}%` }}
 />
 </div>
 </div>
 </div>
 </div>,
 document.body
 );
}

export default function LoginPage() {
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [showPassword, setShowPassword] = useState(false);
 const [mode, setMode] = useState<"password" | "magic">("password");
 const [magicLinkSent, setMagicLinkSent] = useState(false);
 const [turnstileToken, setTurnstileToken] = useState("");
 const [showTransition, setShowTransition] = useState(false);
 const [transitionName, setTransitionName] = useState("Trader");
 const [transitionRedirectTo, setTransitionRedirectTo] = useState<string | undefined>();

 const inputClassName =
 "h-12 bg-white/80 border-amber-900/10 text-slate-900 text-base py-3 placeholder:text-slate-400 focus:bg-white focus:border-amber-400 focus:ring-amber-300/30 dark:bg-black/20 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-black/25 dark:focus:border-amber-300/60 dark:focus:ring-amber-300/20 transition-colors";

 const primaryButtonClassName =
 "w-full h-14 rounded-xl border-none bg-[linear-gradient(135deg,#F8D46B_0%,#D99A26_45%,#8A5A13_100%)] text-base font-black text-white shadow-[0_18px_36px_rgba(217,154,38,0.32)] hover:shadow-[0_20px_44px_rgba(217,154,38,0.42)]";

 const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
 e.preventDefault();
 setLoading(true);
 setError(null);

 const formData = new FormData(e.currentTarget);
 formData.set("cf-turnstile-response", turnstileToken);
 trackEvent("login_submitted", { method: "password" });
 const result = await login(formData);

 if (result?.error) {
 trackEvent("login_failed", { method: "password" });
 setError(result.error);
 setLoading(false);
 } else if (result?.requires2FA) {
 trackEvent("login_requires_2fa", { method: "password" });
 window.location.href = "/auth/verify-2fa";
 } else if (result?.success) {
 // ─── Show full-screen loading overlay via portal ───
 setTransitionName(result.name || "Trader");
 setTransitionRedirectTo(result.redirectTo);
 setShowTransition(true);
 }
 };

 const handleMagicLink = async (e: React.FormEvent<HTMLFormElement>) => {
 e.preventDefault();
 setLoading(true);
 setError(null);

 const formData = new FormData(e.currentTarget);
 formData.set("cf-turnstile-response", turnstileToken);
 trackEvent("login_submitted", { method: "magic_link" });
 const result = await signInWithMagicLink(formData);

 if (result?.error) {
 trackEvent("login_failed", { method: "magic_link" });
 setError(result.error);
 } else if (result?.success) {
 trackEvent("magic_link_requested");
 setMagicLinkSent(true);
 }
 setLoading(false);
 };

 const switchMode = (newMode: "password" | "magic") => {
 setMode(newMode);
 setError(null);
 setMagicLinkSent(false);
 };

 return (
 <>
 <div className="w-full max-w-[480px] mx-auto rounded-lg border border-amber-900/10 bg-white/85 p-8 shadow-[0_28px_90px_rgba(88,64,27,0.18)] backdrop-blur-xl transition-colors duration-300 dark:border-amber-300/15 dark:bg-[#11100C]/90 dark:shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
 <div className="flex justify-center mb-5">
 <Logo />
 </div>
 <div className="text-center mb-8">
 <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-extrabold uppercase text-amber-700 dark:text-amber-300">
 <ShieldCheck size={14} />
 Secure access
 </div>
 <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Welcome back</p>
 <h1 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">Login to your account</h1>
 </div>

 <div className="flex rounded-lg border border-amber-900/10 bg-[#F8F1E3] p-1 mb-6 dark:bg-white/[0.06]">
 <button
 type="button"
 onClick={() => switchMode("password")}
 className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
 mode === "password"
 ? "bg-white text-slate-950 shadow-sm shadow-amber-900/10 dark:bg-white/[0.06] dark:text-amber-200"
 : "text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
 }`}
 >
 <Lock size={16} />
 Password
 </button>
 <button
 type="button"
 onClick={() => switchMode("magic")}
 className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
 mode === "magic"
 ? "bg-white text-slate-950 shadow-sm shadow-amber-900/10 dark:bg-white/[0.06] dark:text-amber-200"
 : "text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
 }`}
 >
 <Sparkles size={16} />
 Magic Link
 </button>
 </div>

 {error && (
 <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center mb-6">
 {error}
 </div>
 )}

 {mode === "password" && (
 <form onSubmit={handleSubmit} className="space-y-6">
 <Input
 name="email"
 type="email"
 placeholder="hello@example.com"
 label="Email"
 required
 startIcon={<Mail size={20} className="text-amber-600/80 dark:text-amber-300/80" />}
 className={inputClassName}
 />

 <Input
 name="password"
 type={showPassword ? "text" : "password"}
 placeholder="Password"
 label="Password"
 required
 startIcon={<Lock size={20} className="text-amber-600/80 dark:text-amber-300/80" />}
 endIcon={
 <Button
 type="button"
 variant="ghost"
 size="icon"
 onClick={() => setShowPassword(!showPassword)}
 className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
 aria-label={showPassword ? "Hide password" : "Show password"}
 >
 {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
 </Button>
 }
 className={inputClassName}
 />

 <div className="flex items-center justify-between gap-4">
 <div className="flex items-center gap-2">
 <input
 type="checkbox"
 id="remember"
 className="appearance-none h-5 w-5 rounded border border-amber-900/20 bg-white checked:bg-amber-500 checked:border-amber-500 dark:bg-black/20 dark:border-white/20 dark:checked:bg-amber-400 dark:checked:border-amber-400 checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%2220%206%209%2017%204%2012%22%2F%3E%3C%2Fsvg%3E')] bg-[length:70%] bg-center bg-no-repeat transition-all cursor-pointer"
 />
 <label htmlFor="remember" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
 Stay signed in
 </label>
 </div>
 <Link href="/auth/forgot-password" className="text-sm text-amber-700 hover:text-amber-800 hover:underline font-semibold dark:text-amber-300 dark:hover:text-amber-200">
 Forgot your password?
 </Link>
 </div>

 <TurnstileWidget onVerify={setTurnstileToken} className="flex justify-center" />

 <Button type="submit" variant="primary" className={primaryButtonClassName} isLoading={loading}>
 Login
 </Button>
 </form>
 )}

 {mode === "magic" && !magicLinkSent && (
 <form onSubmit={handleMagicLink} className="space-y-6">
 <div className="text-center mb-2">
 <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
 Enter your email and we will send you a magic link to sign in instantly, no password needed.
 </p>
 </div>

 <Input
 name="email"
 type="email"
 placeholder="hello@example.com"
 label="Email"
 required
 startIcon={<Mail size={20} className="text-amber-600/80 dark:text-amber-300/80" />}
 className={inputClassName}
 />

 <TurnstileWidget onVerify={setTurnstileToken} className="flex justify-center" />

 <Button
 type="submit"
 variant="primary"
 className={`${primaryButtonClassName} flex items-center justify-center gap-2`}
 isLoading={loading}
 >
 <Sparkles size={18} />
 Send Magic Link
 </Button>
 </form>
 )}

 {mode === "magic" && magicLinkSent && (
 <div className="text-center py-8 space-y-4">
 <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/25">
 <CheckCircle className="text-amber-600 dark:text-amber-300" size={32} />
 </div>
 <h2 className="text-xl font-bold text-slate-900 dark:text-white">Check your email</h2>
 <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
 We sent a magic link to your email.
 <br />
 Click the link to sign in instantly.
 </p>
 <button
 type="button"
 onClick={() => setMagicLinkSent(false)}
 className="text-sm text-amber-700 hover:text-amber-800 hover:underline font-semibold mt-4 dark:text-amber-300 dark:hover:text-amber-200"
 >
 Try again with a different email
 </button>
 </div>
 )}

 <p className="text-center text-sm text-slate-600 dark:text-slate-300 mt-8">
 Do not have an account?{" "}
 <Link href="/auth/signup" className="font-bold text-amber-700 hover:text-amber-800 hover:underline dark:text-amber-300 dark:hover:text-amber-200">
 Sign up
 </Link>
 </p>
 </div>

 {/* Full-screen loading overlay — rendered via portal to document.body */}
 {showTransition && <LoginSuccessOverlay name={transitionName} redirectTo={transitionRedirectTo} />}
 </>
 );
}
