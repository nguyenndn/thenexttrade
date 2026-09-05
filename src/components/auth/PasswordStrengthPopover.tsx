"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type PasswordStrengthLevel = "empty" | "weak" | "fair" | "good" | "strong";

export interface PasswordCriterion {
    id: "length" | "number" | "lowercase" | "uppercase" | "special";
    label: string;
    met: boolean;
}

export interface PasswordStrengthResult {
    score: number; // 0 to 4
    level: PasswordStrengthLevel;
    label: string;
    criteria: PasswordCriterion[];
    allMet: boolean;
}

/**
 * Evaluates password strength against 5 security criteria:
 * 1. At least 10 characters (matches auth validation min 10)
 * 2. At least one number
 * 3. At least one lowercase letter
 * 4. At least one uppercase letter
 * 5. At least one special character
 */
export function evaluatePasswordStrength(password: string = ""): PasswordStrengthResult {
    const pwd = typeof password === "string" ? password : "";
    const hasLength = pwd.length >= 10 && pwd.length <= 128;
    const hasNumber = /[0-9]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9\s]/.test(pwd);

    const criteria: PasswordCriterion[] = [
        {
            id: "length",
            label: "At least 10 characters",
            met: hasLength,
        },
        {
            id: "number",
            label: "At least one number",
            met: hasNumber,
        },
        {
            id: "lowercase",
            label: "At least one lowercase letter",
            met: hasLower,
        },
        {
            id: "uppercase",
            label: "At least one uppercase letter",
            met: hasUpper,
        },
        {
            id: "special",
            label: "At least one special character",
            met: hasSpecial,
        },
    ];

    if (!pwd) {
        return {
            score: 0,
            level: "empty",
            label: "",
            criteria,
            allMet: false,
        };
    }

    const metCount = criteria.filter((c) => c.met).length;

    if (metCount === 0) {
        return {
            score: 0,
            level: "empty",
            label: "",
            criteria,
            allMet: false,
        };
    }

    let score = 1;
    let level: PasswordStrengthLevel = "weak";
    let label = "Weak";

    if (metCount === 5) {
        score = 4;
        level = "strong";
        label = "Strong";
    } else if (metCount === 4) {
        score = 3;
        level = "good";
        label = "Good";
    } else if (metCount === 3) {
        score = 2;
        level = "fair";
        label = "Medium";
    } else {
        score = 1;
        level = "weak";
        label = "Weak";
    }

    return {
        score,
        level,
        label,
        criteria,
        allMet: metCount === 5,
    };
}

export interface PasswordStrengthPopoverProps {
    password: string;
    isVisible: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onClick?: () => void;
    className?: string;
}

export function PasswordStrengthPopover({
    password = "",
    isVisible,
    onMouseEnter,
    onMouseLeave,
    onClick,
    className,
}: PasswordStrengthPopoverProps) {
    const strength = evaluatePasswordStrength(password);

    const getSegmentColor = (segmentIndex: number) => {
        const isFilled = segmentIndex < strength.score;
        if (!isFilled) {
            return "bg-slate-200/80 dark:bg-white/10";
        }
        switch (strength.level) {
            case "weak":
                return "bg-rose-500";
            case "fair":
                return "bg-amber-500";
            case "good":
                return "bg-amber-400";
            case "strong":
                return "bg-emerald-500";
            default:
                return "bg-slate-200/80 dark:bg-white/10";
        }
    };

    const getStrengthBadgeClass = () => {
        switch (strength.level) {
            case "weak":
                return "text-rose-500 dark:text-rose-400";
            case "fair":
                return "text-amber-500 dark:text-amber-400";
            case "good":
                return "text-amber-600 dark:text-amber-400";
            case "strong":
                return "text-emerald-600 dark:text-emerald-400";
            default:
                return "text-slate-400";
        }
    };

    return (
        <div
            data-testid="password-strength-popover"
            role="region"
            aria-label="Password requirements"
            aria-live="polite"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
            className={cn(
                "absolute left-0 right-0 top-full mt-2 w-full z-50 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-2xl shadow-slate-900/10 box-border",
                "dark:border-white/10 dark:bg-[#1E2028] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)]",
                "transition-all duration-200 ease-out",
                isVisible
                    ? "opacity-100 translate-y-0 visible pointer-events-auto"
                    : "opacity-0 -translate-y-1 invisible pointer-events-none",
                className
            )}
        >
            {/* Header: Title & optional dynamic level indicator */}
            <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                    PASSWORD STRENGTH
                </span>
                {password && strength.label ? (
                    <span
                        data-testid="strength-label"
                        className={cn(
                            "text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-colors duration-200 select-none",
                            getStrengthBadgeClass()
                        )}
                    >
                        {strength.label}
                    </span>
                ) : null}
            </div>

            {/* 4-Segment Strength Progress Bar */}
            <div
                className="grid grid-cols-4 gap-1.5 mb-3 sm:mb-3.5"
                role="progressbar"
                aria-valuenow={strength.score}
                aria-valuemin={0}
                aria-valuemax={4}
                aria-label={`Password strength: ${strength.label || "Empty"}`}
            >
                {[0, 1, 2, 3].map((segmentIndex) => (
                    <div
                        key={segmentIndex}
                        data-testid={`strength-bar-${segmentIndex}`}
                        className={cn(
                            "h-1 sm:h-1.5 rounded-full transition-all duration-300",
                            getSegmentColor(segmentIndex)
                        )}
                    />
                ))}
            </div>

            {/* Dynamic Checklist Requirements */}
            <ul
                className="space-y-1.5 sm:space-y-2 text-xs"
                aria-label="Password requirements checklist"
            >
                {strength.criteria.map((item) => (
                    <li
                        key={item.id}
                        data-testid={`criterion-${item.id}`}
                        data-met={item.met}
                        className="flex items-center gap-2 sm:gap-2.5 text-xs select-none"
                    >
                        {item.met ? (
                            <Check
                                size={14}
                                className="text-emerald-500 dark:text-emerald-400 shrink-0 stroke-[2.5]"
                                aria-hidden="true"
                            />
                        ) : (
                            <X
                                size={14}
                                className="text-rose-500 dark:text-rose-400 shrink-0 stroke-[2.5]"
                                aria-hidden="true"
                            />
                        )}
                        <span
                            className={cn(
                                "transition-colors duration-150 text-[11px] sm:text-xs leading-tight min-w-0 break-words",
                                item.met
                                    ? "text-slate-700 dark:text-slate-200 font-medium"
                                    : "text-slate-500 dark:text-slate-400 font-normal"
                            )}
                        >
                            {item.label}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
