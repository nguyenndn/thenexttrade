"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
    Check,
    Copy,
    Link2,
    Share2,
    Award,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { SPRING_SOFT, backdropVariants, panelVariants } from "@/lib/animations";

interface CertificateShareModalProps {
    open: boolean;
    onClose: () => void;
    shareUrl: string;
    title: string;
    subtitle: string;
}

/**
 * Share modal for earned certificates: copy-link + QR code + native share.
 * Mirrors Premium card styling (rounded-xl, backdrop blur, lucide icons).
 */
export function CertificateShareModal({
    open,
    onClose,
    shareUrl,
    title,
    subtitle,
}: CertificateShareModalProps) {
    const [copied, setCopied] = useState(false);

    // Reset copied state when the modal reopens for a new certificate
    useEffect(() => {
        if (open) setCopied(false);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    // Body scroll lock: lock while open, release on exit complete, safety net on unmount.
    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
    }, [open]);

    useEffect(() => {
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    const releaseLock = () => {
        document.body.style.overflow = "unset";
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy link");
        }
    };

    const nativeShare = async () => {
        if (!navigator.share) {
            await copyLink();
            return;
        }
        try {
            await navigator.share({
                title,
                text: subtitle,
                url: shareUrl,
            });
        } catch {
            /* user cancelled */
        }
    };

    return (
        <AnimatePresence onExitComplete={releaseLock}>
            {open && (
                <motion.div
                    variants={backdropVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ type: "tween", duration: 0.2 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        variants={panelVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={SPRING_SOFT}
                        className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#151925] border border-dashboard shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center">
                            <Share2 size={16} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-gray-800 dark:text-white">
                                Share Certificate
                            </h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Show off your achievement
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 pb-6 space-y-4">
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 px-3.5 py-2.5">
                        <Award size={14} className="text-primary shrink-0" />
                        <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 leading-snug">
                            {subtitle}
                        </p>
                    </div>

                    {/* QR code */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="rounded-2xl bg-white p-3.5 border border-dashboard shadow-sm">
                            <QRCodeSVG
                                value={shareUrl}
                                size={128}
                                level="M"
                                bgColor="#ffffff"
                                fgColor="#111827"
                            />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Scan to view on any device
                        </span>
                    </div>

                    {/* Link row */}
                    <div className="flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-dashboard px-3.5 py-2.5">
                        <Link2 size={14} className="text-gray-400 shrink-0" />
                        <span className="flex-1 text-xs font-semibold text-gray-600 dark:text-gray-300 truncate">
                            {shareUrl}
                        </span>
                        <button
                            onClick={copyLink}
                            className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0",
                                copied
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : "bg-primary/10 text-primary hover:bg-primary/20"
                            )}
                        >
                            {copied ? (
                                <Check size={12} />
                            ) : (
                                <Copy size={12} />
                            )}
                            {copied ? "Copied" : "Copy"}
                        </button>
                    </div>

                    {/* Native share CTA */}
                    {"share" in navigator && (
                        <Button
                            variant="primary"
                            onClick={nativeShare}
                            className="w-full py-3"
                        >
                            <Share2 size={15} />
                            Share via…
                        </Button>
                    )}

                    <p className="text-center text-[10px] text-gray-400">
                        Everyone who opens this link can view your certificate.
                    </p>
                </div>
                </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
