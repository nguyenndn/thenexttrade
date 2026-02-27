"use client";

import { useState, useEffect } from "react";
import { X, Filter, Check } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Button } from "@/components/ui/Button";

export type CalendarFilters = {
    currencies: string[]; // ['USD', 'EUR', ...]
    impact: string[];     // ['HIGH', 'MEDIUM', 'LOW']
    sessions: string[];   // ['New York', 'London', 'Tokyo', 'Sydney']
    remember: boolean;
};

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: CalendarFilters) => void;
    initialFilters: CalendarFilters;
}

const ALL_CURRENCIES = ["USD", "EUR", "JPY", "GBP", "CHF", "CAD", "AUD", "NZD", "CNY"];
const ALL_IMPACTS = [
    { label: "High", value: "HIGH", color: "bg-red-500" },
    { label: "Medium", value: "MEDIUM", color: "bg-orange-500" }, // or blue/yellow depending on theme ref
    { label: "Low", value: "LOW", color: "bg-gray-400" },
];
// Adjust Impact colors to match site style if needed (Site uses Red for High, Blue for Med, Gray for Low likely)
const IMPACT_COLORS: Record<string, string> = {
    "HIGH": "bg-red-500",
    "MEDIUM": "bg-cyan-500",
    "LOW": "bg-gray-400"
};

const ALL_SESSIONS = ["Sydney", "Tokyo", "London", "New York"];

export function FilterModal({ isOpen, onClose, onApply, initialFilters }: FilterModalProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [filters, setFilters] = useState<CalendarFilters>(initialFilters);

    // Sync state when opening with different initialFilters
    useEffect(() => {
        if (isOpen) {
            setFilters(initialFilters);
        }
    }, [isOpen, initialFilters]);

    if (!isOpen) return null;

    const toggleCurrency = (currency: string) => {
        setFilters(prev => {
            const exists = prev.currencies.includes(currency);
            return {
                ...prev,
                currencies: exists
                    ? prev.currencies.filter(c => c !== currency)
                    : [...prev.currencies, currency]
            };
        });
    };

    const toggleImpact = (impact: string) => {
        setFilters(prev => {
            const exists = prev.impact.includes(impact);
            return {
                ...prev,
                impact: exists
                    ? prev.impact.filter(i => i !== impact)
                    : [...prev.impact, impact]
            };
        });
    };

    const toggleSession = (session: string) => {
        setFilters(prev => {
            const exists = prev.sessions.includes(session);
            return {
                ...prev,
                sessions: exists
                    ? prev.sessions.filter(s => s !== session)
                    : [...prev.sessions, session]
            };
        });
    };

    const handleSelectAllCurrencies = () => {
        setFilters(prev => ({ ...prev, currencies: ALL_CURRENCIES }));
    };

    const handleClearAllCurrencies = () => {
        setFilters(prev => ({ ...prev, currencies: [] }));
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className={`relative z-10 w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] cursor-default ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}`}>
                {/* Header */}
                <div className={`px-6 py-4 flex items-center justify-between border-b ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-100 bg-gray-50'}`}>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Filter size={20} className="text-cyan-500" />
                        Filters
                    </h3>
                    <button onClick={onClose} className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Remember Filters */}
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Remember Filters</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={filters.remember}
                                onChange={(e) => setFilters(prev => ({ ...prev, remember: e.target.checked }))}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-cyan-500"></div>
                        </label>
                    </div>

                    <hr className={isDark ? 'border-slate-700' : 'border-gray-100'} />

                    {/* Currencies */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-sm opacity-80">Currencies</h4>
                            <div className="flex gap-2">
                                <button onClick={handleSelectAllCurrencies} className="text-xs font-bold px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">All</button>
                                <button onClick={handleClearAllCurrencies} className="text-xs font-bold px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">None</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {ALL_CURRENCIES.map(curr => {
                                const isChecked = filters.currencies.includes(curr);
                                return (
                                    <button
                                        key={curr}
                                        onClick={() => toggleCurrency(curr)}
                                        className={`flex items-center gap-2 text-sm transition-all`}
                                    >
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${isChecked
                                            ? 'bg-slate-700 border-slate-700 text-white'
                                            : isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-white'
                                            }`}>
                                            {isChecked && <Check size={12} strokeWidth={3} />}
                                        </div>
                                        <span className={isChecked ? 'font-bold' : 'opacity-80'}>{curr}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <hr className={isDark ? 'border-slate-700' : 'border-gray-100'} />

                    {/* Impact */}
                    <div>
                        <h4 className="font-semibold text-sm opacity-80 mb-4">Impact</h4>
                        <div className="flex justify-around">
                            {ALL_IMPACTS.map(imp => {
                                const isChecked = filters.impact.includes(imp.value);
                                return (
                                    <button
                                        key={imp.value}
                                        onClick={() => toggleImpact(imp.value)}
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${isChecked
                                            ? 'bg-slate-700 border-slate-700 text-white'
                                            : isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-white'
                                            }`}>
                                            {isChecked && <Check size={14} strokeWidth={3} />}
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${isChecked
                                            ? IMPACT_COLORS[imp.value]
                                            : 'bg-gray-300 dark:bg-slate-700'
                                            }`}>
                                            {imp.label}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <hr className={isDark ? 'border-slate-700' : 'border-gray-100'} />

                    {/* Sessions */}
                    <div>
                        <h4 className="font-semibold text-sm opacity-80 mb-4">Sessions</h4>
                        <div className="grid grid-cols-2 gap-4">
                            {ALL_SESSIONS.map(session => {
                                const isChecked = filters.sessions.includes(session);
                                return (
                                    <button
                                        key={session}
                                        onClick={() => toggleSession(session)}
                                        className={`flex items-center gap-2 text-sm transition-all`}
                                    >
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${isChecked
                                            ? 'bg-slate-700 border-slate-700 text-white'
                                            : isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-white'
                                            }`}>
                                            {isChecked && <Check size={12} strokeWidth={3} />}
                                        </div>
                                        <span className={isChecked ? 'font-bold' : 'opacity-80'}>{session}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={`px-6 py-4 border-t flex justify-end gap-3 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-100 bg-gray-50'}`}>
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className={`rounded-lg font-medium text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-slate-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                    >Cancel
                    </Button>
                    <Button
                        onClick={() => onApply(filters)}
                        className="rounded-lg font-bold text-sm bg-primary hover:bg-[#00B078] text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105 active:scale-95"
                    >
                        Apply Filters
                    </Button>
                </div>
            </div>
        </div>
    );
}
