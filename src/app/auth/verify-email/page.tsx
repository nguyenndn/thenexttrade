"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Mail, ArrowRight, RefreshCcw, ShieldCheck } from "lucide-react";
import { verifyOtpAction, resendOtpAction } from "@/app/auth/actions";
import Link from "next/link";

function VerifyEmailForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || "";

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [timer, setTimer] = useState(60);

    // Redirect to login if accessed directly without email
    useEffect(() => {
        if (!email) {
            router.push('/auth/login');
        }
    }, [email, router]);

    // Resend Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        
        if (otp.length !== 8) {
            setError("Please enter a valid 8-digit code.");
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append("email", email);
        formData.append("otp", otp);

        const result = await verifyOtpAction(formData);

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
        // If successful, verifyOtpAction redirects to /onboarding
    };

    const handleResend = async () => {
        if (timer > 0) return;
        
        setResendLoading(true);
        setError(null);
        setSuccessMessage(null);

        const formData = new FormData();
        formData.append("email", email);

        const result = await resendOtpAction(formData);

        if (result?.error) {
            setError(result.error);
        } else if (result?.success) {
            setSuccessMessage(result.message || "Code resent successfully.");
            setTimer(60); // Reset timer
        }

        setResendLoading(false);
    };

    if (!email) return null; // Prevent rendering if redirecting

    return (
        <div className="w-full max-w-[480px] mx-auto bg-white dark:bg-[#1E2028] p-8 rounded-xl border border-gray-200 dark:border-white/10 shadow-xl transition-colors duration-300">
            <div className="flex justify-center mb-6">
                <Logo />
            </div>
            
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                    <Mail className="text-primary" size={28} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Check your email</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                    We've sent an 8-digit verification code to <br/>
                    <span className="font-bold text-gray-900 dark:text-white">{email}</span>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center font-medium">
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-primary/10 border border-green-200 dark:border-primary/20 text-green-700 dark:text-primary text-sm text-center font-medium">
                        {successMessage}
                    </div>
                )}

                <div>
                    <input
                        type="text"
                        maxLength={8}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} // Only allow numbers
                        placeholder="••••••••"
                        className="w-full text-center tracking-[1em] font-mono text-3xl h-16 bg-gray-50 dark:bg-[#0B0E14] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-[#0B0E14] focus:border-primary focus:ring-1 focus:ring-primary rounded-xl transition-all"
                        required
                        autoComplete="one-time-code"
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full h-14 bg-[#0B0E14] text-white hover:bg-[#1E2028] dark:bg-primary dark:text-white dark:hover:bg-[#00b078] font-bold text-base border-none rounded-xl shadow-md transition-all shadow-black/5 flex items-center justify-center gap-2"
                    isLoading={loading}
                    disabled={otp.length !== 8 || loading}
                >
                    Verify Account <ShieldCheck size={20} />
                </Button>
            </form>

            <div className="mt-8 text-center space-y-4">
                <div className="flex items-center justify-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 mr-2">Didn't receive the code?</span>
                    <Button
                        type="button"
                        variant="link"
                        onClick={handleResend}
                        disabled={timer > 0 || resendLoading}
                        className={`font-bold flex items-center gap-1 transition-colors p-0 h-auto ${
                            timer > 0 
                                ? 'text-gray-400 cursor-not-allowed hover:no-underline' 
                                : 'text-primary hover:text-[#00b078] hover:no-underline'
                        }`}
                    >
                        {resendLoading ? (
                            <RefreshCcw size={14} className="animate-spin" />
                        ) : null}
                        {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                    </Button>
                </div>
                
                <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                    <Link href="/auth/signup" className="text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center justify-center gap-1 transition-colors">
                        Use a different email <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
            <VerifyEmailForm />
        </Suspense>
    );
}
