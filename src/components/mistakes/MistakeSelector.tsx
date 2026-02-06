"use client";

import { useState } from "react";
import { X, ChevronDown, AlertTriangle, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MISTAKES, MISTAKE_CATEGORIES, getMistakeSeverityColor, Mistake } from "@/lib/mistakes";

interface MistakeSelectorProps {
    value: string[];
    onChange: (value: string[]) => void;
    label?: string;
    trigger?: React.ReactNode;
}

export function MistakeSelector({ value = [], onChange, label, trigger }: MistakeSelectorProps) {

    // Toggle logic
    const toggleMistake = (code: string) => {
        if (value.includes(code)) {
            onChange(value.filter(c => c !== code));
        } else {
            onChange([...value, code]);
        }
    };

    const removeMistake = (code: string) => {
        onChange(value.filter(c => c !== code));
    };

    const getMistakeByCode = (code: string): Mistake | undefined => {
        for (const category of Object.values(MISTAKES)) {
            const found = category.find(m => m.code === code);
            if (found) return found;
        }
        return undefined;
    };

    return (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            {label && (
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-yellow-500" />
                    {label}
                </label>
            )}

            {/* Selected Mistakes - Only show if NO custom trigger is provided (default behavior) */}
            {!trigger && value.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {value.map(code => {
                        const mistake = getMistakeByCode(code);
                        if (mistake) {
                            return (
                                <span
                                    key={code}
                                    className={`
                                        inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border
                                        ${getMistakeSeverityColor(mistake.severity)}
                                    `}
                                >
                                    <span>{mistake.emoji}</span>
                                    <span>{mistake.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeMistake(code)}
                                        className="hover:opacity-70 p-0.5"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            );
                        } else {
                            return null;
                        }
                    })}
                </div>
            )}

            <Popover>
                <PopoverTrigger asChild>
                    {trigger ? (
                        <div className="inline-block">{trigger}</div>
                    ) : (
                        <button
                            type="button"
                            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 text-left hover:border-[#00C888] transition-colors focus:border-[#00C888] focus:outline-none"
                        >
                            <span className="text-sm font-medium text-gray-500">
                                {value.length === 0 ? "Select mistakes..." : `${value.length} mistake(s) logged`}
                            </span>
                            <ChevronDown size={16} className="text-gray-400" />
                        </button>
                    )}
                </PopoverTrigger>
                <PopoverContent
                    className="w-[380px] p-0"
                    align="start"
                    sideOffset={5}
                    collisionPadding={20}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
                        {MISTAKE_CATEGORIES.map(category => {
                            const categoryMistakes = MISTAKES[category] || [];
                            if (categoryMistakes.length === 0) return null;

                            return (
                                <div key={category} className="mb-4 last:mb-0">
                                    <h4 className="sticky top-0 bg-white dark:bg-[#1E2028] z-10 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-2 py-1">
                                        {category}
                                    </h4>
                                    <div className="space-y-1">
                                        {categoryMistakes.map(mistake => (
                                            <button
                                                key={mistake.code}
                                                type="button"
                                                onClick={() => toggleMistake(mistake.code)}
                                                className={`
                                                    w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors group
                                                    ${value.includes(mistake.code)
                                                        ? "bg-[#00C888]/10 text-[#00C888]"
                                                        : "hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
                                                    }
                                                `}
                                            >
                                                <span className="text-lg shrink-0 group-hover:scale-110 transition-transform">{mistake.emoji}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs font-bold leading-tight">
                                                            {mistake.name}
                                                        </p>
                                                        {value.includes(mistake.code) && <Check size={12} />}
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                                                        {mistake.description}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`
                                                        text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0
                                                        ${getMistakeSeverityColor(mistake.severity)}
                                                    `}
                                                >
                                                    {mistake.severity}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
