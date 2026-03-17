"use client";

import { PIP_VALUES } from "@/lib/calculators";
import { ChevronDown, Check } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface CurrencyPairSelectProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function CurrencyPairSelect({ value, onChange, className }: CurrencyPairSelectProps) {
    const pairs = Object.keys(PIP_VALUES).sort();

    return (
        <DropdownMenu className="block w-full">
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                        "w-full px-4 py-3 h-auto rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900 dark:text-white flex items-center justify-between",
                        className
                    )}
                >
                    <span className="font-bold text-lg">{value}</span>
                    <ChevronDown size={16} className="text-gray-500 shrink-0" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[280px] overflow-y-auto">
                {pairs.map((pair) => (
                    <DropdownMenuItem
                        key={pair}
                        onClick={() => onChange(pair)}
                        className={cn(
                            "flex items-center justify-between gap-2 px-3 py-2",
                            value === pair && "bg-primary/10 text-primary font-semibold"
                        )}
                    >
                        <span>{pair}</span>
                        {value === pair && <Check size={14} className="text-primary shrink-0" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
