"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Bug, Lightbulb, Send, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type FeedbackType = "BUG" | "FEATURE";

interface FeedbackPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FeedbackPanel({ isOpen, onClose }: FeedbackPanelProps) {
    const [activeType, setActiveType] = useState<FeedbackType>("BUG");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!message.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: activeType, message: message.trim() }),
            });

            if (res.ok) {
                setSubmitted(true);
                setTimeout(() => {
                    setSubmitted(false);
                    setMessage("");
                    onClose();
                }, 2000);
            }
        } catch {
            // silently fail
        } finally {
            setIsSubmitting(false);
        }
    };

    const types = [
        {
            key: "BUG" as FeedbackType,
            label: "Bug Report",
            icon: Bug,
            color: "text-red-500",
            activeBg: "bg-red-500/10 border-red-500/30",
            description: "Something isn't working as expected",
        },
        {
            key: "FEATURE" as FeedbackType,
            label: "Feature Request",
            icon: Lightbulb,
            color: "text-amber-500",
            activeBg: "bg-amber-500/10 border-amber-500/30",
            description: "Suggest an improvement or new feature",
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-6 z-[9998] w-[380px] max-h-[calc(100vh-140px)] bg-white dark:bg-[#151925] rounded-2xl shadow-2xl shadow-black/20 border border-gray-200 dark:border-white/10 flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Send size={16} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Feedback & Support</h3>
                        <p className="text-[11px] text-gray-500">Help us improve your experience</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    aria-label="Close panel"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Success State */}
            {submitted ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 px-6">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"
                    >
                        <CheckCircle size={32} className="text-primary" />
                    </motion.div>
                    <h4 className="text-base font-bold text-gray-900 dark:text-white">Thank you!</h4>
                    <p className="text-sm text-gray-500 mt-1 text-center">Your feedback has been submitted successfully.</p>
                </div>
            ) : (
                <>
                    {/* Type Selector */}
                    <div className="px-5 pt-4 pb-3">
                        <div className="grid grid-cols-2 gap-2.5">
                            {types.map((t) => {
                                const Icon = t.icon;
                                const isActive = activeType === t.key;
                                return (
                                    <button
                                        key={t.key}
                                        onClick={() => setActiveType(t.key)}
                                        className={cn(
                                            "flex flex-col items-start gap-1.5 p-3.5 rounded-xl border-2 transition-all text-left",
                                            isActive
                                                ? t.activeBg
                                                : "border-gray-100 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20 bg-gray-50/50 dark:bg-white/5"
                                        )}
                                    >
                                        <Icon size={20} className={isActive ? t.color : "text-gray-400"} />
                                        <span className={cn(
                                            "text-xs font-bold",
                                            isActive ? "text-gray-900 dark:text-white" : "text-gray-500"
                                        )}>
                                            {t.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-2.5 pl-0.5">
                            {types.find(t => t.key === activeType)?.description}
                        </p>
                    </div>

                    {/* Message Input */}
                    <div className="px-5 pb-4 flex-1">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={activeType === "BUG"
                                ? "Describe the bug you encountered..."
                                : "Describe the feature you'd like to see..."
                            }
                            rows={5}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0B0E14] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none transition-all"
                        />
                        <p className="text-[11px] text-gray-400 mt-1.5 pl-0.5">
                            {message.length}/1000 characters
                        </p>
                    </div>

                    {/* Submit Button */}
                    <div className="px-5 py-4 border-t border-gray-100 dark:border-white/10">
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={!message.trim() || isSubmitting}
                            isLoading={isSubmitting}
                            className="w-full"
                        >
                            <Send size={16} />
                            Submit {activeType === "BUG" ? "Bug Report" : "Feature Request"}
                        </Button>
                    </div>
                </>
            )}
        </motion.div>
    );
}
