"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState } from "react";
import { login, signInWithMagicLink } from "@/app/auth/actions";
import { Mail, Lock, Eye, EyeOff, Sparkles, CheckCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";


export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.requires2FA) {
      window.location.href = "/auth/verify-2fa";
    }
  };

  const handleMagicLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await signInWithMagicLink(formData);

    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
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
    <div className="w-full max-w-[480px] mx-auto bg-white dark:bg-[#1E2028] p-8 rounded-xl border border-gray-200 dark:border-white/10 shadow-xl transition-colors duration-300">
      <div className="flex justify-center mb-6">
        <Logo />
      </div>
      <div className="text-center mb-8">
        <p className="text-base font-medium text-gray-500 dark:text-gray-400">Welcome back</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">Login to your account</h1>
      </div>

      {/* Mode Tabs */}
      <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1 mb-6">
        <button
          type="button"
          onClick={() => switchMode("password")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            mode === "password"
              ? "bg-white dark:bg-[#0B0E14] text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
              ? "bg-white dark:bg-[#0B0E14] text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Sparkles size={16} />
          Magic Link
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-500 text-sm text-center mb-6">
          {error}
        </div>
      )}

      {/* Password Login Form */}
      {mode === "password" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            name="email"
            type="email"
            placeholder="hello@example.com"
            label="Email"
            required
            startIcon={<Mail size={20} className="text-gray-400" />}
            className="bg-gray-50 dark:bg-[#0B0E14] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-base py-3 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-[#0B0E14] focus:border-primary/50 dark:focus:border-primary/50 focus:text-gray-900 dark:focus:text-white h-12 transition-colors"
          />

          <div>
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              label="Password"
              required
              startIcon={<Lock size={20} className="text-gray-400" />}
              endIcon={
                <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </Button>
              }
              className="bg-gray-50 dark:bg-[#0B0E14] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-base py-3 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-[#0B0E14] focus:border-primary/50 dark:focus:border-primary/50 focus:text-gray-900 dark:focus:text-white h-12 transition-colors"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                className="appearance-none h-5 w-5 rounded bg-white dark:bg-[#0B0E14] border border-gray-300 dark:border-white/20 checked:bg-primary dark:checked:bg-primary checked:border-transparent dark:checked:border-transparent checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%2220%206%209%2017%204%2012%22%2F%3E%3C%2Fsvg%3E')] bg-[length:70%] bg-center bg-no-repeat transition-all cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">Stay signed in</label>
            </div>
            <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline font-medium">
              Forgot your password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full h-14 font-bold text-base hover:opacity-90 border-none rounded-xl"
            isLoading={loading}
          >
            Login
          </Button>
        </form>
      )}

      {/* Magic Link Form */}
      {mode === "magic" && !magicLinkSent && (
        <form onSubmit={handleMagicLink} className="space-y-6">
          <div className="text-center mb-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and we'll send you a magic link to sign in instantly — no password needed.
            </p>
          </div>

          <Input
            name="email"
            type="email"
            placeholder="hello@example.com"
            label="Email"
            required
            startIcon={<Mail size={20} className="text-gray-400" />}
            className="bg-gray-50 dark:bg-[#0B0E14] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-base py-3 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-[#0B0E14] focus:border-primary/50 dark:focus:border-primary/50 focus:text-gray-900 dark:focus:text-white h-12 transition-colors"
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full h-14 font-bold text-base hover:opacity-90 border-none rounded-xl flex items-center justify-center gap-2"
            isLoading={loading}
          >
            <Sparkles size={18} />
            Send Magic Link
          </Button>
        </form>
      )}

      {/* Magic Link Success */}
      {mode === "magic" && magicLinkSent && (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
            <CheckCircle className="text-primary" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Check your email</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            We've sent a magic link to your email.<br />
            Click the link to sign in instantly.
          </p>
          <button
            type="button"
            onClick={() => setMagicLinkSent(false)}
            className="text-sm text-primary hover:underline font-medium mt-4"
          >
            Try again with a different email
          </button>
        </div>
      )}

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
        Don't have an account?{" "}
        <Link href="/auth/signup" className="font-semibold text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
