"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CountrySelect } from "@/components/ui/CountrySelect";
import { useState } from "react";
import { signup } from "@/app/auth/actions";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [country, setCountry] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const pass = formData.get("password") as string;
        const confirm = formData.get("confirm") as string;

        if (pass !== confirm) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        // Pass country manually if needed or ensure it's in formData
        formData.append("country", country);

        const result = await signup(formData);

        if (result?.error) {
            setError(result.error);
        } else if (result?.requiresVerification) {
            router.push(`/auth/verify-email?email=${encodeURIComponent(result.email)}`);
            return; // keep loading true during redirect
        } else if (result?.success) {
            router.push('/dashboard');
            return;
        }
        setLoading(false);
    };

    return (
        <div className="w-full max-w-[480px] mx-auto bg-white dark:bg-[#1E2028] p-8 rounded-xl border border-gray-200 dark:border-white/10 shadow-xl transition-colors duration-300">
            <div className="flex justify-center mb-6">
                <Logo />
            </div>
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-gray-700 dark:text-white">Sign up</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-base">The process is simple and fast</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-500 text-sm text-center">
                        {error}
                    </div>
                )}

                <Input
                    name="fullName"
                    type="text"
                    placeholder="Full Name"
                    label="Full Name"
                    required
                    startIcon={<User size={20} className="text-gray-500" />}
                    className="bg-gray-50 dark:bg-[#0B0E14] border-gray-200 dark:border-white/10 text-gray-700 dark:text-white text-base py-3 placeholder:text-gray-500 dark:placeholder:text-gray-600 focus:bg-white dark:focus:bg-[#0B0E14] focus:border-[#2F80ED]/50 dark:focus:border-[#2F80ED]/50 focus:text-gray-700 dark:focus:text-white h-12 transition-colors"
                />

                <Input
                    name="email"
                    type="email"
                    placeholder="Email Address"
                    label="Email Address"
                    required
                    startIcon={<Mail size={20} className="text-gray-500" />}
                    className="bg-gray-50 dark:bg-[#0B0E14] border-gray-200 dark:border-white/10 text-gray-700 dark:text-white text-base py-3 placeholder:text-gray-500 dark:placeholder:text-gray-600 focus:bg-white dark:focus:bg-[#0B0E14] focus:border-[#2F80ED]/50 dark:focus:border-[#2F80ED]/50 focus:text-gray-700 dark:focus:text-white h-12 transition-colors"
                />

                <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    label="Password"
                    required
                    startIcon={<Lock size={20} className="text-gray-500" />}
                    endIcon={
                        <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-gray-600 dark:text-gray-600 dark:hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </Button>
                    }
                    className="bg-gray-50 dark:bg-[#0B0E14] border-gray-200 dark:border-white/10 text-gray-700 dark:text-white text-base py-3 placeholder:text-gray-500 dark:placeholder:text-gray-600 focus:bg-white dark:focus:bg-[#0B0E14] focus:border-[#2F80ED]/50 dark:focus:border-[#2F80ED]/50 focus:text-gray-700 dark:focus:text-white h-12 transition-colors"
                />

                <Input
                    name="confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm Password"
                    label="Confirm Password"
                    required
                    startIcon={<Lock size={20} className="text-gray-500" />}
                    endIcon={
                        <Button type="button" variant="ghost" size="icon" onClick={() => setShowConfirm(!showConfirm)} className="text-gray-500 hover:text-gray-600 dark:text-gray-600 dark:hover:text-white" aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}>
                            {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                        </Button>
                    }
                    className="bg-gray-50 dark:bg-[#0B0E14] border-gray-200 dark:border-white/10 text-gray-700 dark:text-white text-base py-3 placeholder:text-gray-500 dark:placeholder:text-gray-600 focus:bg-white dark:focus:bg-[#0B0E14] focus:border-[#2F80ED]/50 dark:focus:border-[#2F80ED]/50 focus:text-gray-700 dark:focus:text-white h-12 transition-colors"
                />

                {/* Country Dropdown */}
                <div className="w-full">
                    <label className="label pb-1">
                        <span className="label-text font-medium text-gray-600 dark:text-gray-300 text-sm">Country</span>
                    </label>
                    <CountrySelect
                        value={country}
                        onChange={setCountry}
                    />
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            className="appearance-none h-5 w-5 rounded bg-white dark:bg-[#0B0E14] border border-gray-300 dark:border-white/20 checked:bg-primary dark:checked:bg-primary checked:border-transparent dark:checked:border-transparent checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%2220%206%209%2017%204%2012%22%2F%3E%3C%2Fsvg%3E')] bg-[length:70%] bg-center bg-no-repeat transition-all cursor-pointer"
                            id="notify"
                            name="notify"
                        />
                        <label htmlFor="notify" className="text-sm text-gray-600 dark:text-gray-500 cursor-pointer">
                            Notify me about updates & perks (No spam)
                        </label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            className="appearance-none h-5 w-5 rounded bg-white dark:bg-[#0B0E14] border border-gray-300 dark:border-white/20 checked:bg-primary dark:checked:bg-primary checked:border-transparent dark:checked:border-transparent checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%2220%206%209%2017%204%2012%22%2F%3E%3C%2Fsvg%3E')] bg-[length:70%] bg-center bg-no-repeat transition-all cursor-pointer"
                            id="terms"
                            required
                        />
                        <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-500 cursor-pointer">
                            I accept the <Link href="/legal/terms-of-service" className="text-[#2F80ED] hover:underline">Terms & Conditions</Link> and <Link href="/legal/privacy-policy" className="text-[#2F80ED] hover:underline">Privacy Policy</Link>.
                        </label>
                    </div>
                </div>

                <div className="space-y-4">
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full h-14 font-bold text-base hover:opacity-90 border-none rounded-xl"
                        isLoading={loading}
                    >
                        Create My Account
                    </Button>
                </div>
            </form>

            <div className="mt-8 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="font-semibold text-[#2F80ED] hover:underline">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}
