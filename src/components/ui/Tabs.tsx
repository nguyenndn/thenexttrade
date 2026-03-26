"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";

interface TabsContextType {
    activeTab: string;
    setActiveTab: (value: string) => void;
    tabsId: string;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    children: ReactNode;
    className?: string;
    tabsId?: string;
}

export function Tabs({ defaultValue, value, onValueChange, children, className, tabsId }: TabsProps) {
    const [internal, setInternal] = useState(defaultValue || value || "");
    const activeTab = value !== undefined ? value : internal;
    const setActiveTab = (v: string) => {
        if (onValueChange) onValueChange(v);
        else setInternal(v);
    };
    const id = tabsId || defaultValue || "tabs";

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab, tabsId: id }}>
            <div className={cn("w-full", className)}>
                {children}
            </div>
        </TabsContext.Provider>
    );
}

interface TabsListProps {
    children: ReactNode;
    className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
    return (
        <div className={cn("flex items-center gap-1 bg-[#F1F3F5] dark:bg-[#1A1D27] p-1 rounded-xl border border-gray-200 dark:border-white/10 w-fit", className)}>
            {children}
        </div>
    );
}

interface TabsTriggerProps {
    value: string;
    children: ReactNode;
    className?: string;
    activeIndicatorClassName?: string;
    activeTextClassName?: string;
}

export function TabsTrigger({ value, children, className, activeIndicatorClassName, activeTextClassName }: TabsTriggerProps) {
    const context = useContext(TabsContext);
    if (!context) throw new Error("TabsTrigger must be used within Tabs");

    const isActive = context.activeTab === value;

    return (
        <Button
            variant="ghost"
            onClick={() => context.setActiveTab(value)}
            className={cn(
                "relative px-4 py-1.5 h-auto rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 z-10 hover:bg-transparent border",
                isActive
                    ? (activeTextClassName || "text-gray-900 dark:text-white")
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-transparent",
                className
            )}
        >
            {isActive && (
                <motion.div
                    layoutId={`activeTab-${context.tabsId}`}
                    className={cn(
                        "absolute inset-0 bg-white dark:bg-[#262A36] shadow-sm rounded-lg -z-10 border border-gray-200 dark:border-white/10",
                        activeIndicatorClassName
                    )}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
            )}
            {children}
        </Button>
    );
}

interface TabsContentProps {
    value: string;
    children: ReactNode;
    className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
    const context = useContext(TabsContext);
    if (!context) throw new Error("TabsContent must be used within Tabs");

    if (context.activeTab !== value) return null;

    return (
        <div
            className={cn(
                "mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300",
                className
            )}
        >
            {children}
        </div>
    );
}
