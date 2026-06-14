"use client";

import { useState } from "react";
import { Send, MessageCircle, ShieldCheck, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    
    // Simulate API registration
    setTimeout(() => {
      setStatus("success");
      setEmail("");
    }, 1200);
  };

  return (
    <div className="relative overflow-hidden bg-white dark:bg-[#0B0E14] border-t border-gray-200 dark:border-white/10">
      {/* Decorative background effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 bg-amber-500/5 dark:bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      <section className="py-8 sm:py-12 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
          
          {/* Left Column: Telegram Community Callout */}
          <div className="lg:col-span-5 p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-[#0088cc]/10 text-[#0088cc] animate-pulse">
                <MessageCircle size={24} fill="currentColor" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-800 dark:text-white">Join Telegram Channel</h3>
                <p className="text-xs text-[#0088cc] font-bold">12,400+ Active Members</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-5">
              Get real-time market updates, trade ideas, automated EA reports, and connect with other successful traders instantly.
            </p>
            <a 
              href="https://t.me/thenexttrade" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-[#0088cc] to-[#00a2ed] hover:from-[#00a2ed] hover:to-[#00b6ff] text-white font-black text-sm shadow-[0_4px_12px_rgba(0,136,204,0.3)] hover:shadow-[0_4px_20px_rgba(0,136,204,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
            >
              <span>Connect Telegram</span>
              <ArrowRight size={14} />
            </a>
          </div>

          {/* Middle: Or Divider */}
          <div className="hidden lg:flex lg:col-span-1 justify-center">
            <span className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">OR</span>
          </div>

          {/* Right Column: Email Newsletter Capture */}
          <div className="lg:col-span-6">
            <h3 className="text-2xl font-extrabold text-gray-800 dark:text-white tracking-tight mb-2 flex items-center gap-2">
              <Mail size={22} className="text-gold" /> Weekly VIP Newsletter
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              Subscribe to get exclusive MT5 indicators, free automated EAs, and advanced risk calculators sent to your inbox every Friday.
            </p>

            {status === "success" ? (
              <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 flex items-start gap-3">
                <ShieldCheck size={18} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold">Awesome! You&apos;re subscribed.</p>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Please check your inbox to confirm your email and claim your indicators.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="email"
                    required
                    placeholder="Enter your trading email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full min-h-11 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 focus:border-gold outline-none text-gray-800 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-300"
                    disabled={status === "loading"}
                    suppressHydrationWarning
                  />
                </div>
                <Button
                  type="submit"
                  disabled={status === "loading"}
                  className="min-h-11 px-6 bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-black text-sm rounded-xl shadow-[0_4px_12px_rgba(245,158,11,0.25)] flex items-center justify-center gap-1.5 shrink-0"
                >
                  {status === "loading" ? "Subscribing..." : "Get Free EA"}
                  <Send size={12} />
                </Button>
              </form>
            )}
            
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3 flex items-center gap-1">
              <ShieldCheck size={11} /> No spam. Unsubscribe anytime. Your data is 100% secure.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}
