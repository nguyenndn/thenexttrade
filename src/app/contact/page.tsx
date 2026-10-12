"use client";

import { useState } from "react";
import {
    Send,
    CheckCircle2,
    AlertCircle,
    Mail,
    User,
    FileText,
    ShieldCheck,
    RotateCcw,
    MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";
import { submitContactForm } from "@/app/actions/contact";
import { z } from "zod";

export default function ContactPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    const [isPending, setIsPending] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [lastSubmitted, setLastSubmitted] = useState<{
        name: string;
        email: string;
        subject: string;
    } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setStatus("idle");
        setErrors({});

        const schema = z.object({
            name: z.string().min(2, "Name must be at least 2 characters"),
            email: z.string().email("Invalid email address"),
            subject: z.string().min(5, "Subject must be at least 5 characters"),
            message: z
                .string()
                .min(10, "Message must be at least 10 characters"),
        });

        const validationResult = schema.safeParse({
            name,
            email,
            subject,
            message,
        });

        if (!validationResult.success) {
            const fieldErrors: Record<string, string> = {};
            validationResult.error.issues.forEach((err: z.ZodIssue) => {
                if (err.path[0])
                    fieldErrors[err.path[0] as string] = err.message;
            });
            setErrors(fieldErrors);
            setIsPending(false);
            return;
        }

        const result = await submitContactForm(validationResult.data);

        setIsPending(false);

        if (result.success) {
            setStatus("success");
            setLastSubmitted({ name, email, subject });
            setName("");
            setEmail("");
            setSubject("");
            setMessage("");
        } else {
            setStatus("error");
            setErrorMessage(result.error || "An unexpected error occurred.");
        }
    };

    const handleReset = () => {
        setStatus("idle");
        setErrorMessage("");
        setErrors({});
    };

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-transparent text-gray-700 dark:text-white relative isolate overflow-hidden transition-colors duration-300">
            {/* Subtle Gold Atmosphere Background */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_50%_15%,rgba(245,158,11,0.08),transparent_75%)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_15%,rgba(245,158,11,0.12),transparent_75%)] pointer-events-none" />

            {/* Technical Grid Pattern (50px standard) */}
            <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

            <div className="absolute inset-x-0 top-[63px] -z-10 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent pointer-events-none" />

            {/* Noise Background texture */}
            <div className="absolute inset-0 -z-10 noise-bg opacity-[0.018] dark:opacity-[0.035] pointer-events-none" />

            <PublicHeader />

            <main className="flex-grow pt-24 pb-14 relative z-10 px-4 flex flex-col justify-center">
                {/* Compact Letterhead Header */}
                <div className="max-w-2xl mx-auto text-center space-y-2 mb-6 sm:mb-8 mt-2 sm:mt-4">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
                        Send a Letter to <span className="text-gold">Our Desk</span>
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
                        Inquiries regarding MT5 systems, partner account verification, or platform assistance.
                    </p>
                </div>

                {/* The Letter Stationery Sheet */}
                <div className="max-w-2xl w-full mx-auto">
                    <div className="bg-white dark:bg-[#161922] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl shadow-gray-200/50 dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all duration-300">
                        {/* Top Airmail Postal Accent Ribbon */}
                        <div className="h-1.5 bg-gradient-to-r from-amber-500 via-gold to-amber-600" />

                        {status === "success" ? (
                            /* Letter Dispatched State */
                            <div className="p-8 sm:p-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                                    <CheckCircle2 size={32} />
                                </div>

                                <div className="space-y-2 max-w-md mx-auto">
                                    <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                        Letter Dispatched Successfully
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                                        Your correspondence has been sealed and securely delivered to our desk. A copy has been dispatched to{" "}
                                        <span className="font-bold text-gray-800 dark:text-gray-100 font-mono">
                                            {lastSubmitted?.email}
                                        </span>.
                                    </p>
                                </div>

                                {lastSubmitted && (
                                    <div className="bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-lg p-4 max-w-md mx-auto text-left text-sm space-y-1.5">
                                        <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                            Dispatch Record
                                        </div>
                                        <div className="text-gray-900 dark:text-white font-bold truncate text-base">
                                            {lastSubmitted.subject}
                                        </div>
                                        <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 text-xs">
                                            <span>From: {lastSubmitted.name}</span>
                                            <span>•</span>
                                            <span className="font-mono">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="md"
                                        onClick={handleReset}
                                        className="w-full sm:w-auto rounded-lg border-gray-200 dark:border-white/15 text-sm font-bold gap-2"
                                    >
                                        <RotateCcw size={14} />
                                        <span>Send Another Letter</span>
                                    </Button>
                                    <Link href="/trading-systems" className="w-full sm:w-auto">
                                        <Button
                                            variant="primary"
                                            size="md"
                                            className="w-full sm:w-auto rounded-lg bg-gold hover:bg-amber-600 text-white text-sm font-black"
                                        >
                                            Explore Trading Systems
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            /* Letter Drafting Form */
                            <div className="p-6 sm:p-8">
                                {/* Letterhead Strip */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-gray-200 dark:border-white/10">
                                    <div className="space-y-1">
                                        <div className="text-xs font-black uppercase tracking-[0.2em] text-amber-600 dark:text-gold flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                                            TheNextTrade · Official Dispatch
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                            Direct encrypted transmission to desk
                                        </div>
                                    </div>

                                    <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-2 rounded-lg bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 text-xs sm:text-sm">
                                        <Mail size={14} className="text-amber-500 shrink-0" />
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">To:</span>
                                        <span className="font-mono font-bold text-gray-900 dark:text-white">
                                            support@thenexttrade.com
                                        </span>
                                    </div>
                                </div>

                                {/* Error Banner */}
                                {status === "error" && (
                                    <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3.5 flex items-start gap-3 text-sm animate-in fade-in duration-200">
                                        <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                        <div>
                                            <div className="font-bold text-red-800 dark:text-red-400">
                                                Failed to dispatch letter
                                            </div>
                                            <div className="text-red-600 dark:text-red-300 mt-0.5 text-xs">
                                                {errorMessage}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Letter Form */}
                                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                                    {/* Sender Details (Row 1) */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="name"
                                                className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
                                            >
                                                <User size={14} className="text-amber-500" />
                                                <span>From (Full Name)</span>
                                            </label>
                                            <input
                                                id="name"
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                disabled={isPending}
                                                className={`w-full px-4 py-2.5 rounded-lg bg-gray-50/70 dark:bg-white/[0.03] border ${
                                                    errors.name
                                                        ? "border-red-500 focus:border-red-500"
                                                        : "border-gray-200 dark:border-white/10"
                                                } text-sm sm:text-base font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors`}
                                            />
                                            {errors.name && (
                                                <p className="text-red-500 text-xs font-semibold">
                                                    {errors.name}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="email"
                                                className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
                                            >
                                                <Mail size={14} className="text-amber-500" />
                                                <span>Return Email</span>
                                            </label>
                                            <input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                disabled={isPending}
                                                className={`w-full px-4 py-2.5 rounded-lg bg-gray-50/70 dark:bg-white/[0.03] border ${
                                                    errors.email
                                                        ? "border-red-500 focus:border-red-500"
                                                        : "border-gray-200 dark:border-white/10"
                                                } text-sm sm:text-base font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors`}
                                            />
                                            {errors.email && (
                                                <p className="text-red-500 text-xs font-semibold">
                                                    {errors.email}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Subject (Row 2) */}
                                    <div className="space-y-1.5">
                                        <label
                                            htmlFor="subject"
                                            className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
                                        >
                                            <FileText size={14} className="text-amber-500" />
                                            <span>Regarding (Subject)</span>
                                        </label>
                                        <input
                                            id="subject"
                                            type="text"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            disabled={isPending}
                                            className={`w-full px-4 py-2.5 rounded-lg bg-gray-50/70 dark:bg-white/[0.03] border ${
                                                errors.subject
                                                    ? "border-red-500 focus:border-red-500"
                                                    : "border-gray-200 dark:border-white/10"
                                            } text-sm sm:text-base font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors`}
                                        />
                                        {errors.subject && (
                                            <p className="text-red-500 text-xs font-semibold">
                                                {errors.subject}
                                            </p>
                                        )}
                                    </div>

                                    {/* Letter Body (Row 3) */}
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 italic">
                                            <span>Dear TheNextTrade Support Team,</span>
                                            <span className="font-mono text-xs not-italic text-gray-400">
                                                {message.length} chars
                                            </span>
                                        </div>
                                        <textarea
                                            id="message"
                                            rows={5}
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            disabled={isPending}
                                            className={`w-full p-4 rounded-lg bg-gray-50/70 dark:bg-white/[0.02] border ${
                                                errors.message
                                                    ? "border-red-500 focus:border-red-500"
                                                    : "border-gray-200 dark:border-white/10"
                                            } text-sm sm:text-base font-normal leading-relaxed text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors resize-none`}
                                        />
                                        {errors.message && (
                                            <p className="text-red-500 text-xs font-semibold">
                                                {errors.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Sign-off & Dispatch Bar */}
                                    <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-100 dark:border-white/5">
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                                            <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                                            <span>Encrypted transmission · Response &lt; 24h</span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                size="md"
                                                className="w-full sm:w-auto rounded-lg bg-gold hover:bg-amber-600 text-white font-black text-sm px-6 py-2.5 shadow-sm shadow-amber-500/20 flex items-center justify-center gap-2 border-none active:scale-[0.98] transition-all"
                                                isLoading={isPending}
                                            >
                                                <Send size={15} className="shrink-0" />
                                                <span>Send Letter</span>
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Community Chat Alternative Strip */}
                    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-2 gap-2">
                        <Link
                            href="/community"
                            className="inline-flex items-center gap-1.5 text-amber-600 dark:text-gold hover:underline font-semibold"
                        >
                            <MessageCircle size={15} />
                            <span>Prefer live chat? Join our Telegram Community</span>
                        </Link>
                        <span>
                            By dispatching, you agree to our{" "}
                            <Link href="/legal/privacy-policy" className="underline hover:text-gray-700 dark:hover:text-gray-200">
                                Privacy Policy
                            </Link>
                        </span>
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
