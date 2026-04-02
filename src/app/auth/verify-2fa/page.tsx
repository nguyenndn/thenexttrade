"use client";

import { useState } from "react";
import { verifyLogin2FA } from "@/app/auth/actions";
import { Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export default function Verify2FAPage() {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length < 6) return;

        setLoading(true);
        const res = await verifyLogin2FA(code);

        if (res?.error) {
            toast.error(res.error);
            setLoading(false);
        }
        // Success will redirect automatically by server action
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0B0E14] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.3] pointer-events-none"></div>

            <div className="w-full max-w-[400px] p-8 rounded-xl border border-white/10 bg-[#ffffff0d] backdrop-blur-sm relative z-10 mx-4">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6 ring-1 ring-primary/30">
                        <Shield size={32} className="text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Two-Factor Authentication</h1>
                    <p className="text-gray-500 text-sm">
                        Enter the 6-digit code from your authenticator app to continue.
                    </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-6">
                    <div>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                            maxLength={6}
                            autoFocus
                            placeholder="000000"
                            className="w-full h-16 text-center text-3xl font-bold tracking-[0.5em] bg-[#0B0E14] border border-white/10 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-white placeholder:text-gray-700 transition-all outline-none"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading || code.length < 6}
                        variant="primary"
                        className="w-full h-12 font-bold text-lg rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={24} className="animate-spin" /> : "Verify Identity"}
                    </Button>
                </form>

                <Button variant="ghost" onClick={() => window.location.href = '/auth/login'} className="w-full text-center mt-6 text-sm text-gray-600 hover:text-white transition-colors hover:bg-transparent">
                    Back to Login
                </Button>
            </div>
        </div>
    );
}
