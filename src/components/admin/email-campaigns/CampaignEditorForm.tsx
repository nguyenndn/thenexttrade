"use client";

import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import {
    CAMPAIGN_PRESETS,
    type CampaignComposeInput,
    type CampaignPreset,
} from "@/lib/emails/marketing-campaign-shared";

interface CampaignEditorFormProps {
    form: CampaignComposeInput;
    onChangeField: <K extends keyof CampaignComposeInput>(
        key: K,
        value: CampaignComposeInput[K]
    ) => void;
    onApplyPreset: (preset: CampaignPreset) => void;
}

export function CampaignEditorForm({
    form,
    onChangeField,
    onApplyPreset,
}: CampaignEditorFormProps) {
    const insertNameToken = () => {
        onChangeField(
            "bodyContent",
            `${form.bodyContent}${form.bodyContent.endsWith(" ") || !form.bodyContent ? "" : " "}{{name}}`
        );
    };

    return (
        <div className="space-y-4">
            {/* Quick-Load Presets */}
            <div className="space-y-2 pb-3 border-b border-gray-200 dark:border-white/10">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Wand2 size={13} className="text-gold" />
                        <span>Quick-Start Templates</span>
                    </span>
                    <span className="text-[11px] text-gray-400">
                        1-click load & customize
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {CAMPAIGN_PRESETS.map((preset) => (
                        <Button
                            key={preset.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onApplyPreset(preset)}
                            className="h-8 px-3 rounded-lg text-xs font-bold whitespace-nowrap"
                        >
                            <span>{preset.label}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Subject & Preheader */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                    <PremiumInput
                        id="campaign-subject"
                        label="2. Email Subject Line"
                        helperText="Supports {{name}} personalization"
                        value={form.subject}
                        onChange={(e) => onChangeField("subject", e.target.value)}
                    />
                </div>
                <div>
                    <PremiumInput
                        id="campaign-badge"
                        label="Top Badge Pill (Optional)"
                        helperText="Short uppercase eyebrow tag"
                        value={form.badgeText || ""}
                        onChange={(e) => onChangeField("badgeText", e.target.value)}
                    />
                </div>
            </div>

            <PremiumInput
                id="campaign-preheader"
                label="Inbox Preheader Snippet (Optional)"
                helperText="Preview text shown next to the subject line in Gmail / Apple Mail"
                value={form.preheader || ""}
                onChange={(e) => onChangeField("preheader", e.target.value)}
            />

            <PremiumInput
                id="campaign-heading"
                label="3. Main Card Headline"
                helperText="Bold H2 heading inside the Gold-branded email card"
                value={form.heading}
                onChange={(e) => onChangeField("heading", e.target.value)}
            />

            {/* Rich Body Content */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <label
                        htmlFor="campaign-body"
                        className="text-xs font-bold uppercase tracking-wider text-gray-500"
                    >
                        4. Email Body Content
                    </label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={insertNameToken}
                        className="h-6 px-2 rounded-lg text-[11px] font-mono font-bold"
                    >
                        <span>+ Insert {"{{name}}"}</span>
                    </Button>
                </div>
                <textarea
                    id="campaign-body"
                    rows={6}
                    value={form.bodyContent}
                    onChange={(e) => onChangeField("bodyContent", e.target.value)}
                    className="w-full p-3.5 rounded-lg bg-gray-50 dark:bg-[#151925] border border-dashboard dark:border-white/10 text-sm text-gray-800 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-y"
                />
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    Separate paragraphs with a blank line. Formatting supported: <strong>**bold text**</strong>, <code>[Link Text](/path-or-url)</code>, and <code>{"{{name}}"}</code>.
                </p>
            </div>

            {/* Optional Highlight Bullet Box */}
            <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 space-y-3">
                <PremiumInput
                    id="campaign-highlight-title"
                    label="Highlight Callout Box Title (Optional)"
                    helperText="Heading above the Gold-bordered bullet list"
                    value={form.highlightTitle || ""}
                    onChange={(e) =>
                        onChangeField("highlightTitle", e.target.value)
                    }
                />
                <div className="space-y-1.5">
                    <label
                        htmlFor="campaign-highlights"
                        className="block text-xs font-bold uppercase tracking-wider text-gray-500"
                    >
                        Highlight Bullet Points (Optional — one per line)
                    </label>
                    <textarea
                        id="campaign-highlights"
                        rows={3}
                        value={form.highlightItemsRaw || ""}
                        onChange={(e) =>
                            onChangeField("highlightItemsRaw", e.target.value)
                        }
                        className="w-full p-3 rounded-lg bg-white dark:bg-[#151925] border border-dashboard dark:border-white/10 text-xs text-gray-800 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none"
                    />
                </div>
            </div>

            {/* Primary & Secondary CTAs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <PremiumInput
                    id="campaign-cta-label"
                    label="Primary Gold Button Label"
                    helperText="Leave empty to hide button"
                    value={form.ctaLabel || ""}
                    onChange={(e) => onChangeField("ctaLabel", e.target.value)}
                />
                <PremiumInput
                    id="campaign-cta-url"
                    label="Primary Button Destination URL"
                    helperText="Relative path (/brokers) or https:// URL"
                    value={form.ctaUrl || ""}
                    onChange={(e) => onChangeField("ctaUrl", e.target.value)}
                />
                <PremiumInput
                    id="campaign-sec-cta-label"
                    label="Secondary Outline Button (Optional)"
                    value={form.secondaryCtaLabel || ""}
                    onChange={(e) =>
                        onChangeField("secondaryCtaLabel", e.target.value)
                    }
                />
                <PremiumInput
                    id="campaign-sec-cta-url"
                    label="Secondary Button URL (Optional)"
                    value={form.secondaryCtaUrl || ""}
                    onChange={(e) =>
                        onChangeField("secondaryCtaUrl", e.target.value)
                    }
                />
            </div>

            <PremiumInput
                id="campaign-footer-note"
                label="Closing Footnote / PS (Optional)"
                helperText="Italicized note rendered above the Unsubscribe footer"
                value={form.footerNote || ""}
                onChange={(e) => onChangeField("footerNote", e.target.value)}
            />
        </div>
    );
}
