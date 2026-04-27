"use client";

import { useEffect, useRef, useCallback } from "react";

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
      size,
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
  }, [onVerify, onExpire, onError, theme, size]);

  useEffect(() => {
    // If no site key, skip (dev mode)
    if (!SITE_KEY) {
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
  }, [renderWidget, onVerify]);

  // Don't render anything if no site key (dev mode)
  if (!SITE_KEY) return null;

  return <div ref={containerRef} className={className} />;
}
