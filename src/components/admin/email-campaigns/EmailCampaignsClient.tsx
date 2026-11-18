"use client";

import { useEffect, useState, useTransition } from "react";
import { Mail, History, Users, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
    CAMPAIGN_PRESETS,
    type AudienceCountsMap,
    type CampaignComposeInput,
    type CampaignPreset,
    parseCustomRecipientList,
} from "@/lib/emails/marketing-campaign-shared";
import {
    type CampaignHistoryEntry,
    dispatchEmailCampaignAction,
    getCampaignHistory,
    renderCampaignPreviewAction,
    sendCampaignTestEmailAction,
} from "@/app/admin/email-campaigns/actions";
import {
    AudienceSegmentSelector,
    SEGMENT_OPTIONS,
} from "./AudienceSegmentSelector";
import { CampaignEditorForm } from "./CampaignEditorForm";
import { CampaignLivePreview } from "./CampaignLivePreview";
import { CampaignHistoryTable } from "./CampaignHistoryTable";

interface EmailCampaignsClientProps {
    initialCounts: AudienceCountsMap;
    initialHistory: CampaignHistoryEntry[];
    defaultTestEmail: string;
}

const DEFAULT_PRESET = CAMPAIGN_PRESETS[0];

export function EmailCampaignsClient({
    initialCounts,
    initialHistory,
    defaultTestEmail,
}: EmailCampaignsClientProps) {
    const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");
    const [history, setHistory] = useState<CampaignHistoryEntry[]>(initialHistory);
    const [testRecipient, setTestRecipient] = useState(defaultTestEmail);
    const [form, setForm] = useState<CampaignComposeInput>({
        campaignTitle: DEFAULT_PRESET.label,
        badgeText: DEFAULT_PRESET.badgeText,
        subject: DEFAULT_PRESET.subject,
        preheader: DEFAULT_PRESET.preheader,
        heading: DEFAULT_PRESET.heading,
        bodyContent: DEFAULT_PRESET.bodyContent,
        highlightTitle: DEFAULT_PRESET.highlightTitle,
        highlightItemsRaw: DEFAULT_PRESET.highlightItemsRaw,
        ctaLabel: DEFAULT_PRESET.ctaLabel,
        ctaUrl: DEFAULT_PRESET.ctaUrl,
        secondaryCtaLabel: DEFAULT_PRESET.secondaryCtaLabel,
        secondaryCtaUrl: DEFAULT_PRESET.secondaryCtaUrl,
        footerNote: DEFAULT_PRESET.footerNote,
        segment: DEFAULT_PRESET.segment,
        customEmailsRaw: "",
    });

    const [previewSubject, setPreviewSubject] = useState(form.subject);
    const [previewHtml, setPreviewHtml] = useState("");
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [isSendingTest, setIsSendingTest] = useState(false);
    const [isDispatching, startDispatch] = useTransition();

    useEffect(() => {
        const timer = setTimeout(async () => {
            setIsLoadingPreview(true);
            const res = await renderCampaignPreviewAction(form);
            if (res.success && res.html) {
                setPreviewSubject(res.subject || form.subject);
                setPreviewHtml(res.html);
            }
            setIsLoadingPreview(false);
        }, 250);
        return () => clearTimeout(timer);
    }, [form]);

    const handleChangeField = <K extends keyof CampaignComposeInput>(
        key: K,
        value: CampaignComposeInput[K]
    ) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleApplyPreset = (preset: CampaignPreset) => {
        setForm((prev) => ({
            ...prev,
            campaignTitle: preset.label,
            segment: preset.segment,
            badgeText: preset.badgeText,
            subject: preset.subject,
            preheader: preset.preheader,
            heading: preset.heading,
            bodyContent: preset.bodyContent,
            highlightTitle: preset.highlightTitle,
            highlightItemsRaw: preset.highlightItemsRaw,
            ctaLabel: preset.ctaLabel,
            ctaUrl: preset.ctaUrl,
            secondaryCtaLabel: preset.secondaryCtaLabel,
            secondaryCtaUrl: preset.secondaryCtaUrl,
            footerNote: preset.footerNote,
        }));
        toast.success(`Loaded template: ${preset.label}`);
    };

    const handleSendTest = async () => {
        setIsSendingTest(true);
        const res = await sendCampaignTestEmailAction({
            ...form,
            testRecipient,
        });
        setIsSendingTest(false);
        if (res.success) toast.success(res.message);
        else toast.error(res.message);
    };

    const handleDispatch = () => {
        startDispatch(async () => {
            const res = await dispatchEmailCampaignAction(form);
            if (res.success) {
                toast.success(res.message);
                const updated = await getCampaignHistory();
                setHistory(updated);
                setActiveTab("history");
            } else {
                toast.error(res.message);
            }
        });
    };

    const customValidCount = parseCustomRecipientList(
        form.customEmailsRaw
    ).validEmails.length;
    const currentStats =
        form.segment === "CUSTOM_LIST"
            ? { optedIn: customValidCount, skipped: 0 }
            : initialCounts[form.segment];
    const segmentLabel =
        SEGMENT_OPTIONS.find((s) => s.id === form.segment)?.label ||
        form.segment;
    const totalDispatchedEmails = history.reduce(
        (acc, item) => acc + item.sentCount,
        0
    );

    return (
        <div className="space-y-5 pb-10">
            <AdminPageHeader
                title="Email Campaigns"
                description="Compose, preview, test, and dispatch targeted marketing emails with automatic opt-out compliance."
            >
                <div className="inline-flex items-center bg-gray-100 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl p-1 gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab("compose")}
                        className={`h-8 px-3.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                            activeTab === "compose"
                                ? "bg-gold hover:bg-gold text-white shadow-xs"
                                : "text-gray-600 dark:text-gray-400"
                        }`}
                    >
                        <Mail size={14} />
                        <span>Compose Campaign</span>
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab("history")}
                        className={`h-8 px-3.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                            activeTab === "history"
                                ? "bg-gold hover:bg-gold text-white shadow-xs"
                                : "text-gray-600 dark:text-gray-400"
                        }`}
                    >
                        <History size={14} />
                        <span>History ({history.length})</span>
                    </Button>
                </div>
            </AdminPageHeader>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <Users size={12} className="text-gold" /> Subscribed Audience
                    </span>
                    <div className="text-xl font-black font-mono tabular-nums text-gray-900 dark:text-white mt-1">
                        {initialCounts.ALL_USERS.optedIn}
                        <span className="text-xs font-normal text-gray-400 ml-1">
                            / {initialCounts.ALL_USERS.total}
                        </span>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        No MT5 Connected
                    </span>
                    <div className="text-xl font-black font-mono tabular-nums text-amber-600 dark:text-gold mt-1">
                        {initialCounts.NO_MT5.optedIn}
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        VIP / Pro Members
                    </span>
                    <div className="text-xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                        {initialCounts.VIP_PRO.optedIn}
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-emerald-500" /> Total Emails Sent
                    </span>
                    <div className="text-xl font-black font-mono tabular-nums text-gray-900 dark:text-white mt-1">
                        {totalDispatchedEmails}
                    </div>
                </div>
            </div>

            {activeTab === "compose" ? (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                    <div className="xl:col-span-6 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-5 space-y-6 shadow-sm">
                        <AudienceSegmentSelector
                            selectedSegment={form.segment}
                            onSelectSegment={(seg) =>
                                handleChangeField("segment", seg)
                            }
                            counts={initialCounts}
                            customEmailsRaw={form.customEmailsRaw || ""}
                            onChangeCustomEmails={(val) =>
                                handleChangeField("customEmailsRaw", val)
                            }
                        />
                        <CampaignEditorForm
                            form={form}
                            onChangeField={handleChangeField}
                            onApplyPreset={handleApplyPreset}
                        />
                    </div>

                    <div className="xl:col-span-6 xl:sticky xl:top-4">
                        <CampaignLivePreview
                            previewSubject={previewSubject}
                            previewHtml={previewHtml}
                            isLoadingPreview={isLoadingPreview}
                            testRecipient={testRecipient}
                            onChangeTestRecipient={setTestRecipient}
                            onSendTest={handleSendTest}
                            isSendingTest={isSendingTest}
                            eligibleCount={currentStats.optedIn}
                            skippedCount={currentStats.skipped}
                            segmentLabel={segmentLabel}
                            isDispatching={isDispatching}
                            onConfirmDispatch={handleDispatch}
                        />
                    </div>
                </div>
            ) : (
                <CampaignHistoryTable
                    history={history}
                    onReuseCampaign={(entry) => {
                        setForm({
                            campaignTitle: entry.campaignTitle,
                            badgeText: entry.badgeText,
                            subject: entry.subject,
                            preheader: entry.preheader,
                            heading: entry.heading,
                            bodyContent: entry.bodyContent,
                            highlightTitle: entry.highlightTitle,
                            highlightItemsRaw: entry.highlightItemsRaw,
                            ctaLabel: entry.ctaLabel,
                            ctaUrl: entry.ctaUrl,
                            secondaryCtaLabel: entry.secondaryCtaLabel,
                            secondaryCtaUrl: entry.secondaryCtaUrl,
                            footerNote: entry.footerNote,
                            segment: entry.segment,
                            customEmailsRaw: "",
                        });
                        setActiveTab("compose");
                        toast.success("Campaign loaded into composer.");
                    }}
                />
            )}
        </div>
    );
}
