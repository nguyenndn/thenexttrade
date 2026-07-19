"use client";

import { useState } from "react";
import {
    ChevronDown,
    ChevronUp,
    HelpCircle,
    AlertTriangle,
} from "lucide-react";
import { trackEvent } from "@/lib/track";

type SyncMethod = "EA_SYNC";

interface HelpTopic {
    question: string;
    answer: string[];
}

const TRADE_MANAGER_HELP: HelpTopic[] = [
    {
        question: "API key invalid or 400 error",
        answer: [
            "Check that the copied key has no leading or trailing spaces.",
            "Regenerate the key from Settings → Sync Settings only if necessary.",
            "Make sure the account belongs to the currently logged-in user.",
        ],
    },
    {
        question: "Trade Manager EA cannot connect to server",
        answer: [
            "Confirm the WebRequest URL is added in MT5 → Tools → Options → Expert Advisors.",
            "The correct URL is: https://api.thenexttrade.com",
            'Confirm the EA is attached to a chart and "Algo Trading" (or "Auto Trading") is enabled at the top toolbar.',
        ],
    },
    {
        question: "EA attached but no trades syncing",
        answer: [
            "Confirm the API key is entered correctly in the Trade Manager EA input field under the SYNC tab.",
            "Check the Experts tab in MT5 terminal toolbox for any error messages.",
            "Make sure you have closed trades in the account — only closed trades are synced.",
        ],
    },
    {
        question: "Sync completed but dashboard has no data",
        answer: [
            'Check the selected date range on the dashboard — try "Last Week."',
            "Refresh the dashboard page.",
        ],
    },
];

interface SyncTroubleshootingPanelProps {
    method: SyncMethod;
    className?: string;
}

export function SyncTroubleshootingPanel({
    method,
    className = "",
}: SyncTroubleshootingPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const topics = TRADE_MANAGER_HELP;
    const methodLabel = "Trade Manager";

    const handleToggle = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        if (newState) {
            trackEvent("sync_help_opened", { method: "trade_manager" });
        }
    };

    return (
        <div
            className={`rounded-xl border border-dashboard overflow-hidden ${className}`}
        >
            {/* Trigger */}
            <button
                type="button"
                onClick={handleToggle}
                className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
                <HelpCircle size={16} className="text-gray-400 shrink-0" />
                <span className="flex-1">
                    Having trouble with {methodLabel}?
                </span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Expandable content */}
            {isOpen && (
                <div className="border-t border-dashboard divide-y divide-dashboard">
                    {topics.map((topic, index) => (
                        <div key={index}>
                            <button
                                type="button"
                                onClick={() =>
                                    setExpandedIndex(
                                        expandedIndex === index ? null : index
                                    )
                                }
                                className="w-full flex items-start gap-2.5 px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                <AlertTriangle
                                    size={14}
                                    className="text-amber-500 shrink-0 mt-0.5"
                                />
                                <span className="flex-1 font-medium text-gray-700 dark:text-gray-300">
                                    {topic.question}
                                </span>
                                {expandedIndex === index ? (
                                    <ChevronUp
                                        size={14}
                                        className="text-gray-400 shrink-0 mt-0.5"
                                    />
                                ) : (
                                    <ChevronDown
                                        size={14}
                                        className="text-gray-400 shrink-0 mt-0.5"
                                    />
                                )}
                            </button>
                            {expandedIndex === index && (
                                <ul className="px-4 pb-3 pl-9 space-y-1.5">
                                    {topic.answer.map((line, i) => (
                                        <li
                                            key={i}
                                            className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5"
                                        >
                                            <span className="text-primary mt-0.5 shrink-0">
                                                •
                                            </span>
                                            <span>{line}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
