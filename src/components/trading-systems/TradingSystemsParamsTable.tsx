"use client";

import React, { useState, useTransition } from "react";
import { Search, Copy, Check, Cpu, Info } from "lucide-react";

interface SystemParameter {
    name: string;
    defaultValue: string;
    description: string;
}

interface TradingSystemsParamsTableProps {
    parameters: SystemParameter[];
}

export function TradingSystemsParamsTable({
    parameters,
}: TradingSystemsParamsTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [copiedName, setCopiedName] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
    };

    const filteredParameters = parameters.filter((param) => {
        const term = searchTerm.toLowerCase();
        return (
            param.name.toLowerCase().includes(term) ||
            param.defaultValue.toLowerCase().includes(term) ||
            param.description.toLowerCase().includes(term)
        );
    });

    const handleCopy = async (name: string) => {
        try {
            await navigator.clipboard.writeText(name);
            setCopiedName(name);
            setTimeout(() => {
                setCopiedName(null);
            }, 2000);
        } catch (err) {
            // Ignored
        }
    };

    return (
        <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-[#111318]/30 p-6 shadow-sm overflow-hidden flex flex-col gap-5">
            {/* Table Header Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-base font-black text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-2 shrink-0">
                    <Cpu size={16} className="text-gold" />
                    MT5 Parameters Specs
                </h3>

                {/* Height Synchronized Search Input (Exactly 38px height) */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 focus-within:border-gold focus-within:ring-1 focus-within:ring-gold transition-all w-full sm:max-w-[200px] h-[38px]">
                    <Search size={14} className="text-gray-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search parameter..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="bg-transparent text-xs focus:outline-none w-full text-gray-700 dark:text-white placeholder:text-gray-400 font-semibold"
                    />
                </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto -mx-6 px-6">
                {filteredParameters.length > 0 ? (
                    <table className="w-full text-left text-xs font-semibold">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-white/5 text-[10px] uppercase text-gray-400 tracking-wider">
                                <th className="py-2.5 font-black">Parameter</th>
                                <th className="py-2.5 px-3 font-black">
                                    Default
                                </th>
                                <th className="py-2.5 font-black text-right">
                                    Description
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.02] font-bold">
                            {filteredParameters.map((param) => {
                                const isCopied = copiedName === param.name;
                                return (
                                    <tr
                                        key={param.name}
                                        className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors group/row cursor-pointer"
                                        onClick={() => handleCopy(param.name)}
                                    >
                                        <td className="py-3 font-mono text-gold select-all flex items-center gap-1.5 relative">
                                            <span className="truncate max-w-[120px]">
                                                {param.name}
                                            </span>

                                            {/* Copy Indicator overlay */}
                                            <span className="opacity-0 group-hover/row:opacity-100 transition-opacity text-[10px] text-gray-400 flex items-center shrink-0">
                                                {isCopied ? (
                                                    <span className="text-emerald-500 font-black text-[9px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 animate-in zoom-in-95">
                                                        Copied
                                                    </span>
                                                ) : (
                                                    <Copy
                                                        size={10}
                                                        className="hover:text-gold transition-colors ml-1"
                                                    />
                                                )}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 font-mono text-gray-800 dark:text-gray-200 select-all">
                                            {param.defaultValue}
                                        </td>
                                        <td className="py-3 text-xs text-gray-500 dark:text-gray-400 font-medium leading-snug text-right max-w-[160px] truncate-2-lines">
                                            {param.description}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="py-8 text-center text-xs font-semibold text-gray-400 dark:text-gray-500">
                        No parameters match your search.
                    </div>
                )}
            </div>

            <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold border-t border-dashed border-gray-200 dark:border-white/5 pt-3 flex items-center gap-1">
                <Info size={11} className="text-gold shrink-0" />
                <span>
                    Click on any parameter name to copy it instantly to your
                    clipboard.
                </span>
            </div>
        </div>
    );
}
