"use client";

import { useState, useEffect, useTransition } from "react";
import {
    Mail,
    Send,
    X,
    Loader2,
    Monitor,
    Smartphone,
    Sparkles,
    ShieldCheck,
    Users,
    Crown,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { toast } from "sonner";
import {
    previewReleaseAnnouncement,
    getReleaseAudienceSummary,
    sendReleaseAnnouncementBroadcast,
    type ReleaseAnnouncementInput,
} from "@/app/admin/trading-systems/actions";

interface ReleaseAnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: {
        id: string;
        name: string;
        version: string;
        slug: string;
        changelog?: string | null;
    };
}

export function ReleaseAnnouncementModal({
    isOpen,
    onClose,
    product,
}: ReleaseAnnouncementModalProps) {
    const [version, setVersion] = useState(product.version || "1.0.0");
    const [subject, setSubject] = useState(
        `Update Available: ${product.name} v${product.version || "1.0.0"} 🚀`
    );
    const [rawHighlights, setRawHighlights] = useState(
        product.changelog ||
            "Auto High-Impact News Spread Protector\nMulti-Timeframe Order Block Confluence\nSmart Trailing Stop v2\nOptimized MQL5 execution latency under 2ms"
    );
    const [licenseNote, setLicenseNote] = useState(
        "Your existing lifetime license key remains valid. Simply replace the old .ex5 file on your MT5 terminal and restart the chart."
    );
    const [targetAudience, setTargetAudience] = useState<
        "ACTIVE_HOLDERS" | "PRO_TRADERS" | "ALL_USERS"
    >("ACTIVE_HOLDERS");
    const [testRecipient, setTestRecipient] = useState("");
    const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
    const [previewHtml, setPreviewHtml] = useState<string>("");
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [isSendingTest, setIsSendingTest] = useState(false);
    const [isBroadcasting, startBroadcasting] = useTransition();
    const [audienceCounts, setAudienceCounts] = useState<{
        ACTIVE_HOLDERS: number;
        PRO_TRADERS: number;
        ALL_USERS: number;
    }>({
        ACTIVE_HOLDERS: 0,
        PRO_TRADERS: 0,
        ALL_USERS: 0,
    });

    // Update subject automatically when version changes
    useEffect(() => {
        setSubject(`Update Available: ${product.name} v${version} 🚀`);
    }, [version, product.name]);

    // Fetch audience count on mount
    useEffect(() => {
        if (!isOpen) return;
        getReleaseAudienceSummary(product.id).then((res) => {
            if (res.success && res.counts) {
                setAudienceCounts(res.counts);
            }
        });
    }, [isOpen, product.id]);

    // Update live preview with debounce
    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(() => {
            fetchPreview();
        }, 300);
        return () => clearTimeout(timer);
    }, [isOpen, version, subject, rawHighlights, licenseNote, product.id]);

    const getHighlightsArray = () => {
        return rawHighlights
            .split("\n")
            .map((s) => s.replace(/^[-*•\s]+/, "").trim())
            .filter((s) => s.length > 0);
    };

    const fetchPreview = async () => {
        setIsLoadingPreview(true);
        try {
            const res = await previewReleaseAnnouncement({
                productId: product.id,
                version,
                subject,
                releaseNotes: getHighlightsArray(),
                licenseNote,
            });
            if (res.success && res.html) {
                setPreviewHtml(res.html);
            }
        } catch (err) {
            console.error("Preview render failed:", err);
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleSendTest = async () => {
        if (!testRecipient || !testRecipient.includes("@")) {
            toast.error("Please enter a valid test recipient email address.");
            return;
        }

        setIsSendingTest(true);
        try {
            const res = await sendReleaseAnnouncementBroadcast({
                productId: product.id,
                version,
                subject,
                releaseNotes: getHighlightsArray(),
                licenseNote,
                targetAudience,
                isTest: true,
                testRecipient,
            });

            if (res.success) {
                toast.success(res.message || "Test email sent successfully!");
            } else {
                toast.error(res.error || "Failed to send test email");
            }
        } catch (error: any) {
            toast.error(error?.message || "Test email delivery failed");
        } finally {
            setIsSendingTest(false);
        }
    };

    const handleLaunchBroadcast = () => {
        const count = audienceCounts[targetAudience] || 0;
        const confirmMsg = `Are you sure you want to broadcast this release update email to all ${count} traders in the "${targetAudience.replace("_", " ")}" group?`;

        if (!window.confirm(confirmMsg)) {
            return;
        }

        startBroadcasting(async () => {
            try {
                const res = await sendReleaseAnnouncementBroadcast({
                    productId: product.id,
                    version,
                    subject,
                    releaseNotes: getHighlightsArray(),
                    licenseNote,
                    targetAudience,
                    isTest: false,
                });

                if (res.success) {
                    toast.success(res.message);
                    onClose();
                } else {
                    toast.error(res.error || "Failed to broadcast announcement");
                }
            } catch (error: any) {
                toast.error(error?.message || "Broadcast failed");
            }
        });
    };

    if (!isOpen) return null;

    const currentCount = audienceCounts[targetAudience] || 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-7xl h-[95vh] max-h-[960px] flex flex-col bg-white dark:bg-[#121624] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Modal Header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-gray-50/75 dark:bg-[#181E32]/75">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                            <Sparkles size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                    Release Announcement Studio
                                </h3>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    {product.name}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Craft, customize, and broadcast update emails to your traders.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Viewport Switcher */}
                        <div className="flex items-center p-1 bg-gray-200/70 dark:bg-white/5 rounded-xl border border-gray-300/60 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => setViewMode("desktop")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    viewMode === "desktop"
                                        ? "bg-white dark:bg-[#0C0F1B] text-amber-500 shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                }`}
                                aria-label="Desktop Preview"
                            >
                                <Monitor size={14} />
                                <span>Desktop</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("mobile")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    viewMode === "mobile"
                                        ? "bg-white dark:bg-[#0C0F1B] text-amber-500 shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                }`}
                                aria-label="Mobile Preview"
                            >
                                <Smartphone size={14} />
                                <span>Mobile</span>
                            </button>
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={onClose}
                            className="rounded-xl h-9 w-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                            aria-label="Close Modal"
                        >
                            <X size={18} />
                        </Button>
                    </div>
                </div>

                {/* ── Modal Body: 2-Column Split (Editor & Live Preview) ── */}
                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-white/10">
                    {/* Left Column: Form Controls (lg:col-span-5) */}
                    <div className="lg:col-span-5 h-full overflow-y-auto p-5 sm:p-6 space-y-5 bg-white dark:bg-[#121624]">
                        {/* 1. Target Audience Selection */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                🎯 Target Audience
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                <div
                                    onClick={() => setTargetAudience("ACTIVE_HOLDERS")}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                        targetAudience === "ACTIVE_HOLDERS"
                                            ? "border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10 text-amber-500"
                                            : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <ShieldCheck size={16} className={targetAudience === "ACTIVE_HOLDERS" ? "text-amber-500" : "text-gray-400"} />
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-gray-800 dark:text-white truncate">
                                                Active EA Holders
                                            </p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                                Traders with active licenses for this EA
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                        {audienceCounts.ACTIVE_HOLDERS} users
                                    </span>
                                </div>

                                <div
                                    onClick={() => setTargetAudience("PRO_TRADERS")}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                        targetAudience === "PRO_TRADERS"
                                            ? "border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10 text-amber-500"
                                            : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Crown size={16} className={targetAudience === "PRO_TRADERS" ? "text-amber-500" : "text-gray-400"} />
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-gray-800 dark:text-white truncate">
                                                All Pro Members
                                            </p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                                Users with active Pro membership
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                        {audienceCounts.PRO_TRADERS} users
                                    </span>
                                </div>

                                <div
                                    onClick={() => setTargetAudience("ALL_USERS")}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                        targetAudience === "ALL_USERS"
                                            ? "border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10 text-amber-500"
                                            : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Users size={16} className={targetAudience === "ALL_USERS" ? "text-amber-500" : "text-gray-400"} />
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-gray-800 dark:text-white truncate">
                                                All Community Users
                                            </p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                                General announcement to everyone
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                                        {audienceCounts.ALL_USERS} users
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Version & Subject */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-1 space-y-1.5">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-200">
                                    Version
                                </label>
                                <PremiumInput
                                    value={version}
                                    onChange={(e) => setVersion(e.target.value)}
                                    placeholder="2.5.0"
                                    className="h-9 text-xs font-mono font-bold"
                                />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-200">
                                    Email Subject
                                </label>
                                <PremiumInput
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Update Available: ..."
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>

                        {/* 3. Release Highlights */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-200">
                                    What's New (One feature per line)
                                </label>
                                <span className="text-[11px] text-gray-400">
                                    {getHighlightsArray().length} bullet points
                                </span>
                            </div>
                            <textarea
                                value={rawHighlights}
                                onChange={(e) => setRawHighlights(e.target.value)}
                                rows={4}
                                placeholder="Enter features (one per line)..."
                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 p-3 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-sans leading-relaxed resize-none"
                            />
                        </div>

                        {/* 4. License Notice */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-200">
                                License & Upgrade Notice
                            </label>
                            <textarea
                                value={licenseNote}
                                onChange={(e) => setLicenseNote(e.target.value)}
                                rows={2}
                                placeholder="Instructions regarding license key..."
                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 p-3 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-sans leading-relaxed resize-none"
                            />
                        </div>

                        {/* 5. Test Send Box */}
                        <div className="p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                                <Mail size={14} />
                                <span>Send Test Email First</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <PremiumInput
                                    value={testRecipient}
                                    onChange={(e) => setTestRecipient(e.target.value)}
                                    placeholder="Enter your email to test..."
                                    className="h-8 text-xs flex-1 bg-white dark:bg-[#0C0F1B]"
                                />
                                <Button
                                    onClick={handleSendTest}
                                    disabled={isSendingTest}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs font-semibold shrink-0"
                                >
                                    {isSendingTest ? (
                                        <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                        <Send size={13} />
                                    )}
                                    <span>Send Test</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Live Viewport Preview (lg:col-span-7) */}
                    <div className="lg:col-span-7 h-full flex flex-col bg-gray-100 dark:bg-[#080B14] p-4 sm:p-6 overflow-hidden">
                        <div
                            className={`transition-all duration-300 bg-white rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden h-full flex flex-col mx-auto ${
                                viewMode === "desktop"
                                    ? "w-full max-w-[700px]"
                                    : "w-[390px] max-w-full"
                            }`}
                        >
                            {isLoadingPreview ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400">
                                    <Loader2 size={24} className="animate-spin text-amber-500" />
                                    <span className="text-xs">Rendering live email preview...</span>
                                </div>
                            ) : (
                                <iframe
                                    title="Release Announcement Preview"
                                    srcDoc={previewHtml}
                                    className="w-full h-full flex-1 border-none bg-white"
                                    sandbox="allow-same-origin"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Modal Footer: Action Bar ── */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#121624]">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <CheckCircle2 size={15} className="text-emerald-500" />
                        <span>
                            Ready to send to <strong>{currentCount}</strong> recipients in group <strong>{targetAudience.replace("_", " ")}</strong>.
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="rounded-xl h-10 px-5 text-xs font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleLaunchBroadcast}
                            disabled={isBroadcasting || currentCount === 0}
                            className="rounded-xl h-10 px-6 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white flex items-center gap-2 shadow-md shadow-amber-500/20"
                        >
                            {isBroadcasting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Broadcasting Release...</span>
                                </>
                            ) : (
                                <>
                                    <Send size={16} />
                                    <span>Launch Broadcast ({currentCount} Traders)</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
