"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { X, Send, Loader2, CheckCircle2, Shield, ChevronDown, Eye, EyeOff, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const brokerServers: Record<string, string[]> = {
    Exness: [
        "Exness-MT5Real",
        "Exness-MT5Real2",
        "Exness-MT5Real3",
        "Exness-MT5Real4",
        "Exness-MT5Real5",
        "Exness-MT5Real6",
        "Exness-MT5Real7",
        "Exness-MT5Real8",
        "Exness-MT5Real9",
        "Exness-MT5Real10",
        "Exness-MT5Real11",
        "Exness-MT5Real12",
        "Exness-MT5Real14",
        "Exness-MT5Real15",
        "Exness-MT5Real16",
        "Exness-MT5Real17",
        "Exness-MT5Real18",
        "Exness-MT5Real19",
        "Exness-MT5Real20",
        "Exness-MT5Real21",
        "Exness-MT5Real22",
        "Exness-MT5Real23",
        "Exness-MT5Real24",
        "Exness-MT5Real25",
        "Exness-MT5Real26",
        "Exness-MT5Real27",
        "Exness-MT5Real28",
        "Exness-MT5Real29",
        "Exness-MT5Real30",
        "Exness-MT5Real31",
        "Exness-MT5Real32",
        "Exness-MT5Real33",
        "Exness-MT5Real34",
        "Exness-MT5Real35",
        "Exness-MT5Real36",
        "Exness-MT5Real37",
        "Exness-MT5Real38",
        "Exness-MT5Real39",
        "Exness-MT5Real40",
        "Exness-MT5Real41",
    ],
    VTMarkets: [
        "VTMarkets-Live",
        "VTMarkets-Live 2",
        "VTMarkets-Live 3",
        "VTMarkets-Live 5",
        "VTMarkets-Live 6",
        "VTMarkets-Live 7",
        "VTMarkets-Live 8",
        "VTMarkets-Demo",
    ],
    Vantage: [
        "VantageInternational-Live",
        "VantageInternational-Live 2",
        "VantageInternational-Live 3",
        "VantageInternational-Live 4",
        "VantageInternational-Live 5",
        "VantageInternational-Live 6",
        "VantageInternational-Live 7",
        "VantageInternational-Live 8",
        "VantageInternational-Live 9",
        "VantageInternational-Live 10",
        "VantageInternational-Live 11",
        "VantageInternational-Live 12",
        "VantageInternational-Live 13",
        "VantageInternational-Live 15",
        "VantageInternational-Live 17",
        "VantageInternational-Demo",
    ],
};

const brokerOptions = [...Object.keys(brokerServers), "Any Broker"];
const OTHER_SERVER = "__OTHER__";

export function CopyTradingRegistrationModal({ isOpen, onClose }: Props) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [serverSearch, setServerSearch] = useState("");
    const [serverDropdownOpen, setServerDropdownOpen] = useState(false);
    const serverDropdownRef = useRef<HTMLDivElement>(null);
    const serverInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        telegramHandle: "",
        tradingCapital: "",
        brokerName: "",
        customBrokerName: "",
        mt5Server: "",
        customServer: "",
        mt5AccountNumber: "",
        masterPassword: "",
        message: "",
        termsAccepted: false,
    });

    const availableServers = useMemo(() => {
        return formData.brokerName ? brokerServers[formData.brokerName] || [] : [];
    }, [formData.brokerName]);

    const filteredServers = useMemo(() => {
        if (!serverSearch.trim()) return availableServers;
        return availableServers.filter(s =>
            s.toLowerCase().includes(serverSearch.toLowerCase())
        );
    }, [availableServers, serverSearch]);

    // Close server dropdown on click outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (serverDropdownRef.current && !serverDropdownRef.current.contains(e.target as Node)) {
                setServerDropdownOpen(false);
            }
        }
        if (serverDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [serverDropdownOpen]);

    if (!isOpen) return null;

    const isCustomBroker = formData.brokerName === "Any Broker";
    const isCustomServer = formData.mt5Server === OTHER_SERVER;

    const updateField = (field: string, value: string | boolean) => {
        setFormData((prev) => {
            const next = { ...prev, [field]: value };
            if (field === "brokerName") {
                next.mt5Server = "";
                next.customBrokerName = "";
                next.customServer = "";
            }
            return next;
        });
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/copy-trading/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Registration failed. Please try again.");
                return;
            }

            setIsSuccess(true);
            toast.success("Registration submitted successfully!");
        } catch (error) {
            toast.error("Network error. Please check your connection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const canSubmit =
        formData.fullName &&
        formData.email &&
        formData.telegramHandle &&
        formData.tradingCapital &&
        formData.brokerName &&
        (isCustomBroker ? formData.customBrokerName && formData.customServer : (isCustomServer ? formData.customServer : formData.mt5Server)) &&
        formData.mt5AccountNumber &&
        formData.termsAccepted;

    const inputClass = "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/5 text-sm text-gray-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-[#1A1D27] rounded-2xl border border-gray-200 dark:border-white/[0.06] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-[#1A1D27] z-10 flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/5 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <Shield size={20} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-700 dark:text-white">Register for Copy Trading</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">PVSR Capital Partnership</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500">
                        <X size={18} />
                    </Button>
                </div>

                {isSuccess ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={32} className="text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">Registration Submitted!</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Our team will review your application and contact you via Telegram within 24 hours to complete the setup.
                        </p>
                        <Button onClick={onClose} className="bg-primary hover:bg-primary/90 text-white font-bold px-6 rounded-xl">
                            Done
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Step Indicator */}
                        <div className="flex items-center gap-2 px-5 pt-4">
                            <div className={`flex-1 h-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-gray-200 dark:bg-white/10"}`} />
                            <div className={`flex-1 h-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-gray-200 dark:bg-white/10"}`} />
                        </div>

                        <div className="p-5 space-y-4">
                            {step === 1 && (
                                <>
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Step 1 — Personal Information</p>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Full Name *</label>
                                        <input type="text" value={formData.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder="John Doe" className={inputClass} />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Email Address *</label>
                                        <input type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} placeholder="john@example.com" className={inputClass} />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Telegram Username *</label>
                                        <input type="text" value={formData.telegramHandle} onChange={(e) => updateField("telegramHandle", e.target.value)} placeholder="@yourusername" className={inputClass} />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Preferred Trading Capital ($) *</label>
                                        <input type="number" value={formData.tradingCapital} onChange={(e) => updateField("tradingCapital", e.target.value)} placeholder="e.g., 1000" className={inputClass} />
                                    </div>

                                    <Button
                                        onClick={() => setStep(2)}
                                        disabled={!formData.fullName || !formData.email || !formData.telegramHandle || !formData.tradingCapital}
                                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl disabled:opacity-50"
                                    >
                                        Next — MT5 Details
                                    </Button>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Step 2 — MT5 Account Details</p>

                                    {/* Broker Selection */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Broker *</label>
                                        <DropdownMenu className="w-full block">
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full flex justify-between items-center text-sm font-normal bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/[0.06] px-4 py-2.5 h-auto text-left shadow-none rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
                                                    <span className={formData.brokerName ? "text-gray-700 dark:text-gray-100 truncate pr-2" : "text-gray-400 truncate pr-2"}>
                                                        {formData.brokerName || "Select your broker"}
                                                    </span>
                                                    <ChevronDown size={16} className="text-gray-500 shrink-0" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="min-w-[200px] max-h-[300px] overflow-y-auto">
                                                <DropdownMenuItem onClick={() => updateField("brokerName", "")}>Select your broker</DropdownMenuItem>
                                                {brokerOptions.map((broker) => (
                                                    <DropdownMenuItem key={broker} onClick={() => updateField("brokerName", broker)}>{broker}</DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Custom Broker Name — only for Any Broker */}
                                    {isCustomBroker && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Broker Name *</label>
                                            <input type="text" value={formData.customBrokerName} onChange={(e) => updateField("customBrokerName", e.target.value)} placeholder="e.g., ICMarkets, Pepperstone..." className={inputClass} />
                                        </div>
                                    )}

                                    {/* Server Selection — Searchable */}
                                    {formData.brokerName && !isCustomBroker && (
                                        <div ref={serverDropdownRef} className="relative">
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">MT5 Server *</label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setServerDropdownOpen(!serverDropdownOpen);
                                                    setServerSearch("");
                                                    setTimeout(() => serverInputRef.current?.focus(), 50);
                                                }}
                                                className="w-full flex justify-between items-center text-sm font-normal bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/[0.06] px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-left"
                                            >
                                                <span className={formData.mt5Server ? "text-gray-700 dark:text-gray-100 truncate pr-2" : "text-gray-400 truncate pr-2"}>
                                                    {formData.mt5Server === OTHER_SERVER ? "Other (type manually)" : formData.mt5Server || "Select server"}
                                                </span>
                                                <ChevronDown size={16} className={`text-gray-500 shrink-0 transition-transform ${serverDropdownOpen ? "rotate-180" : ""}`} />
                                            </button>

                                            {serverDropdownOpen && (
                                                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden">
                                                    {/* Search input */}
                                                    <div className="p-2 border-b border-gray-100 dark:border-white/5">
                                                        <div className="relative">
                                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                            <input
                                                                ref={serverInputRef}
                                                                type="text"
                                                                value={serverSearch}
                                                                onChange={(e) => setServerSearch(e.target.value)}
                                                                placeholder="Search server..."
                                                                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/[0.06] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-gray-700 dark:text-white placeholder-gray-400"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Options list */}
                                                    <div className="max-h-[220px] overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                                                        {filteredServers.length === 0 && !serverSearch.trim() ? (
                                                            <div className="px-4 py-3 text-xs text-gray-400 text-center">No servers available</div>
                                                        ) : (
                                                            <>
                                                                {filteredServers.map((server) => (
                                                                    <button
                                                                        key={server}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            updateField("mt5Server", server);
                                                                            updateField("customServer", "");
                                                                            setServerDropdownOpen(false);
                                                                            setServerSearch("");
                                                                        }}
                                                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-white/5 transition-colors ${
                                                                            formData.mt5Server === server
                                                                                ? "text-primary font-bold bg-primary/5"
                                                                                : "text-gray-700 dark:text-gray-300"
                                                                        }`}
                                                                    >
                                                                        {server}
                                                                    </button>
                                                                ))}
                                                                {filteredServers.length === 0 && serverSearch.trim() && (
                                                                    <div className="px-4 py-2 text-xs text-gray-400 text-center">No match found</div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                    {/* Other option — always visible (outside scroll) */}
                                                    <div className="border-t border-gray-100 dark:border-white/5">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                updateField("mt5Server", OTHER_SERVER);
                                                                setServerDropdownOpen(false);
                                                                setServerSearch("");
                                                            }}
                                                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-white/5 transition-colors ${
                                                                formData.mt5Server === OTHER_SERVER
                                                                    ? "text-primary font-bold bg-primary/5"
                                                                    : "text-gray-500 dark:text-gray-400 italic"
                                                            }`}
                                                        >
                                                            Other (type manually)
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Custom Server input — when 'Other' selected from dropdown */}
                                    {!isCustomBroker && isCustomServer && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Server Name *</label>
                                            <input type="text" value={formData.customServer} onChange={(e) => updateField("customServer", e.target.value)} placeholder="e.g., Exness-MT5Real42" className={inputClass} autoFocus />
                                        </div>
                                    )}

                                    {/* Custom Server Name — only for Any Broker */}
                                    {isCustomBroker && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">MT5 Server Name *</label>
                                            <input type="text" value={formData.customServer} onChange={(e) => updateField("customServer", e.target.value)} placeholder="e.g., ICMarketsSC-MT5-2" className={inputClass} />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">MT5 Account Number *</label>
                                        <input type="text" inputMode="numeric" pattern="[0-9]*" value={formData.mt5AccountNumber} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); updateField("mt5AccountNumber", v); }} placeholder="52629080" className={inputClass} />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Master Password <span className="text-gray-400 font-normal">(Optional)</span></label>
                                        <div className="relative">
                                            <input type={showPassword ? "text" : "password"} value={formData.masterPassword} onChange={(e) => updateField("masterPassword", e.target.value)} placeholder="Enter your MT5 master password" className={`${inputClass} pr-10`} />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" tabIndex={-1}>
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Message <span className="text-gray-400 font-normal">(Optional)</span></label>
                                        <textarea value={formData.message} onChange={(e) => updateField("message", e.target.value)} placeholder="Any notes or special requests..." rows={2} className={`${inputClass} resize-none`} />
                                    </div>

                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input type="checkbox" checked={formData.termsAccepted} onChange={(e) => updateField("termsAccepted", e.target.checked)} className="mt-1 rounded border-gray-300 text-primary focus:ring-primary" />
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            I understand that trading involves significant risk. I agree to PVSR Capital's terms of service and acknowledge that past performance is not indicative of future results.
                                        </span>
                                    </label>

                                    <div className="flex gap-3">
                                        <Button variant="outline" onClick={() => setStep(1)} className="flex-1 font-bold py-3 rounded-xl">
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={!canSubmit || isSubmitting}
                                            className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                                            ) : (
                                                <><Send size={16} /> Submit Registration</>
                                            )}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer Note */}
                        <div className="px-5 pb-5">
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                                <Shield size={14} className="text-blue-500 shrink-0" />
                                <span className="text-[11px] text-blue-600 dark:text-blue-400">
                                    Your data is encrypted. Master password can be provided later via Telegram after approval.
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
