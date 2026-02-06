"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, ChevronDown, Check } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export interface TimezoneOption {
    label: string;
    value: string; // IANA timezone string e.g., "Asia/Bangkok"
    offsetDisplay: string;
}

export const ALL_TIMEZONES: TimezoneOption[] = [
    { label: "Midway (GMT -11)", value: "Pacific/Midway", offsetDisplay: "GMT -11" },
    { label: "Hawaii (GMT -10)", value: "Pacific/Honolulu", offsetDisplay: "GMT -10" },
    { label: "Alaska (GMT -9)", value: "America/Anchorage", offsetDisplay: "GMT -9" },
    { label: "Los Angeles (GMT -8)", value: "America/Los_Angeles", offsetDisplay: "GMT -8" }, // PST
    { label: "Denver (GMT -7)", value: "America/Denver", offsetDisplay: "GMT -7" }, // MST
    { label: "Chicago (GMT -6)", value: "America/Chicago", offsetDisplay: "GMT -6" }, // CST
    { label: "New York (GMT -5)", value: "America/New_York", offsetDisplay: "GMT -5" }, // EST
    { label: "Puerto Rico (GMT -4)", value: "America/Puerto_Rico", offsetDisplay: "GMT -4" },
    { label: "Sao Paulo (GMT -3)", value: "America/Sao_Paulo", offsetDisplay: "GMT -3" },
    { label: "South Georgia (GMT -2)", value: "Atlantic/South_Georgia", offsetDisplay: "GMT -2" },
    { label: "Azores (GMT -1)", value: "Atlantic/Azores", offsetDisplay: "GMT -1" },
    { label: "London (GMT +0)", value: "Europe/London", offsetDisplay: "GMT +0" }, // GMT/BST
    { label: "Paris (GMT +1)", value: "Europe/Paris", offsetDisplay: "GMT +1" }, // CET
    { label: "Cairo (GMT +2)", value: "Africa/Cairo", offsetDisplay: "GMT +2" },
    { label: "Moscow (GMT +3)", value: "Europe/Moscow", offsetDisplay: "GMT +3" },
    { label: "Tehran (GMT +3:30)", value: "Asia/Tehran", offsetDisplay: "GMT +3:30" },
    { label: "Dubai (GMT +4)", value: "Asia/Dubai", offsetDisplay: "GMT +4" },
    { label: "Kabul (GMT +4:30)", value: "Asia/Kabul", offsetDisplay: "GMT +4:30" },
    { label: "Karachi (GMT +5)", value: "Asia/Karachi", offsetDisplay: "GMT +5" },
    { label: "Mumbai (GMT +5:30)", value: "Asia/Kolkata", offsetDisplay: "GMT +5:30" },
    { label: "Kathmandu (GMT +5:45)", value: "Asia/Kathmandu", offsetDisplay: "GMT +5:45" },
    { label: "Dhaka (GMT +6)", value: "Asia/Dhaka", offsetDisplay: "GMT +6" },
    { label: "Yangon (GMT +6:30)", value: "Asia/Yangon", offsetDisplay: "GMT +6:30" },
    { label: "Bangkok (GMT +7)", value: "Asia/Bangkok", offsetDisplay: "GMT +7" },
    { label: "Singapore (GMT +8)", value: "Asia/Singapore", offsetDisplay: "GMT +8" },
    { label: "Tokyo (GMT +9)", value: "Asia/Tokyo", offsetDisplay: "GMT +9" },
    { label: "Darwin (GMT +9:30)", value: "Australia/Darwin", offsetDisplay: "GMT +9:30" },
    { label: "Sydney (GMT +10)", value: "Australia/Sydney", offsetDisplay: "GMT +10" },
    { label: "Adelaide (GMT +10:30)", value: "Australia/Adelaide", offsetDisplay: "GMT +10:30" },
    { label: "Solomon Is. (GMT +11)", value: "Pacific/Guadalcanal", offsetDisplay: "GMT +11" },
    { label: "Fiji (GMT +12)", value: "Pacific/Fiji", offsetDisplay: "GMT +12" },
    { label: "Auckland (GMT +13)", value: "Pacific/Auckland", offsetDisplay: "GMT +13" },
    { label: "Kiritimati (GMT +14)", value: "Pacific/Kiritimati", offsetDisplay: "GMT +14" },
];

interface TimezoneSelectorProps {
    value?: string;
    onChange?: (value: string) => void;
}

export function TimezoneSelector({ value, onChange }: TimezoneSelectorProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [isOpen, setIsOpen] = useState(false);

    // Default to Bangkok if no value provided
    const defaultZone = ALL_TIMEZONES.find(z => z.value === "Asia/Bangkok") || ALL_TIMEZONES[0];
    const selectedZone = ALL_TIMEZONES.find(z => z.value === value) || defaultZone;

    const [currentTime, setCurrentTime] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Update time every second
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            try {
                const timeString = new Intl.DateTimeFormat("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: selectedZone.value,
                    hour12: false
                }).format(now);
                setCurrentTime(timeString);
            } catch (e) {
                setCurrentTime("--:--");
            }
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [selectedZone]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (zone: TimezoneOption) => {
        if (onChange) {
            onChange(zone.value); // Pass the IANA string back
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${isDark
                    ? 'bg-slate-800 border-slate-700 hover:border-slate-600 text-gray-200'
                    : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
            >
                <Clock size={16} className="text-gray-400" />
                <span className="text-xs font-medium">
                    <span className="opacity-70 hidden sm:inline">Time: </span>
                    <span className="opacity-70">({selectedZone.offsetDisplay})</span>
                    <span className="ml-1 font-bold text-cyan-500">{currentTime}</span>
                </span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-xl border overflow-hidden z-50 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                    }`}>
                    <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b ${isDark ? 'bg-slate-900/50 text-gray-400 border-slate-700' : 'bg-gray-50 text-gray-500 border-gray-100'
                        }`}>
                        Select Timezone
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {ALL_TIMEZONES.map((zone) => (
                            <button
                                key={zone.label}
                                onClick={() => handleSelect(zone)}
                                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${isDark
                                    ? 'hover:bg-slate-700 text-gray-300'
                                    : 'hover:bg-gray-50 text-gray-700'
                                    } ${selectedZone.value === zone.value ? (isDark ? 'bg-slate-700/50' : 'bg-cyan-50/50') : ''}`}
                            >
                                <div className="flex flex-col items-start text-left">
                                    <span className={`font-medium ${selectedZone.label === zone.label ? 'text-cyan-500' : ''}`}>{zone.label}</span>
                                    <span className="text-xs opacity-50">{zone.offsetDisplay}</span>
                                </div>
                                {selectedZone.value === zone.value && <Check size={16} className="text-cyan-500" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

