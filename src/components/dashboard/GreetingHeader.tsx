"use client";

import { useState, useEffect } from "react";
import {
    AnimatedMorningIcon,
    AnimatedAfternoonIcon,
    AnimatedEveningIcon,
} from "@/components/dashboard/GreetingIcons";
import { tradingQuotes } from "@/config/quotes";
import { Quote } from "lucide-react";

// Motivational quotes for new users who haven't started trading yet
const newUserQuotes = [
    {
        text: "Capital preservation precedes capital growth. Protect your downside first.",
        author: "Paul Tudor Jones",
    },
    {
        text: "The secret of getting ahead is getting started.",
        author: "Mark Twain",
    },
    {
        text: "Small daily improvements lead to stunning results.",
        author: "Robin Sharma",
    },
    {
        text: "Success is the sum of small efforts, repeated day in and day out.",
        author: "Robert Collier",
    },
    {
        text: "The best time to plant a tree was 20 years ago. The second best time is now.",
        author: "Chinese Proverb",
    },
];

interface GreetingHeaderProps {
    userName: string;
    currentAccountId?: string;
    hideFilters?: boolean;
}

export function GreetingHeader({
    userName,
    currentAccountId,
    hideFilters = false,
}: GreetingHeaderProps) {
    const [mounted, setMounted] = useState(false);
    const [greeting, setGreeting] = useState({
        text: "Welcome",
        icon: <AnimatedMorningIcon size={32} />,
    });
    const [quote, setQuote] = useState<{
        text: string;
        author?: string;
    } | null>(null);

    useEffect(() => {
        setMounted(true);
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
            setGreeting({
                text: "Good morning",
                icon: <AnimatedMorningIcon size={32} />,
            });
        } else if (hour >= 12 && hour < 18) {
            setGreeting({
                text: "Good afternoon",
                icon: <AnimatedAfternoonIcon size={32} />,
            });
        } else {
            setGreeting({
                text: "Good evening",
                icon: <AnimatedEveningIcon size={32} />,
            });
        }

        // New users get motivational onboarding quotes (skip API call)
        if (hideFilters) {
            setQuote(
                newUserQuotes[Math.floor(Math.random() * newUserQuotes.length)]
            );
            return;
        }

        // Existing users: fetch from DB, fallback to static
        fetch("/api/quotes?type=DASHBOARD&active=true")
            .then((res) => res.json())
            .then((data: { text: string; author?: string }[]) => {
                if (Array.isArray(data) && data.length > 0) {
                    const random =
                        data[Math.floor(Math.random() * data.length)];
                    setQuote({ text: random.text, author: random.author });
                } else {
                    setQuote(
                        tradingQuotes[
                            Math.floor(Math.random() * tradingQuotes.length)
                        ]
                    );
                }
            })
            .catch(() => {
                setQuote(
                    tradingQuotes[
                        Math.floor(Math.random() * tradingQuotes.length)
                    ]
                );
            });
    }, [hideFilters]);

    return (
        <div
            id="onborda-greeting"
            className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-6"
        >
            <div
                className={`transition-all duration-500 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
            >
                <div className="flex items-center gap-2 mb-1.5">
                    {greeting.icon}
                    <h1 className="text-xl font-black text-gray-700 dark:text-white tracking-tight">
                        {greeting.text},{" "}
                        <span className="text-amber-500 dark:text-amber-400 uppercase">
                            {userName}
                        </span>
                    </h1>
                </div>
                <div className="min-h-[24px] flex items-start gap-2 max-w-2xl">
                    {quote && (
                        <>
                            <Quote
                                size={14}
                                fill="currentColor"
                                className="text-amber-500/40 dark:text-amber-400/40 shrink-0 mt-0.5"
                            />
                            <p className="text-gray-600 dark:text-gray-300 text-sm font-medium italic leading-relaxed">
                                {quote.text}
                                {quote.author && (
                                    <span className="not-italic text-xs font-bold text-gray-400 dark:text-gray-500 ml-2 whitespace-nowrap">
                                        - {quote.author}
                                    </span>
                                )}
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
