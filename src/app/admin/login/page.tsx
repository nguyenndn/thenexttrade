"use client";

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TurnstileWidget } from "@/components/ui/TurnstileWidget";
import { adminLogin } from "./actions";
import Link from "next/link";

export default function AdminLoginPage() {
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [showPassword, setShowPassword] = useState(false);
 const [turnstileToken, setTurnstileToken] = useState("");

 const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
 e.preventDefault();
 setLoading(true);
 setError(null);

 const formData = new FormData(e.currentTarget);
 formData.set("cf-turnstile-response", turnstileToken);
 const result = await adminLogin(formData);

 if (result?.error) {
 setError(result.error);
 setLoading(false);
 } else if (result?.requires2FA) {
 window.location.href = "/auth/verify-2fa";
 }
 };

 return (
 <div className="bg-white dark:bg-[#1E2028] p-8 rounded-2xl border border-dashboard shadow-2xl shadow-black/5 dark:shadow-black/20 transition-colors duration-300">
 {/* Admin Badge */}
 <div className="flex justify-center mb-6">
 <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/5 dark:to-orange-500/5 border border-amber-200 dark:border-amber-500/20 rounded-full">
 <ShieldCheck size={16} className="text-amber-600 dark:text-amber-400" />
 <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
 Admin Panel
 </span>
 </div>
 </div>

 <div className="text-center mb-8">
 <h1 className="text-2xl font-bold text-gray-700 dark:text-white">
 Administration Login
 </h1>
 <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
 Authorized personnel only
 </p>
 </div>

 {error && (
 <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center mb-6 font-medium">
 {error}
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-5">
 <Input
 name="email"
 type="email"
 placeholder="admin@thenexttrade.com"
 label="Email"
 required
 autoComplete="email"
 startIcon={<Mail size={18} className="text-gray-400" />}
 className="bg-gray-50 dark:bg-[#0B0E14] border-dashboard text-gray-700 dark:text-white text-sm py-3 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:bg-white dark:focus:bg-[#0B0E14] focus:border-primary/50 dark:focus:border-primary/50 h-12 transition-colors rounded-xl"
 />

 <Input
 name="password"
 type={showPassword ? "text" : "password"}
 placeholder="••••••••"
 label="Password"
 required
 autoComplete="current-password"
 startIcon={<Lock size={18} className="text-gray-400" />}
 endIcon={
 <Button
 type="button"
 variant="ghost"
 size="icon"
 onClick={() => setShowPassword(!showPassword)}
 className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
 aria-label={showPassword ? "Hide password" : "Show password"}
 >
 {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
 </Button>
 }
 className="bg-gray-50 dark:bg-[#0B0E14] border-dashboard text-gray-700 dark:text-white text-sm py-3 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:bg-white dark:focus:bg-[#0B0E14] focus:border-primary/50 dark:focus:border-primary/50 h-12 transition-colors rounded-xl"
 />

 <TurnstileWidget
 onVerify={setTurnstileToken}
 className="flex justify-center"
 />

 <Button
 type="submit"
 variant="primary"
 className="w-full h-13 font-bold text-base hover:opacity-90 border-none rounded-xl"
 isLoading={loading}
 >
 Sign In to Admin
 </Button>
 </form>

 <div className="mt-6 pt-6 border-t border-dashboard text-center">
 <Link
 href="/auth/login"
 className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors font-medium"
 >
 &larr; Back to User Login
 </Link>
 </div>
 </div>
 );
}
