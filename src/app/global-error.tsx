"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

function isStaleChunkError(error: Error | null | undefined): boolean {
    if (!error) return false;
    const msg = `${error.name || ""} ${error.message || ""}`;
    return (
        error.name === "ChunkLoadError" ||
        /Loading chunk [\w-]+ failed/i.test(msg) ||
        /Failed to fetch dynamically imported module/i.test(msg) ||
        /Importing a module script failed/i.test(msg) ||
        /error loading dynamically imported module/i.test(msg)
    );
}

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[GlobalError]", error);
        if (isStaleChunkError(error) && typeof window !== "undefined") {
            try {
                const lastReload = Number(
                    sessionStorage.getItem("tnt_chunk_reload_at") || "0"
                );
                if (Date.now() - lastReload > 15_000) {
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
        if (isStaleChunkError(error) && typeof window !== "undefined") {
            window.location.reload();
            return;
        }
        reset();
    };

    return (
        <html lang="en" className="dark">
            <body className="m-0 bg-[#0B0E14] text-[#F9FAFB] font-sans antialiased">
                <div className="min-h-screen flex items-center justify-center px-4">
                    <div className="text-center max-w-md space-y-4 bg-[#151925] border border-white/10 rounded-xl p-6 sm:p-8 shadow-2xl">
                        <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
                            <AlertTriangle
                                size={24}
                                className="text-amber-500"
                            />
                        </div>
                        <h2 className="text-xl font-bold text-white">
                            Refreshing Application State
                        </h2>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            A newer version of TheNextTrade was deployed or the
                            connection briefly dropped. Reload to continue where
                            you left off.
                        </p>
                        <div className="flex items-center justify-center gap-3 pt-2">
                            <Button onClick={handleRetry} variant="primary">
                                <RotateCcw size={16} />
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
