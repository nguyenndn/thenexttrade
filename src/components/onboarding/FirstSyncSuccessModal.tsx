"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, ArrowRight, FileText, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/track";

interface FirstSyncSuccessModalProps {
  open: boolean;
  onClose: () => void;
  hasReports: boolean;
}

export function FirstSyncSuccessModal({ open, onClose, hasReports }: FirstSyncSuccessModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const hasTracked = useRef(false);

  useEffect(() => {
    if (open) {
      // Delay for smooth entrance
      const timer = setTimeout(() => setIsVisible(true), 50);
      if (!hasTracked.current) {
        trackEvent("first_sync_success_viewed");
        hasTracked.current = true;
      }
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [open]);

  if (!open) return null;

  const handlePrimary = () => {
    trackEvent("first_sync_success_completed", { action: "view_dashboard" });
    onClose();
  };

  const handleSecondary = () => {
    trackEvent("first_sync_success_completed", { action: "generate_report" });
    onClose();
    window.location.href = "/dashboard/reports?action=generate";
  };

  const handleDailyCheckin = () => {
    trackEvent("first_sync_success_completed", { action: "daily_checkin" });
    onClose();
    window.location.href = "/dashboard/journal?action=log-trade";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`relative z-10 bg-white dark:bg-[#1E2028] rounded-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl transition-all duration-500 ${isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"}`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-white/10 transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Celebratory header */}
        <div className="relative px-6 pt-8 pb-6 text-center overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/10 to-transparent dark:from-primary/10 dark:via-primary/5 pointer-events-none" />
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/20 rounded-full blur-[60px] pointer-events-none" />

          <div className="relative z-10">
            {/* Success icon */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center shadow-lg shadow-primary/30 mb-4">
              <Sparkles size={28} className="text-white" />
            </div>

            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
              Your dashboard is live
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
              Your first trade data is in. You can now review performance, sessions, symbols, and your Trade Score.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-2">
          <Button
            variant="primary"
            onClick={handlePrimary}
            className="w-full h-12 font-bold shadow-lg shadow-primary/20 gap-2"
          >
            View Dashboard
            <ArrowRight size={16} />
          </Button>

          {!hasReports && (
            <Button
              variant="outline"
              onClick={handleSecondary}
              className="w-full h-10 gap-2 text-sm"
            >
              <FileText size={14} />
              Generate First Review
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={handleDailyCheckin}
            className="w-full h-10 gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Sun size={14} />
            Daily Check-in
          </Button>
        </div>
      </div>
    </div>
  );
}
