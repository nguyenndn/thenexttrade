"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQAccordionProps {
    items: FAQItem[];
}

export function FAQAccordion({ items }: FAQAccordionProps) {
    const [open, setOpen] = useState<number | null>(null);

    return (
        <div className="space-y-3">
            {items.map((item, idx) => (
                <div
                    key={idx}
                    className="rounded-xl border border-gray-200 dark:border-white/10 hover:border-primary dark:hover:border-primary/60 hover:shadow-md hover:shadow-primary/10 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                >
                    <button
                        onClick={() => setOpen(open === idx ? null : idx)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.07] transition-colors"
                    >
                        <span className="font-bold text-gray-900 dark:text-white text-sm pr-4">
                            {item.question}
                        </span>
                        <ChevronDown
                            size={18}
                            className={cn(
                                "shrink-0 text-gray-400 transition-transform duration-200",
                                open === idx && "rotate-180"
                            )}
                        />
                    </button>
                    <div
                        className={cn(
                            "grid transition-all duration-200 ease-in-out",
                            open === idx ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                        )}
                    >
                        <div className="overflow-hidden">
                            <p className="px-5 pb-4 pt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {item.answer}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
