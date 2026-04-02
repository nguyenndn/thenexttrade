"use client";

import { useState, useEffect } from "react";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";
import { AnimatedMorningIcon, AnimatedAfternoonIcon, AnimatedEveningIcon } from "@/components/dashboard/GreetingIcons";
import { tradingQuotes } from "@/config/quotes";

interface GreetingHeaderProps {
    userName: string;
    currentAccountId?: string;
}

export function GreetingHeader({ userName, currentAccountId }: GreetingHeaderProps) {
    const [mounted, setMounted] = useState(false);
    const [greeting, setGreeting] = useState({
        text: "Welcome",
        icon: <AnimatedMorningIcon size={32} />
    });
    const [quote, setQuote] = useState("");

    useEffect(() => {
        setMounted(true);
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
            setGreeting({ text: "Good morning", icon: <AnimatedMorningIcon size={32} /> });
        } else if (hour >= 12 && hour < 18) {
            setGreeting({ text: "Good afternoon", icon: <AnimatedAfternoonIcon size={32} /> });
        } else {
            setGreeting({ text: "Good evening", icon: <AnimatedEveningIcon size={32} /> });
        }

        // Fetch from DB, fallback to static
        fetch('/api/quotes?type=DASHBOARD&active=true')
            .then(res => res.json())
            .then((data: { text: string }[]) => {
                if (Array.isArray(data) && data.length > 0) {
                    const random = data[Math.floor(Math.random() * data.length)];
                    setQuote(random.text);
                } else {
                    setQuote(tradingQuotes[Math.floor(Math.random() * tradingQuotes.length)]);
                }
            })
            .catch(() => {
                setQuote(tradingQuotes[Math.floor(Math.random() * tradingQuotes.length)]);
            });
    }, []);

    return (
        <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-6">
            <div className={`transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex items-center gap-2 mb-1">
                    {greeting.icon}
                    <h1 className="text-xl font-black text-gray-700 dark:text-white tracking-tight">
                        {greeting.text}, <span className="text-primary uppercase">{userName}</span>
                    </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 font-medium italic border-l-2 border-primary pl-3 min-h-[20px]">
                    {quote ? `"${quote}"` : " "}
                </p>
            </div>

            <div className="flex items-center gap-3">
                <DashboardFilter currentAccountId={currentAccountId} />
            </div>
        </div>
    );
}
