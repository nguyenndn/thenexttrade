"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Retrieve theme from localStorage or default to dark
        const storedTheme = localStorage.getItem("theme") as Theme | null;
        if (storedTheme) {
            setTheme(storedTheme);
        } else {
            // Check system preference
            if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
                setTheme("dark");
            } else {
                setTheme("light"); // Default to light if system is light? Or keep dark default?
                // Project seems dark-first, lets respect stored or system, default dark.
                setTheme("dark");
            }
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
            root.style.colorScheme = "dark";
            root.setAttribute("data-theme", "dark");
        } else {
            root.classList.remove("dark");
            root.style.colorScheme = "light";
            root.setAttribute("data-theme", "light");
        }
        localStorage.setItem("theme", theme);
    }, [theme, mounted]);

    const toggleTheme = () => {
        const root = document.documentElement;

        // Disable all transitions before switching
        root.classList.add("disable-transitions");

        // Toggle theme
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));

        // Re-enable transitions after browser repaint
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                root.classList.remove("disable-transitions");
            });
        });
    };

    // To prevent hydration mismatch, we might render nothing or default until mounted.
    // However, since we default to "dark" in state and "dark" in html className, 
    // we should be okay mostly. But let's just return children.
    // If we delay rendering, we get a flash.
    // Better to let it match initial server render if possible (which is dark).

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
