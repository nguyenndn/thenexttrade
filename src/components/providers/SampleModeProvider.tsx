"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from "react";
import { toast } from "sonner";

interface SampleModeContextType {
    isSampleMode: boolean;
    toggleSampleMode: () => void;
    enableSampleMode: () => void;
    disableSampleMode: () => void;
}

const SampleModeContext = createContext<SampleModeContextType | undefined>(
    undefined
);

const STORAGE_KEY = "the_next_trade_sample_mode";

function setCookie(name: string, value: string, days?: number) {
    if (typeof document === "undefined") return;
    try {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
            expires = `; expires=${date.toUTCString()}`;
        }
        document.cookie = `${name}=${value || ""}${expires}; path=/; SameSite=Lax`;
    } catch {
        /* ignore */
    }
}

function deleteCookie(name: string) {
    if (typeof document === "undefined") return;
    try {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    } catch {
        /* ignore */
    }
}

export function SampleModeProvider({ children }: { children: ReactNode }) {
    const [isSampleMode, setIsSampleMode] = useState<boolean>(false);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    // Initialize state from localStorage after mount to prevent hydration mismatch
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === "true") {
                setIsSampleMode(true);
                setCookie(STORAGE_KEY, "true", 30);
            } else {
                deleteCookie(STORAGE_KEY);
            }
        } catch {
            // localStorage not available (e.g. incognito/restricted)
        } finally {
            setIsInitialized(true);
        }
    }, []);

    const enableSampleMode = useCallback(() => {
        setIsSampleMode(true);
        try {
            localStorage.setItem(STORAGE_KEY, "true");
            setCookie(STORAGE_KEY, "true", 30);
        } catch {
            /* ignore */
        }
        toast.info("Sample Data Playground activated.", {
            description: "Viewing 25 curated trades with live telemetry & AI Coach insights.",
        });
    }, []);

    const disableSampleMode = useCallback(() => {
        setIsSampleMode(false);
        try {
            localStorage.removeItem(STORAGE_KEY);
            deleteCookie(STORAGE_KEY);
        } catch {
            /* ignore */
        }
        toast.info("Exited Sample Data Playground.", {
            description: "Returned to your actual account telemetry.",
        });
    }, []);

    const toggleSampleMode = useCallback(() => {
        if (isSampleMode) {
            disableSampleMode();
        } else {
            enableSampleMode();
        }
    }, [isSampleMode, enableSampleMode, disableSampleMode]);

    return (
        <SampleModeContext.Provider
            value={{
                isSampleMode: isInitialized ? isSampleMode : false,
                toggleSampleMode,
                enableSampleMode,
                disableSampleMode,
            }}
        >
            {children}
        </SampleModeContext.Provider>
    );
}

export function useSampleMode() {
    const context = useContext(SampleModeContext);
    if (!context) {
        return {
            isSampleMode: false,
            toggleSampleMode: () => {},
            enableSampleMode: () => {},
            disableSampleMode: () => {},
        };
    }
    return context;
}
