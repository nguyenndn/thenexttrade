"use client";

import { useState, useEffect } from "react";
import {
    TrendingUp,
    DollarSign,
    BarChart3,
    ArrowUpRight,
    AlertTriangle,
    Copy,
    ArrowRight,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CopyTradingRegistrationModal } from "./CopyTradingRegistrationModal";

type Registration = {
    id: string;
    fullName: string;
    email: string;
    telegramHandle: string | null;
    brokerName: string;
    customBrokerName: string | null;
    mt5Server: string | null;
    customServer: string | null;
    mt5AccountNumber: string;
    tradingCapital: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    rejectReason: string | null;
    createdAt: string;
};

const statusDisplay = {
    PENDING: { label: "Pending Review", color: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20", icon: Clock },
    APPROVED: { label: "Approved", color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20", icon: CheckCircle2 },
    REJECTED: { label: "Rejected", color: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20", icon: XCircle },
};

export function CopyTradingMyAccount() {
    const [showRegistration, setShowRegistration] = useState(false);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const fetchRegistrations = async () => {
        try {
            const res = await fetch("/api/copy-trading/my-registrations");
            if (res.ok) {
                const data = await res.json();
                setRegistrations(data.registrations || []);
            }
        } catch {
            // silently fail
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegistrationSuccess = () => {
        setShowRegistration(false);
        fetchRegistrations();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    if (registrations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
                    <Copy size={28} className="text-gray-300 dark:text-gray-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 dark:text-white mb-1">No Copy Trading Account</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 text-center max-w-md">
                    Connect your MT5 account to start receiving institutional-grade trade signals from PVSR Capital.
                </p>
                <Button
                    onClick={() => setShowRegistration(true)}
                    className="bg-primary hover:bg-primary/90 text-white font-bold px-5 py-2.5 rounded-lg text-sm flex items-center gap-1.5"
                >
                    Register Now <ArrowRight size={14} />
                </Button>

                <CopyTradingRegistrationModal
                    isOpen={showRegistration}
                    onClose={() => { setShowRegistration(false); fetchRegistrations(); }}
                />
            </div>
        );
    }

    // Show registrations
    return (
        <div className="space-y-4">
            {registrations.map((reg) => {
                const sd = statusDisplay[reg.status];
                const broker = reg.brokerName === "Any Broker" ? (reg.customBrokerName || "Custom Broker") : reg.brokerName;
                const server = reg.brokerName === "Any Broker" ? (reg.customServer || "—") : (reg.mt5Server || "—");

                return (
                    <div key={reg.id} className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/[0.06] p-5">
                        {/* Status Banner */}
                        <div className={`rounded-lg px-3 py-2 mb-4 flex items-center gap-2 border ${sd.color}`}>
                            <sd.icon size={14} />
                            <span className="text-xs font-bold">{sd.label}</span>
                            {reg.status === "PENDING" && (
                                <span className="text-[12px] ml-auto opacity-70">Your registration is being reviewed by our team</span>
                            )}
                            {reg.status === "REJECTED" && reg.rejectReason && (
                                <span className="text-[12px] ml-auto">Reason: {reg.rejectReason}</span>
                            )}
                        </div>

                        {/* Account Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Broker</span>
                                <p className="text-sm font-bold text-gray-700 dark:text-white mt-0.5">{broker}</p>
                            </div>
                            <div>
                                <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">MT5 Account</span>
                                <p className="text-sm font-bold text-gray-700 dark:text-white mt-0.5 font-mono">{reg.mt5AccountNumber}</p>
                            </div>
                            <div>
                                <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Server</span>
                                <p className="text-sm font-bold text-gray-700 dark:text-white mt-0.5">{server}</p>
                            </div>
                            <div>
                                <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Capital</span>
                                <p className="text-sm font-bold text-gray-700 dark:text-white mt-0.5">${reg.tradingCapital.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Submitted Date */}
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                            <span className="text-[12px] text-gray-400">
                                Submitted {new Date(reg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            {reg.status === "APPROVED" && (
                                <span className="text-[12px] text-primary font-bold flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    Awaiting connection
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Allow additional registration */}
            <div className="flex justify-center pt-2">
                <Button
                    variant="outline"
                    onClick={() => setShowRegistration(true)}
                    className="text-xs font-bold"
                >
                    Register Another Account <ArrowRight size={12} className="ml-1" />
                </Button>
            </div>

            <CopyTradingRegistrationModal
                isOpen={showRegistration}
                onClose={() => { setShowRegistration(false); fetchRegistrations(); }}
            />
        </div>
    );
}
