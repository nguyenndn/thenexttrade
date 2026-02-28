"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CountrySelect } from "@/components/ui/CountrySelect";
import { useState } from "react";
import { signup } from "@/app/auth/actions";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";

export default function SignupPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [country, setCountry] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

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
        } else if (result?.message) {
            setMessage(result.message);
        }
        setLoading(false);
    };

    if (message) {
        return (
            <div className="w-full max-w-[480px] mx-auto bg-[#ffffff0d] p-8 rounded-xl border border-white/10 shadow-2xl backdrop-blur-sm text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail className="text-primary" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
                <p className="text-gray-400 mb-6">{message}</p>
                <Link href="/auth/login">
                    <Button className="w-full h-12 bg-primary hover:bg-[#00b078] text-black font-bold">
                        Back to Login
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="w-full max-w-[480px] mx-auto bg-[#ffffff0d] p-8 rounded-xl border border-white/10 shadow-2xl backdrop-blur-sm">
            <div className="text-left mb-6">
                <h1 className="text-3xl font-bold text-[#2F80ED]">Sign up</h1>
                <p className="text-gray-400 mt-2 text-base">The process is simple and fast</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        name="firstName"
                        type="text"
                        placeholder="First Name"
                        label="First Name"
                        required
                        startIcon={<User size={20} className="text-gray-400" />}
                        className="bg-[#0B0E14] border-white/10 text-white text-base py-3 placeholder:text-gray-600 focus:bg-[#0B0E14] focus:border-[#2F80ED]/50 focus:text-white h-12"
                    />
                    <Input
                        name="lastName"
                        type="text"
                        placeholder="Last Name"
                        label="Last Name"
                        required
                        startIcon={<User size={20} className="text-gray-400" />}
                        className="bg-[#0B0E14] border-white/10 text-white text-base py-3 placeholder:text-gray-600 focus:bg-[#0B0E14] focus:border-[#2F80ED]/50 focus:text-white h-12"
                    />
                </div>

                <Input
                    name="email"
                    type="email"
                    placeholder="Email Address"
                    label="Email Address"
                    required
                    startIcon={<Mail size={20} className="text-gray-400" />}
                    className="bg-[#0B0E14] border-white/10 text-white text-base py-3 placeholder:text-gray-600 focus:bg-[#0B0E14] focus:border-[#2F80ED]/50 focus:text-white h-12"
                />

                <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    label="Password"
                    required
                    startIcon={<Lock size={20} className="text-gray-400" />}
                    endIcon={
                        <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </Button>
                    }
                    className="bg-[#0B0E14] border-white/10 text-white text-base py-3 placeholder:text-gray-600 focus:bg-[#0B0E14] focus:border-[#2F80ED]/50 focus:text-white h-12"
                />

                <Input
                    name="confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm Password"
                    label="Confirm Password"
                    required
                    startIcon={<Lock size={20} className="text-gray-400" />}
                    endIcon={
                        <Button type="button" variant="ghost" size="icon" onClick={() => setShowConfirm(!showConfirm)} className="text-gray-500 hover:text-white" aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}>
                            {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                        </Button>
                    }
                    className="bg-[#0B0E14] border-white/10 text-white text-base py-3 placeholder:text-gray-600 focus:bg-[#0B0E14] focus:border-[#2F80ED]/50 focus:text-white h-12"
                />

                {/* Country Dropdown */}
                <div className="w-full">
                    <label className="label pb-1">
                        <span className="label-text font-medium text-gray-400 text-sm">Country</span>
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
                            className="appearance-none h-5 w-5 rounded bg-[#0B0E14] border border-white/20 checked:bg-primary checked:border-transparent checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%2220%206%209%2017%204%2012%22%2F%3E%3C%2Fsvg%3E')] bg-[length:70%] bg-center bg-no-repeat transition-all cursor-pointer"
                            id="notify"
                            name="notify"
                        />
                        <label htmlFor="notify" className="text-sm text-gray-400 cursor-pointer">
                            Notify me about updates & perks (No spam)
                        </label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            className="appearance-none h-5 w-5 rounded bg-[#0B0E14] border border-white/20 checked:bg-primary checked:border-transparent checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%2220%206%209%2017%204%2012%22%2F%3E%3C%2Fsvg%3E')] bg-[length:70%] bg-center bg-no-repeat transition-all cursor-pointer"
                            id="terms"
                            required
                        />
                        <label htmlFor="terms" className="text-sm text-gray-400 cursor-pointer">
                            I accept the <Link href="/terms" className="text-blue-500 hover:underline">Terms & Conditions</Link> and <Link href="/privacy" className="text-blue-500 hover:underline">Privacy Policy</Link>.
                        </label>
                    </div>
                </div>

                <div className="space-y-4">
                    <Button
                        type="submit"
                        className="w-full h-14 text-black font-bold text-base hover:opacity-90 border-none rounded-xl"
                        style={{ backgroundColor: 'hsl(var(--primary))', backgroundImage: 'none' }}
                        isLoading={loading}
                    >
                        Create My Account
                    </Button>

                    <Button type="button" variant="outline" className="w-full h-14 bg-[#1C1F2E] hover:bg-[#2A2E3B] border-white/10 text-white font-semibold text-base gap-3 rounded-xl flex items-center justify-center transition-all">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Sign Up With Google
                    </Button>
                </div>
            </form>

            <div className="mt-8 text-center">
                <p className="text-sm text-gray-400">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="font-semibold text-blue-500 hover:underline">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}
