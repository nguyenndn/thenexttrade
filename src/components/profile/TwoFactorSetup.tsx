"use client";

import { useState } from "react";
import { startTwoFactorSetup, verifyTwoFactorSetup, disableTwoFactor } from "@/app/dashboard/settings/account/actions";
import { toast } from "sonner";
import { Shield, CheckCircle, Loader2, Copy, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

interface TwoFactorSetupProps {
    isEnabled: boolean;
    onUpdate: () => void;
}

export function TwoFactorSetup({ isEnabled, onUpdate }: TwoFactorSetupProps) {
    const [step, setStep] = useState<'idle' | 'setup' | 'disable-verify'>('idle');
    const [factorId, setFactorId] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [code, setCode] = useState('');
    const [disableCode, setDisableCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleStart = async () => {
        setLoading(true);
        const res = await startTwoFactorSetup();
        setLoading(false);

        if (res.error) {
            toast.error(res.error);
            return;
        }

        if (res.data) {
            setFactorId(res.data.id);
            setQrCode(res.data.qr);
            setSecret(res.data.secret);
            setStep('setup');
        }
    };

    const handleVerify = async () => {
        if (!code) return toast.error("Please enter the verification code");

        setLoading(true);
        const res = await verifyTwoFactorSetup(factorId, code);
        setLoading(false);

        if (res.error) {
            toast.error(res.error);
            return;
        }

        toast.success("Two-Factor Authentication Enabled!");
        setStep('idle');
        setCode('');
        onUpdate();
    };

    const handleDisableClick = () => {
        setStep('disable-verify');
    };

    const confirmDisable = async () => {
        setLoading(true);
        const res = await disableTwoFactor(disableCode);
        setLoading(false);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Two-Factor Authentication Disabled");
            setStep('idle');
            setDisableCode('');
            onUpdate();
        }
    };

    if (isEnabled) {
        return (
            <div>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                            <Shield size={24} className="text-green-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-700 dark:text-white">Two-Factor Authentication (2FA)</h2>
                            <p className="text-gray-600 text-sm">Your account is secured with an extra layer of protection.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold rounded-full flex items-center gap-1">
                            <CheckCircle size={12} /> Enabled
                        </div>
                    </div>
                </div>

                {step !== 'disable-verify' && (
                    <div className="mt-6 flex justify-end">
                        <Button
                            variant="outline"
                            onClick={handleDisableClick}
                            disabled={loading}
                            className="px-6 py-2 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                            Disable 2FA
                        </Button>
                    </div>
                )}

                {step === 'disable-verify' && (
                    <div className="mt-6 bg-red-50 dark:bg-white/5 rounded-xl p-6 border border-red-200 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="font-bold text-gray-700 dark:text-white mb-4">Verify to Disable 2FA</h3>
                        <p className="text-sm text-gray-600 mb-4">Please enter your 2FA code to confirm disabling this security feature.</p>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={disableCode}
                                onChange={(e) => setDisableCode(e.target.value)}
                                placeholder="123456"
                                maxLength={6}
                                className="w-full max-w-[200px] px-4 py-2 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-red-500 font-mono text-center tracking-widest text-lg"
                            />
                            <Button
                                variant="destructive"
                                onClick={confirmDisable}
                                disabled={loading || disableCode.length < 6}
                                className="px-6 py-2"
                            >
                                {loading && <Loader2 size={20} className="animate-spin" />}
                                {!loading && "Confirm Disable"}
                            </Button>
                        </div>
                        <Button variant="link" onClick={() => setStep('idle')} className="text-sm text-gray-600 underline decoration-dotted mt-4">
                            Cancel
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                        <Shield size={24} className="text-gray-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-700 dark:text-white">Two-Factor Authentication (2FA)</h2>
                        <p className="text-gray-600 text-sm">Add an extra layer of security to your account.</p>
                    </div>
                </div>
                {!step || step === 'idle' ? (
                    <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-xs font-bold rounded-full flex items-center gap-1">
                        <AlertTriangle size={12} /> Disabled
                    </div>
                ) : null}
            </div>

            {step === 'idle' && (
                <div className="mt-6 flex justify-end">
                    <Button
                        onClick={handleStart}
                        isLoading={loading}
                        className="px-6 py-2 w-auto"
                    >
                        Setup 2FA
                    </Button>
                </div>
            )}

            {step === 'setup' && (
                <div className="mt-6 bg-gray-50 dark:bg-white/5 rounded-xl p-6 border border-gray-200 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
                    <h3 className="font-bold text-gray-700 dark:text-white mb-4">Scan QR Code</h3>
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 dark:border-white/10 w-fit mx-auto md:mx-0">
                            {/* Supabase returns SVG string usually, need to verify format. 
                                Assuming data URI `data:image/svg+xml;base64,...` or raw SVG.
                                If raw SVG, need dangerouslySetInnerHTML.
                                If URI, use img.
                                Typically `data.totp.qr_code` is a DATA URI.
                            */}
                            {qrCode.startsWith('data:') ? (
                                <img src={qrCode} alt="QR Code" width={160} height={160} />
                            ) : (
                                <div className="w-40 h-40 bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                                    QR Not Displayable
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-600 mb-1 block">Manual Entry Code</label>
                                <div className="flex items-center gap-2">
                                    <code className="bg-gray-200 dark:bg-black/30 px-3 py-1.5 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200 tracking-wider">
                                        {secret}
                                    </code>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            navigator.clipboard.writeText(secret);
                                            toast.success("Copied to clipboard");
                                        }}
                                        className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-gray-600 dark:text-gray-300"
                                    >
                                        <Copy size={14} />
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-gray-700 dark:text-white mb-2 block">Enter Verification Code</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="123456"
                                        maxLength={6}
                                        className="w-full max-w-[200px] px-4 py-2 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-primary font-mono text-center tracking-widest text-lg"
                                    />
                                    <Button
                                        onClick={handleVerify}
                                        disabled={loading || code.length < 6}
                                        className="px-6 py-2"
                                    >
                                        {loading && <Loader2 size={20} className="animate-spin" />}
                                        {!loading && "Verify"}
                                    </Button>
                                </div>
                            </div>

                            <Button variant="link" onClick={() => setStep('idle')} className="text-sm text-gray-600 underline decoration-dotted px-0 justify-start">
                                Cancel Setup
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
