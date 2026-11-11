"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Suspense, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { login, signInWithMagicLink } from "@/app/auth/actions";
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    CheckCircle,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { TurnstileWidget } from "@/components/ui/TurnstileWidget";
import { trackEvent } from "@/lib/track";

// ─── Full-screen loading overlay rendered via portal ───
function LoginSuccessOverlay({
    name,
    redirectTo,
}: {
    name: string;
    redirectTo?: string;
}) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Start progress bar animation
        const t1 = setTimeout(() => setProgress(100), 100);

        // Build dashboard URL with accountId (dates default to Start of Month -> Today)
        const t2 = setTimeout(() => {
            const match = document.cookie.match(
                /(?:^|;\s*)last_account_id=([^;]+)/
            );
            const accountId = match?.[1];
            const url =
                redirectTo && redirectTo !== "/dashboard"
                    ? redirectTo
                    : accountId
                      ? `/dashboard?accountId=${accountId}`
                      : "/dashboard";
            window.location.href = url;
        }, 2400);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [redirectTo]);

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none bg-white dark:bg-[#0B0E14] transition-colors"
            style={{ margin: 0 }}
        >
            {/* Warm gold radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.10)_0%,rgba(245,158,11,0.03)_40%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08)_0%,rgba(245,158,11,0.02)_40%,transparent_70%)] pointer-events-none" />
            {/* Secondary glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(245,158,11,0.05)_0%,transparent_50%)] dark:bg-[radial-gradient(ellipse_at_30%_20%,rgba(247,201,72,0.04)_0%,transparent_50%)] pointer-events-none" />

            <div className="flex flex-col items-center space-y-8 max-w-md px-6 text-center z-10 animate-in fade-in duration-500">
                {/* Logo with glow */}
                <div className="relative mb-2">
                    <div className="absolute inset-0 scale-[2.5] rounded-full bg-gradient-to-r from-amber-400/20 via-amber-500/15 to-amber-400/20 dark:from-amber-500/20 dark:via-amber-400/10 dark:to-amber-500/20 blur-3xl" />
                    <div className="relative scale-[1.6]">
                        <Logo />
                    </div>
                </div>

                {/* Welcome text — more prominent */}
                <div className="space-y-3 animate-in slide-in-from-bottom-3 duration-700 delay-200 fill-mode-both">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        Welcome back,{" "}
                        <span className="text-amber-600 dark:text-gold">{name}</span>
                    </h2>
                    <p className="text-sm sm:text-base text-slate-500 dark:text-gray-400 font-medium">
                        {redirectTo === "/onboarding"
                            ? "Preparing your setup..."
                            : "Preparing your dashboard..."}
                    </p>
                </div>

                {/* Glowing progress bar */}
                <div className="w-full max-w-xs sm:w-64 animate-in fade-in duration-500 delay-400 fill-mode-both">
                    <div className="h-1.5 bg-gray-200 dark:bg-white/[0.08] rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gold shadow-[0_0_16px_rgba(245,158,11,0.45),0_0_4px_rgba(245,158,11,0.7)] transition-all duration-2200 ease-login"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

function LoginPageContent() {
    const searchParams = useSearchParams();
    const rawNext =
        searchParams.get("next") ||
        searchParams.get("returnUrl") ||
        searchParams.get("redirect");
    const nextPath =
        rawNext &&
        /^\/(?!\/)/.test(rawNext) &&
        !rawNext.includes("\\") &&
        !rawNext.startsWith("/auth/")
            ? rawNext
            : null;

    const [loading, setLoading] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [mode, setMode] = useState<"password" | "magic">("password");
    const [magicLinkSent, setMagicLinkSent] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState("");
    const [turnstileResetKey, setTurnstileResetKey] = useState(0);
    const [showTransition, setShowTransition] = useState(false);
    const [transitionName, setTransitionName] = useState("Trader");
    const [transitionRedirectTo, setTransitionRedirectTo] = useState<
        string | undefined
    >();
    const [rememberMe, setRememberMe] = useState(true);

    const inputClassName =
        "h-12 rounded-lg bg-gray-50/80 dark:bg-[#151925] border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white text-sm sm:text-base py-3 focus:bg-white dark:focus:bg-[#151925] focus:border-gold focus:ring-gold/20 transition-colors";

    const primaryButtonClassName =
        "w-full h-12 sm:h-14 rounded-lg border-none bg-gold hover:bg-amber-600 text-sm sm:text-base font-black !text-white shadow-md shadow-amber-500/20 active:scale-[0.99] transition-all";

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        formData.set("cf-turnstile-response", turnstileToken);
        if (nextPath) {
            formData.set("next", nextPath);
        }
        trackEvent("login_submitted", { method: "password" });
        const result = await login(formData);

        if (result?.error) {
            trackEvent("login_failed", { method: "password" });
            setError(result.error);
            setTurnstileResetKey((k) => k + 1);
            setLoading(false);
        } else if (result?.requires2FA) {
            trackEvent("login_requires_2fa", { method: "password" });
            window.location.href = nextPath
                ? `/auth/verify-2fa?next=${encodeURIComponent(nextPath)}`
                : "/auth/verify-2fa";
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
        if (nextPath) {
            formData.set("next", nextPath);
        }
        trackEvent("login_submitted", { method: "magic_link" });
        const result = await signInWithMagicLink(formData);

        if (result?.error) {
            trackEvent("login_failed", { method: "magic_link" });
            setError(result.error);
            setTurnstileResetKey((k) => k + 1);
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
        setTurnstileResetKey((k) => k + 1);
    };

    return (
        <>
            <div className="w-full max-w-[440px] sm:max-w-[480px] mx-auto rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-5 sm:p-7 md:p-8 shadow-sm transition-colors duration-300">
                <div className="flex justify-center mb-4 sm:mb-5">
                    <Logo />
                </div>
                <div className="text-center mb-6 sm:mb-8">
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                        Welcome back
                    </p>
                    <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">
                        Login to your account
                    </h1>
                </div>

                <div className="flex rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] p-1 mb-5 sm:mb-6">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => switchMode("password")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all min-h-[44px] h-auto border-0 ${
                            mode === "password"
                                ? "bg-gold !text-white shadow-sm hover:bg-amber-600 hover:!text-white"
                                : "text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                        }`}
                    >
                        <Lock size={16} />
                        Password
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => switchMode("magic")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all min-h-[44px] h-auto border-0 ${
                            mode === "magic"
                                ? "bg-gold !text-white shadow-sm hover:bg-amber-600 hover:!text-white"
                                : "text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                        }`}
                    >
                        <Mail size={16} />
                        Magic Link
                    </Button>
                </div>

                {error && (
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center mb-5 sm:mb-6">
                        {error}
                    </div>
                )}

                {mode === "password" && (
                    <form
                        method="post"
                        onSubmit={handleSubmit}
                        className="space-y-4 sm:space-y-5"
                    >
                        <Input
                            name="email"
                            type="email"
                            autoComplete="email"
                            label="Email"
                            required
                            startIcon={
                                <Mail
                                    size={20}
                                    className="text-amber-600 dark:text-gold"
                                />
                            }
                            className={inputClassName}
                        />

                        <Input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            label="Password"
                            required
                            startIcon={
                                <Lock
                                    size={20}
                                    className="text-amber-600 dark:text-gold"
                                />
                            }
                            endIcon={
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    tabIndex={-1}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onTouchStart={(e) => e.preventDefault()}
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} />
                                    ) : (
                                        <Eye size={20} />
                                    )}
                                </Button>
                            }
                            className={inputClassName}
                        />

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                            <label
                                htmlFor="remember"
                                className="inline-flex items-center gap-2.5 cursor-pointer select-none"
                            >
                                <input
                                    type="checkbox"
                                    id="remember"
                                    name="remember"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="relative h-5 w-9 rounded-full bg-gray-200 dark:bg-white/15 peer-checked:bg-gold transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-md after:transition-transform after:duration-200 peer-checked:after:translate-x-4 shrink-0" />
                                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                    Stay signed in
                                </span>
                            </label>
                            <Link
                                href="/auth/forgot-password"
                                className="text-xs sm:text-sm text-amber-600 hover:text-amber-700 hover:underline font-semibold dark:text-gold dark:hover:text-amber-300 py-1 inline-block"
                            >
                                Forgot your password?
                            </Link>
                        </div>

                        <TurnstileWidget
                            resetKey={turnstileResetKey}
                            onVerify={setTurnstileToken}
                            className="flex justify-center overflow-hidden max-w-full"
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            className={primaryButtonClassName}
                            isLoading={loading}
                            disabled={!isHydrated}
                        >
                            Login
                        </Button>
                    </form>
                )}

                {mode === "magic" && !magicLinkSent && (
                    <form
                        method="post"
                        onSubmit={handleMagicLink}
                        className="space-y-4 sm:space-y-5"
                    >
                        <div className="text-center mb-2">
                            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                Enter your email and we will send you a magic
                                link to sign in instantly, no password needed.
                            </p>
                        </div>

                        <Input
                            name="email"
                            type="email"
                            autoComplete="email"
                            label="Email"
                            required
                            startIcon={
                                <Mail
                                    size={20}
                                    className="text-amber-600 dark:text-gold"
                                />
                            }
                            className={inputClassName}
                        />

                        <TurnstileWidget
                            resetKey={turnstileResetKey}
                            onVerify={setTurnstileToken}
                            className="flex justify-center overflow-hidden max-w-full"
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            className={`${primaryButtonClassName} flex items-center justify-center gap-2`}
                            isLoading={loading}
                            disabled={!isHydrated}
                        >
                            <Mail size={18} />
                            Send Magic Link
                        </Button>
                    </form>
                )}

                {mode === "magic" && magicLinkSent && (
                    <div className="text-center py-6 sm:py-8 space-y-3 sm:space-y-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gold/10 rounded-lg flex items-center justify-center mx-auto border border-gold/25">
                            <CheckCircle
                                className="text-amber-600 dark:text-gold"
                                size={30}
                            />
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                            Check your email
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            We sent a magic link to your email.
                            <br />
                            Click the link to sign in instantly.
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setMagicLinkSent(false)}
                            className="text-xs sm:text-sm text-amber-600 hover:text-amber-700 font-semibold mt-3 sm:mt-4 py-2 px-4 inline-flex items-center justify-center rounded-lg border-gray-200 dark:border-white/10 hover:bg-amber-500/10 min-h-[44px] dark:text-gold transition-colors h-auto"
                        >
                            Try again with a different email
                        </Button>
                    </div>
                )}

                <p className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-6 sm:mt-8">
                    Do not have an account?{" "}
                    <Link
                        href={
                            nextPath
                                ? `/auth/signup?next=${encodeURIComponent(nextPath)}`
                                : "/auth/signup"
                        }
                        className="font-bold text-amber-600 hover:text-amber-700 hover:underline dark:text-gold dark:hover:text-amber-300 py-1 inline-block"
                    >
                        Sign up
                    </Link>
                </p>
            </div>

            {/* Full-screen loading overlay — rendered via portal to document.body */}
            {showTransition && (
                <LoginSuccessOverlay
                    name={transitionName}
                    redirectTo={transitionRedirectTo}
                />
            )}
        </>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginPageContent />
        </Suspense>
    );
}
