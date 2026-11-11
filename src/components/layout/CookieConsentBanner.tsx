"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const COOKIE_CONSENT_KEY = "tnt_cookie_consent";
export const COOKIE_CONSENT_EVENT = "tnt-cookie-consent-change";
export type CookieConsentValue = "all" | "essential";

export function getCookieConsent(): CookieConsentValue | null {
    if (typeof window === "undefined") return null;
    try {
        const val = window.localStorage.getItem(COOKIE_CONSENT_KEY);
        if (val === "all" || val === "essential") return val;
        return null;
    } catch {
        return null;
    }
}

export function CookieConsentBanner() {
    const pathname = usePathname();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const existing = getCookieConsent();
        if (!existing) {
            setVisible(true);
        }
    }, []);

    const handleChoice = (choice: CookieConsentValue) => {
        try {
            window.localStorage.setItem(COOKIE_CONSENT_KEY, choice);
            window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
        } catch {
            // Ignore storage errors in private browsing
        }
        setVisible(false);
    };

    if (!visible || pathname?.startsWith("/onboarding")) return null;

    return (
        <div
            role="region"
            aria-label="Cookie preferences"
            className="fixed bottom-4 inset-x-4 z-50 mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
            <div className="relative rounded-xl border border-gray-200/90 dark:border-amber-500/20 bg-white/95 dark:bg-[#1C1915]/95 backdrop-blur-md px-4 py-4 sm:px-6 sm:py-4 shadow-[0_16px_48px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.65)]">
                {/* Close button (defaults to Essential Only) */}
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleChoice("essential")}
                    aria-label="Close cookie preferences and use essential cookies only"
                    className="absolute top-2.5 right-2.5 h-7 w-7 min-w-7 p-0 rounded-lg border-transparent bg-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors"
                >
                    <X size={15} />
                </Button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-4 sm:pr-5">
                    {/* Left: Cookie Icon + Text */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-amber-500/10 dark:bg-[#141210] border border-amber-500/25 dark:border-white/10 flex items-center justify-center text-amber-600 dark:text-gold shrink-0">
                            <Cookie size={20} aria-hidden="true" />
                        </div>

                        <div className="min-w-0 space-y-0.5">
                            <h2 className="text-sm sm:text-base font-black text-gray-900 dark:text-white tracking-tight">
                                Cookie Preferences
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                We use essential cookies to operate the platform and optional analytics cookies to improve your experience.{" "}
                                <Link
                                    href="/legal/privacy-policy"
                                    className="font-bold text-amber-600 dark:text-gold hover:underline whitespace-nowrap"
                                >
                                    Privacy Policy
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Right: Essential Only / Accept All Buttons */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center w-full sm:w-auto justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            size="smd"
                            onClick={() => handleChoice("essential")}
                            className="flex-1 sm:flex-initial rounded-lg px-4 font-bold text-xs sm:text-sm border-gray-300 dark:border-white/15 bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-800 dark:text-white"
                        >
                            Essential Only
                        </Button>
                        <Button
                            type="button"
                            variant="gold"
                            size="smd"
                            onClick={() => handleChoice("all")}
                            className="flex-1 sm:flex-initial rounded-lg px-5 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20"
                        >
                            Accept All
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

