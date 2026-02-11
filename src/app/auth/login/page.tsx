"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState } from "react";
import { login } from "@/app/auth/actions";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";


export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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

  return (
    <div className="w-full max-w-[480px] mx-auto bg-[#ffffff0d] p-8 rounded-xl border border-white/10 shadow-2xl backdrop-blur-sm">
      <div className="text-left mb-8">
        <p className="text-base font-medium text-gray-400">Welcome back</p>
        <h1 className="text-3xl font-bold text-white mt-2">Login to your account</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <Input
          name="email"
          type="email"
          placeholder="hello@example.com"
          label="Email"
          required
          startIcon={<Mail size={20} className="text-gray-400" />}
          className="bg-[#0B0E14] border-white/10 text-white text-base py-3 placeholder:text-gray-500 focus:bg-[#0B0E14] focus:border-primary/50 focus:text-white h-12"
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
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-white transition-colors text-gray-500">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            }
            className="bg-[#0B0E14] border-white/10 text-white text-base py-3 placeholder:text-gray-500 focus:bg-[#0B0E14] focus:border-primary/50 focus:text-white h-12"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember"
              className="appearance-none h-5 w-5 rounded bg-[#0B0E14] border border-white/20 checked:bg-primary checked:border-transparent checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%2220%206%209%2017%204%2012%22%2F%3E%3C%2Fsvg%3E')] bg-[length:70%] bg-center bg-no-repeat transition-all cursor-pointer"
            />
            <label htmlFor="remember" className="text-sm text-gray-400 cursor-pointer select-none">Stay signed in</label>
          </div>
          <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline font-medium">
            Forgot your password?
          </Link>
        </div>

        <div className="space-y-4">
          <Button
            type="submit"
            className="w-full h-14 text-black font-bold text-base hover:opacity-90 border-none rounded-xl"
            style={{ backgroundColor: 'hsl(var(--primary))', backgroundImage: 'none' }}
            isLoading={loading}
          >
            Login
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs text-gray-500 uppercase font-medium">
              <span className="bg-[#191919] px-2 rounded">OR</span>
            </div>
          </div>

          <button type="button" className="w-full h-14 bg-[#1C1F2E] hover:bg-[#2A2E3B] border border-white/10 text-white font-semibold text-base gap-3 rounded-xl flex items-center justify-center transition-all active:scale-95">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>
        </div>
      </form>

      <p className="text-center text-sm text-gray-400 mt-8">
        Don't have an account?{" "}
        <Link href="/auth/signup" className="font-semibold text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
