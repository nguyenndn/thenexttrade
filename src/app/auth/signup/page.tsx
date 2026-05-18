"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CountrySelect } from "@/components/ui/CountrySelect";
import { useEffect, useState } from "react";
import { signup } from "@/app/auth/actions";
import { Check, Eye, EyeOff, Lock, Mail, Sparkles, User } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { TurnstileWidget } from "@/components/ui/TurnstileWidget";

type SignupStep = 1 | 2 | 3;

const steps: Array<{ id: SignupStep; label: string }> = [
    { id: 1, label: "Identity" },
    { id: 2, label: "Verify" },
    { id: 3, label: "Secure" },
];

export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState<SignupStep>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [country, setCountry] = useState("");
    const [notify, setNotify] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [turnstileToken, setTurnstileToken] = useState("");

    const inputClassName =
        "h-12 bg-white/80 border-amber-900/10 text-slate-900 text-base py-3 placeholder:text-slate-400 focus:bg-white focus:border-amber-400 focus:ring-amber-300/30 dark:bg-black/20 dark:border-white/10 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-black/25 dark:focus:border-amber-300/60 dark:focus:ring-amber-300/20 transition-colors";

    const primaryButtonClassName =
        "w-full h-14 rounded-xl border-none bg-[linear-gradient(135deg,#F8D46B_0%,#D99A26_45%,#8A5A13_100%)] text-base font-black text-slate-950 shadow-[0_18px_36px_rgba(217,154,38,0.32)] hover:shadow-[0_20px_44px_rgba(217,154,38,0.42)]";

    const secondaryButtonClassName =
        "h-12 rounded-xl border-amber-900/10 bg-white/70 text-slate-700 hover:border-amber-400/50 hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:border-amber-300/40";

    const checkboxClassName =
        "appearance-none h-5 w-5 rounded border border-amber-900/20 bg-white checked:bg-amber-500 checked:border-amber-500 dark:bg-black/20 dark:border-white/20 dark:checked:bg-amber-400 dark:checked:border-amber-400 checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%2220%206%209%2017%204%2012%22%2F%3E%3C%2Fsvg%3E')] bg-[length:70%] bg-center bg-no-repeat transition-all cursor-pointer shrink-0";

    useEffect(() => {
        let cancelled = false;

        fetch("/api/geo/country")
            .then((res) => (res.ok ? res.json() : null))
            .then((data: { country?: string } | null) => {
                const detectedCountry = data?.country?.toUpperCase();
                if (!cancelled && detectedCountry && !country) {
                    setCountry((currentCountry) => currentCountry || detectedCountry);
                }
            })
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, [country]);

    const validateCurrentStep = () => {
        setError(null);

        if (step === 1) {
            if (fullName.trim().length < 2) {
                setError("Please enter your full name.");
                return false;
            }
            if (!country) {
                setError("Please select your country.");
                return false;
            }
        }

        if (step === 2) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                setError("Please enter a valid email address.");
                return false;
            }
        }

        if (step === 3) {
            if (password.length < 10) {
                setError("Password must be at least 10 characters.");
                return false;
            }
            if (password !== confirm) {
                setError("Passwords do not match.");
                return false;
            }
            if (!termsAccepted) {
                setError("You must accept the terms and conditions.");
                return false;
            }
        }

        return true;
    };

    const goNext = () => {
        if (!validateCurrentStep()) return;
        setStep((current) => Math.min(current + 1, 3) as SignupStep);
    };

    const goBack = () => {
        setError(null);
        setStep((current) => Math.max(current - 1, 1) as SignupStep);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateCurrentStep()) return;

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.set("fullName", fullName);
        formData.set("email", email);
        formData.set("country", country);
        formData.set("password", password);
        formData.set("confirm", confirm);
        formData.set("termsAccepted", termsAccepted ? "on" : "");
        formData.set("notify", notify ? "on" : "");
        formData.set("cf-turnstile-response", turnstileToken);

        const result = await signup(formData);

        if (result?.error) {
            setError(result.error);
        } else if (result?.requiresVerification) {
            router.push(`/auth/verify-email?email=${encodeURIComponent(result.email)}`);
            return;
        } else if (result?.success) {
            router.push("/dashboard");
            return;
        }

        setLoading(false);
    };

    return (
        <div className="w-full max-w-[480px] mx-auto rounded-lg border border-amber-900/10 bg-white/85 p-8 shadow-[0_28px_90px_rgba(88,64,27,0.18)] backdrop-blur-xl transition-colors duration-300 dark:border-amber-300/15 dark:bg-[#11100C]/90 dark:shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
            <div className="flex justify-center mb-6">
                <Logo />
            </div>
            <div className="text-center mb-6">
                <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-extrabold uppercase text-amber-700 dark:text-amber-300">
                    <Sparkles size={14} />
                    Start with your edge
                </div>
                <h1 className="text-3xl font-black text-slate-950 dark:text-white">Create your account</h1>
                <p className="mt-2 text-base font-medium text-slate-600 dark:text-slate-300">Set up your premium trading workspace in minutes.</p>
            </div>

            <div className="mb-7 flex items-center justify-center gap-3">
                {steps.map((item, index) => {
                    const isActive = item.id === step;
                    const isDone = item.id < step;

                    return (
                        <div key={item.id} className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-black transition-colors ${
                                        isActive
                                            ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                            : isDone
                                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                                                : "border-slate-200 bg-white/70 text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400"
                                    }`}
                                >
                                    {isDone ? <Check size={16} /> : item.id}
                                </div>
                                <span className={`text-sm font-bold ${isActive ? "text-slate-950 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>
                                    {item.label}
                                </span>
                            </div>
                            {index < steps.length - 1 && <div className="h-px w-8 bg-amber-900/15 dark:bg-white/15" />}
                        </div>
                    );
                })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <>
                        <Input
                            name="fullName"
                            type="text"
                            placeholder="Full Name"
                            label="Full Name"
                            required
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            startIcon={<User size={20} className="text-amber-600/80 dark:text-amber-300/80" />}
                            className={inputClassName}
                        />

                        <div className="w-full">
                            <label className="label pb-1">
                                <span className="label-text font-medium text-slate-700 dark:text-slate-300 text-sm">Country</span>
                            </label>
                            <CountrySelect
                                value={country}
                                onChange={setCountry}
                                className="bg-white/80 border-amber-900/10 text-slate-900 hover:bg-white hover:border-amber-400 focus:border-amber-400 focus:ring-amber-300/30 dark:bg-black/20 dark:border-white/10 dark:text-white dark:hover:bg-black/25 dark:focus:border-amber-300/60 dark:focus:ring-amber-300/20"
                            />
                        </div>

                        <Button type="button" variant="primary" className={primaryButtonClassName} onClick={goNext}>
                            Continue
                        </Button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <Input
                            name="email"
                            type="email"
                            placeholder="Email Address"
                            label="Email Address"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            startIcon={<Mail size={20} className="text-amber-600/80 dark:text-amber-300/80" />}
                            className={inputClassName}
                        />

                        <div className="flex items-start gap-2 rounded-lg border border-amber-900/10 bg-[#FBF6EA] p-4 dark:border-white/10 dark:bg-white/[0.04]">
                            <input
                                type="checkbox"
                                className={checkboxClassName}
                                id="notify"
                                name="notify"
                                checked={notify}
                                onChange={(event) => setNotify(event.target.checked)}
                            />
                            <label htmlFor="notify" className="text-sm leading-6 text-slate-600 dark:text-slate-400 cursor-pointer">
                                Notify me about updates & perks (No spam)
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button type="button" variant="outline" className={secondaryButtonClassName} onClick={goBack}>
                                Back
                            </Button>
                            <Button type="button" variant="primary" className={primaryButtonClassName} onClick={goNext}>
                                Continue
                            </Button>
                        </div>
                    </>
                )}

                {step === 3 && (
                    <>
                        <Input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            label="Password"
                            required
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
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

                        <Input
                            name="confirm"
                            type={showConfirm ? "text" : "password"}
                            placeholder="Confirm Password"
                            label="Confirm Password"
                            required
                            value={confirm}
                            onChange={(event) => setConfirm(event.target.value)}
                            startIcon={<Lock size={20} className="text-amber-600/80 dark:text-amber-300/80" />}
                            endIcon={
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                                    aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                                >
                                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                                </Button>
                            }
                            className={inputClassName}
                        />

                        <div className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                className={checkboxClassName}
                                id="terms"
                                name="termsAccepted"
                                required
                                checked={termsAccepted}
                                onChange={(event) => setTermsAccepted(event.target.checked)}
                            />
                            <label htmlFor="terms" className="text-sm leading-6 text-slate-600 dark:text-slate-400 cursor-pointer">
                                I accept the{" "}
                                <Link href="/legal/terms-of-service" className="font-semibold text-amber-700 hover:text-amber-800 hover:underline dark:text-amber-300 dark:hover:text-amber-200">
                                    Terms & Conditions
                                </Link>{" "}
                                and{" "}
                                <Link href="/legal/privacy-policy" className="font-semibold text-amber-700 hover:text-amber-800 hover:underline dark:text-amber-300 dark:hover:text-amber-200">
                                    Privacy Policy
                                </Link>
                                .
                            </label>
                        </div>

                        <TurnstileWidget onVerify={setTurnstileToken} className="flex justify-center" />

                        <div className="grid grid-cols-2 gap-3">
                            <Button type="button" variant="outline" className={secondaryButtonClassName} onClick={goBack}>
                                Back
                            </Button>
                            <Button type="submit" variant="primary" className={primaryButtonClassName} isLoading={loading}>
                                Create Account
                            </Button>
                        </div>
                    </>
                )}
            </form>

            <div className="mt-8 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="font-bold text-amber-700 hover:text-amber-800 hover:underline dark:text-amber-300 dark:hover:text-amber-200">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}
