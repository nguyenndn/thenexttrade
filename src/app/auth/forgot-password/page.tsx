"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Mail, Loader2 } from "lucide-react";
import { forgotPassword } from "../actions";
import { TurnstileWidget } from "@/components/ui/TurnstileWidget";

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [turnstileToken, setTurnstileToken] = useState("");
    const [turnstileResetKey, setTurnstileResetKey] = useState(0);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);
        setError(null);

        const formData = new FormData(e.currentTarget);
        formData.set("cf-turnstile-response", turnstileToken);
        const result = await forgotPassword(formData);

        if (result?.error) {
            setError(result.error);
            setTurnstileResetKey((k) => k + 1);
        } else {
            setMessage(
                result?.message ||
                    "Check your email for the password reset link."
            );
        }
        setIsLoading(false);
    };

    return (
        <div className="w-full max-w-[440px] sm:max-w-[480px] mx-auto bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-6 sm:p-8 shadow-sm transition-colors duration-300">
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white mb-2">
                    Reset Password
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                    Enter your email address and we&apos;ll send you a link to reset
                    your password.
                </p>
            </div>

            {message ? (
                <div className="bg-gold/10 border border-gold/20 rounded-lg p-6 text-center">
                    <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Mail className="text-amber-600 dark:text-gold" size={24} />
                    </div>
                    <h3 className="text-amber-600 dark:text-gold font-bold mb-2">
                        Check your email
                    </h3>
                    <p className="text-slate-700 dark:text-slate-300 text-sm">
                        {message}
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="reset-email"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                            Email Address
                        </label>
                        <div className="relative">
                            <input
                                id="reset-email"
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                className="w-full bg-gray-50/80 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 pl-11 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#151925] focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all"
                            />
                            <Mail
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600 dark:text-gold"
                                size={20}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <TurnstileWidget
                        resetKey={turnstileResetKey}
                        onVerify={setTurnstileToken}
                        className="flex justify-center"
                    />

                    <Button
                        type="submit"
                        disabled={isLoading}
                        variant="gold"
                        className="w-full font-bold h-12 rounded-lg bg-gold hover:bg-amber-600 !text-white transition-all shadow-md shadow-amber-500/20 flex items-center justify-center"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            "Send Reset Link"
                        )}
                    </Button>
                </form>
            )}
        </div>
    );
}
