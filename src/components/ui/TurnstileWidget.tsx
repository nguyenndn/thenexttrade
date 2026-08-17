"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface TurnstileWidgetProps {
    onVerify: (token: string) => void;
    onExpire?: () => void;
    onError?: () => void;
    theme?: "light" | "dark" | "auto";
    size?: "normal" | "compact";
    className?: string;
}

declare global {
    interface Window {
        turnstile?: {
            render: (
                element: HTMLElement,
                options: Record<string, unknown>
            ) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
        };
        onTurnstileLoad?: () => void;
    }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const DISABLE_TURNSTILE = process.env.NEXT_PUBLIC_DISABLE_TURNSTILE === "true";

/**
 * Cloudflare Turnstile widget component.
 * Renders an invisible/managed CAPTCHA challenge.
 *
 * Usage:
 * ```tsx
 * const [turnstileToken, setTurnstileToken] = useState("");
 * <TurnstileWidget onVerify={setTurnstileToken} />
 * ```
 */
export function TurnstileWidget({
    onVerify,
    onExpire,
    onError,
    theme = "auto",
    size = "normal",
    className,
}: TurnstileWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const renderedRef = useRef(false);
    const isDev = process.env.NODE_ENV === "development";

    // Turnstile's normal-size iframe is fixed at 300px wide → scale it down
    // on narrow viewports so it doesn't overflow the auth card (~224px content).
    const [isCompactViewport, setIsCompactViewport] = useState(() =>
        typeof window !== "undefined"
            ? window.matchMedia("(max-width: 480px)").matches
            : false
    );

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 480px)");
        const update = () => setIsCompactViewport(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    const effectiveSize = isCompactViewport ? "compact" : size;

    const renderWidget = useCallback(() => {
        if (
            !window.turnstile ||
            !containerRef.current ||
            renderedRef.current ||
            !SITE_KEY
        ) {
            return;
        }

        renderedRef.current = true;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: SITE_KEY,
            theme,
            size: effectiveSize,
            callback: (token: string) => onVerify(token),
            "expired-callback": () => {
                onExpire?.();
                onVerify("");
            },
            "error-callback": () => {
                onError?.();
                onVerify("");
            },
        });
    }, [onVerify, onExpire, onError, theme, effectiveSize]);

    useEffect(() => {
        // Skip in dev mode, if no site key, or if Turnstile is explicitly disabled — auto-bypass so forms still work
        if (isDev || !SITE_KEY || DISABLE_TURNSTILE) {
            onVerify("dev-mode-bypass");
            return;
        }

        // Check if script already loaded
        if (window.turnstile) {
            renderWidget();
            return;
        }

        // Check if script tag already exists
        const existingScript = document.querySelector(
            'script[src*="challenges.cloudflare.com"]'
        );
        if (existingScript) {
            window.onTurnstileLoad = renderWidget;
            return;
        }

        // Load Turnstile script
        window.onTurnstileLoad = renderWidget;
        const script = document.createElement("script");
        script.src =
            "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        return () => {
            if (widgetIdRef.current && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current);
            }
            renderedRef.current = false;
            widgetIdRef.current = null;
        };
    }, [renderWidget, onVerify, isDev]);

    // Don't render widget in dev mode, if no site key, or if Turnstile is explicitly disabled
    if (isDev || !SITE_KEY || DISABLE_TURNSTILE) return null;

    return (
        <div
            className={`flex justify-center ${
                isCompactViewport ? "scale-[0.72] -my-[9px]" : ""
            } ${className ?? ""}`}
        >
            <div ref={containerRef} />
        </div>
    );
}
