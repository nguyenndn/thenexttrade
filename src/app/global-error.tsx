"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { isStaleDeploymentError } from "@/lib/deployment/stale-deployment";

/**
 * Root GlobalError boundary.
 * Intentionally avoids importing external UI/icon chunks so that rendering
 * this boundary never triggers an additional chunk fetch when old build assets 404.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[GlobalError]", error);
        if (isStaleDeploymentError(error) && typeof window !== "undefined") {
            try {
                const lastReload = Number(
                    sessionStorage.getItem("tnt_chunk_reload_at") || "0"
                );
                if (Date.now() - lastReload > 20_000) {
                    sessionStorage.setItem(
                        "tnt_chunk_reload_at",
                        String(Date.now())
                    );
                    window.location.reload();
                }
            } catch {
                window.location.reload();
            }
        }
    }, [error]);

    const handleRetry = () => {
        if (typeof window !== "undefined") {
            window.location.reload();
            return;
        }
        reset();
    };

    return (
        <html lang="en" className="dark">
            <body
                style={{
                    margin: 0,
                    backgroundColor: "#0B0E14",
                    color: "#F9FAFB",
                    fontFamily:
                        "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    WebkitFontSmoothing: "antialiased",
                }}
            >
                <div
                    style={{
                        minHeight: "100vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 16px",
                    }}
                >
                    <div
                        style={{
                            maxWidth: "420px",
                            width: "100%",
                            textAlign: "center",
                            backgroundColor: "#151925",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                            padding: "28px 24px",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.45)",
                        }}
                    >
                        <div
                            style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "8px",
                                backgroundColor: "rgba(245, 158, 11, 0.12)",
                                border: "1px solid rgba(245, 158, 11, 0.25)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 16px",
                            }}
                        >
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#F59E0B"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                <path d="M12 9v4" />
                                <path d="M12 17h.01" />
                            </svg>
                        </div>
                        <h2
                            style={{
                                fontSize: "20px",
                                fontWeight: 700,
                                margin: "0 0 8px",
                                color: "#FFFFFF",
                            }}
                        >
                            Refreshing Application State
                        </h2>
                        <p
                            style={{
                                fontSize: "14px",
                                lineHeight: 1.6,
                                color: "#9CA3AF",
                                margin: "0 0 20px",
                            }}
                        >
                            A newer version of TheNextTrade was deployed or the
                            connection briefly dropped. Reload to continue where
                            you left off.
                        </p>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "12px",
                            }}
                        >
                            <Button onClick={handleRetry} variant="primary">
                                Reload Page
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    window.location.href = "/dashboard";
                                }}
                            >
                                Dashboard
                            </Button>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
