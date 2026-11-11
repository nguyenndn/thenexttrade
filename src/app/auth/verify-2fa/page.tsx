"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyLogin2FA } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";
import { Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

function Verify2FAContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [signingOut, setSigningOut] = useState(false);

    const next = searchParams.get("next") || "/dashboard";

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length < 6) return;

        setLoading(true);
        const res = await verifyLogin2FA(code, next);

        if (res?.error) {
            toast.error(res.error);
            setLoading(false);
        }
        // Success will redirect automatically by server action
    };

    const handleBackToLogin = async () => {
        setSigningOut(true);
        try {
            const supabase = createClient();
            await supabase.auth.signOut();
        } catch {
            // Proceed to login even if sign-out encounters a transient error
        } finally {
            router.replace("/auth/login");
        }
    };

    return (
        <div className="w-full max-w-[440px] sm:max-w-[480px] mx-auto p-6 sm:p-8 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] shadow-sm relative z-10 transition-colors duration-300">
            <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-lg bg-gold/10 flex items-center justify-center mx-auto mb-6 border border-gold/20">
                    <Shield size={32} className="text-amber-600 dark:text-gold" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white mb-2">
                    Two-Factor Authentication
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm tabular-nums">
                    Enter the 6-digit code from your authenticator app to
                    continue.
                </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
                <div>
                    <label
                        htmlFor="two-factor-code"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center mb-2 tabular-nums"
                    >
                        6-Digit Authenticator Code
                    </label>
                    <input
                        id="two-factor-code"
                        type="text"
                        value={code}
                        onChange={(e) =>
                            setCode(e.target.value.replace(/\D/g, ""))
                        }
                        maxLength={6}
                        autoFocus
                        autoComplete="one-time-code"
                        className="w-full h-16 text-center text-3xl font-bold font-mono tabular-nums tracking-[0.5em] bg-gray-50/80 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-lg focus:bg-white dark:focus:bg-[#151925] focus:border-gold focus:ring-1 focus:ring-gold/30 text-slate-900 dark:text-white transition-all outline-none"
                    />
                </div>

                <Button
                    type="submit"
                    disabled={loading || signingOut || code.length < 6}
                    variant="primary"
                    className="w-full h-12 bg-gold hover:bg-amber-600 !text-white font-bold text-base rounded-lg transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <Loader2 size={24} className="animate-spin" />
                    ) : (
                        "Verify Identity"
                    )}
                </Button>
            </form>

            <Button
                type="button"
                variant="outline"
                disabled={loading || signingOut}
                onClick={handleBackToLogin}
                className="w-full text-center mt-6 text-sm font-bold border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg"
            >
                {signingOut ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    "Back to Login"
                )}
            </Button>
        </div>
    );
}

export default function Verify2FAPage() {
    return (
        <Suspense fallback={null}>
            <Verify2FAContent />
        </Suspense>
    );
}
