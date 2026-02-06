"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { countries as countryData } from "@/lib/data/countries";

interface Country {
    code: string;
    name: string;
}

interface CountrySelectProps {
    value?: string;
    onChange?: (value: string) => void;
    className?: string;
    error?: boolean;
}

export function CountrySelect({ value, onChange, className, error }: CountrySelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [countries, setCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Use local data
    useEffect(() => {
        setCountries(countryData);
        setLoading(false);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedCountry = countries.find((c) => c.code === value);

    const filteredCountries = countries.filter((country) =>
        country.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !loading && setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center justify-between w-full h-12 px-4 rounded-xl border bg-[#0B0E14] text-left transition-all",
                    "border-white/10 hover:border-white/20 focus:outline-none focus:border-[#2F80ED]/50 focus:ring-1 focus:ring-[#2F80ED]/50",
                    error ? "border-red-500/50" : "",
                    loading ? "opacity-70 cursor-wait" : "",
                    className
                )}
                disabled={loading}
            >
                {loading ? (
                    <span className="text-gray-500 text-sm">Loading countries...</span>
                ) : selectedCountry ? (
                    <div className="flex items-center gap-3">
                        <img
                            src={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png`}
                            alt={selectedCountry.name}
                            className="w-6 h-auto rounded-sm object-cover shadow-sm"
                        />
                        <span className="text-white text-base truncate pr-2">{selectedCountry.name}</span>
                    </div>
                ) : (
                    <span className="text-gray-500 text-base">Select Country</span>
                )}
                <ChevronDown size={20} className={cn("text-gray-400 transition-transform shrink-0", isOpen ? "rotate-180" : "")} />
            </button>

            {/* Hidden Input for Form Submission */}
            <input type="hidden" name="country" value={value || ""} required />

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-[#1C1F2E] border border-white/10 rounded-xl shadow-2xl max-h-80 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    {/* Search Bar */}
                    <div className="p-3 border-b border-white/10 sticky top-0 bg-[#1C1F2E] z-10">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search country..."
                                className="w-full bg-[#0B0E14] text-white text-sm rounded-lg pl-9 pr-3 py-2 border border-white/10 focus:outline-none focus:border-[#2F80ED]/50"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Country List */}
                    <div className="overflow-y-auto flex-1 p-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {filteredCountries.length > 0 ? (
                            filteredCountries.map((country) => (
                                <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => {
                                        onChange?.(country.code);
                                        setIsOpen(false);
                                        setSearch("");
                                    }}
                                    className={cn(
                                        "flex items-center w-full px-3 py-2.5 rounded-lg text-left transition-colors",
                                        "hover:bg-white/5 active:bg-white/10",
                                        value === country.code ? "bg-[#2F80ED]/10 text-[#2F80ED]" : "text-gray-300"
                                    )}
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <img
                                            src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                                            alt={country.name}
                                            className="w-6 h-4 rounded-sm object-cover shadow-sm"
                                        />
                                        <span className="text-sm font-medium truncate">{country.name}</span>
                                    </div>
                                    {value === country.code && <Check size={16} className="text-[#2F80ED] shrink-0" />}
                                </button>
                            ))
                        ) : (
                            <div className="p-4 text-center text-sm text-gray-500">No country found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
