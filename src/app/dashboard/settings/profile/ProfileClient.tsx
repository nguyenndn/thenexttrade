"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
    Globe,
    Shield,
    Trophy,
    BarChart3,
    Clock,
    Award,
    Brain,
    ExternalLink,
    Save,
    Loader2,
    Info,
    Eye,
    EyeOff,
    Type,
    DollarSign,
    Building2,
    Lightbulb,
    Hash,
    UserCircle,
    Percent,
    Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import {
    applyPrivacyPreset,
    type PublicPrivacyPreset,
} from "@/lib/profile/privacy-presets";
import { isPrivacyPresetsEnabled } from "@/lib/feature-flags";
import { PublicProfileCard } from "@/components/profile/PublicProfileCard";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/Dialog";

// ── Types ──
export interface ProfileSettings {
    username: string | null;
    isPublicProfile: boolean;
    showTradeScore: boolean;
    showBadges: boolean;
    showPairStats: boolean;
    showSessionStats: boolean;
    showTradingStyle: boolean;
    profileHeadline: string | null;
    showMoney: boolean;
    showBroker: boolean;
    showAccountNumber: boolean;
    showRealName: boolean;
    showPercentMetrics: boolean;
}

// ── Toggle Switch ──
function ToggleSwitch({
    enabled,
    onToggle,
    disabled,
}: {
    enabled: boolean;
    onToggle: () => void;
    disabled?: boolean;
}) {
    return (
        <Button
            type="button"
            variant="ghost"
            role="switch"
            aria-checked={enabled}
            onClick={disabled ? undefined : onToggle}
            disabled={disabled}
            aria-label={enabled ? "Disable" : "Enable"}
            className={`relative inline-flex h-6 w-11 items-center justify-start rounded-full transition-colors shrink-0 p-0 min-h-0 border-0 ${
                disabled
                    ? "opacity-50 cursor-not-allowed"
                    : enabled
                      ? "bg-gold hover:bg-gold"
                      : "bg-gray-200 dark:bg-white/15 hover:bg-gray-300 dark:hover:bg-white/20"
            }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    enabled ? "translate-x-6" : "translate-x-1"
                }`}
            />
        </Button>
    );
}

// ── Privacy Toggle Card ──
function PrivacyToggleCard({
    icon: Icon,
    title,
    description,
    enabled,
    onToggle,
    color,
    bgColor,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
    color: string;
    bgColor: string;
}) {
    return (
        <div
            className={`
      flex items-center justify-between gap-4 p-4 rounded-lg border transition-all
      ${
          enabled
              ? "bg-gray-50/80 dark:bg-[#151925] border-dashboard"
              : "bg-gray-50/40 dark:bg-[#151925]/60 border-dashboard opacity-60"
      }
      `}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div
                    className={`w-9 h-9 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}
                >
                    <Icon size={16} className={color} />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-700 dark:text-white">
                        {title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {description}
                    </p>
                </div>
            </div>
            <ToggleSwitch enabled={enabled} onToggle={onToggle} />
        </div>
    );
}

// ── Main Component ──
interface ProfileClientProps {
    initialSettings: ProfileSettings;
    userDisplayName?: string | null;
    userJoinedDate?: Date | null;
    userCountry?: string | null;
    userTradingStyle?: {
        archetype: string;
        archetypeTitle: string;
        dimensions?: Record<string, number>;
    } | null;
}

export default function ProfileClient({
    initialSettings,
    userDisplayName,
    userJoinedDate,
    userTradingStyle,
}: ProfileClientProps) {
    const [settings, setSettings] = useState<ProfileSettings>(initialSettings);
    const [isPending, startTransition] = useTransition();
    const [hasChanges, setHasChanges] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const handleToggle = (field: keyof ProfileSettings) => {
        setSettings((prev) => ({ ...prev, [field]: !prev[field] }));
        setHasChanges(true);
    };

    const handlePresetSelect = (preset: PublicPrivacyPreset) => {
        const presetFields = applyPrivacyPreset(preset);
        setSettings((prev) => ({
            ...prev,
            ...presetFields,
        }));
        setHasChanges(true);
    };

    const handleSave = () => {
        startTransition(async () => {
            try {
                const res = await fetch("/api/profile/settings", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(settings),
                });

                if (!res.ok) throw new Error("Failed to save");

                toast.success("Profile settings saved!");
                setHasChanges(false);
            } catch {
                toast.error("Failed to save settings. Please try again.");
            }
        });
    };

    const visibilityItems = [
        {
            key: "showTradingStyle" as const,
            icon: Brain,
            title: "Trading Style Archetype",
            description: "Show your verified trading style archetype",
            color: "text-amber-600 dark:text-gold",
            bgColor: "bg-gold/10 border border-gold/20",
        },
        {
            key: "showTradeScore" as const,
            icon: Trophy,
            title: "Trade Score",
            description: "Show your calculated Trade Score (0-100)",
            color: "text-amber-600 dark:text-gold",
            bgColor: "bg-gold/10 border border-gold/20",
        },
        {
            key: "showBadges" as const,
            icon: Award,
            title: "Badges & Achievements",
            description: "Display your earned badges and milestones",
            color: "text-amber-600 dark:text-gold",
            bgColor: "bg-gold/10 border border-gold/20",
        },
        {
            key: "showPairStats" as const,
            icon: BarChart3,
            title: "Top Trading Pairs",
            description: "Show your best performing currency pairs",
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10 border border-emerald-500/20",
        },
        {
            key: "showSessionStats" as const,
            icon: Clock,
            title: "Preferred Session",
            description: "Display your most active trading session",
            color: "text-amber-600 dark:text-gold",
            bgColor: "bg-gold/10 border border-gold/20",
        },
    ];

    const activeCount = visibilityItems.filter(
        (item) => settings[item.key]
    ).length;

    return (
        <div className="space-y-6">
            {/* Profile Settings Card (Header + Toggle + Headline) */}
            <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-sm overflow-hidden">
                {/* Header + Toggle Row */}
                <div className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                            <Globe size={24} className="text-amber-600 dark:text-gold" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h2 className="text-lg font-bold text-gray-700 dark:text-white">
                                    Public Profile
                                </h2>
                                {/* Status Badge */}
                                <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                        settings.isPublicProfile
                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                            : "bg-gray-100 dark:bg-white/5 text-gray-500 border border-dashboard"
                                    }`}
                                >
                                    {settings.isPublicProfile ? (
                                        <Eye size={10} />
                                    ) : (
                                        <EyeOff size={10} />
                                    )}
                                    {settings.isPublicProfile
                                        ? "Public"
                                        : "Private"}
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm mt-0.5">
                                {settings.username ? (
                                    <>
                                        Profile URL:{" "}
                                        <span className="text-amber-600 dark:text-gold font-semibold font-mono">
                                            /trader/{settings.username}
                                        </span>
                                        {settings.isPublicProfile &&
                                            settings.username && (
                                                <span className="inline-flex items-center gap-3 ml-2">
                                                    <Link
                                                        href={`/trader/${settings.username}`}
                                                        target="_blank"
                                                        className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-gold hover:underline font-semibold"
                                                    >
                                                        <ExternalLink
                                                            size={11}
                                                        />
                                                        Public Page
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        type="button"
                                                        onClick={() =>
                                                            setIsPreviewOpen(
                                                                true
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-gold hover:underline font-bold h-auto p-0 hover:bg-transparent"
                                                    >
                                                        <Eye size={11} />
                                                        Live Preview Card
                                                    </Button>
                                                </span>
                                            )}
                                    </>
                                ) : (
                                    "Set a username in Account Settings to enable."
                                )}
                            </p>
                        </div>
                    </div>
                    <ToggleSwitch
                        enabled={settings.isPublicProfile}
                        onToggle={() => handleToggle("isPublicProfile")}
                        disabled={!settings.username}
                    />
                </div>

                {/* Username Warning */}
                {!settings.username && (
                    <div className="px-5 pb-5">
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gold/10 border border-gold/20">
                            <Info
                                size={14}
                                className="text-amber-600 dark:text-gold flex-shrink-0"
                            />
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                You need to set a username in your{" "}
                                <Link
                                    href="/dashboard/settings"
                                    className="font-bold underline hover:no-underline"
                                >
                                    Account Settings
                                </Link>{" "}
                                before enabling your public profile.
                            </p>
                        </div>
                    </div>
                )}

                {/* Profile Headline (divider + inline) */}
                {settings.isPublicProfile && (
                    <div className="border-t border-dashboard px-5 py-4">
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                                <Type size={14} className="text-amber-600 dark:text-gold" />
                                <span className="text-sm font-bold text-gray-700 dark:text-white">
                                    Profile Headline
                                </span>
                                <span className="text-xs font-normal text-gray-400">
                                    (Optional)
                                </span>
                            </div>
                            <span className="text-xs text-gray-400 font-mono tabular-nums">
                                {(settings.profileHeadline || "").length}/160
                            </span>
                        </div>
                        <PremiumInput
                            value={settings.profileHeadline || ""}
                            onChange={(e) => {
                                setSettings((prev) => ({
                                    ...prev,
                                    profileHeadline: e.target.value.slice(
                                        0,
                                        160
                                    ),
                                }));
                                setHasChanges(true);
                            }}
                            maxLength={160}
                        />
                    </div>
                )}
            </div>

            {/* Privacy Controls (only when public) */}
            {settings.isPublicProfile && (
                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-sm overflow-hidden">
                    {/* Section Header */}
                    <div className="px-5 py-4 border-b border-dashboard flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                <Shield size={16} className="text-rose-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-700 dark:text-white text-sm">
                                    Privacy Controls
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Choose what visitors can see on your
                                    profile.
                                </p>
                            </div>
                        </div>
                        <span className="text-xs font-bold font-mono tabular-nums text-gray-500 bg-gray-50/80 dark:bg-[#151925] border border-dashboard px-2.5 py-1 rounded-lg">
                            {activeCount}/{visibilityItems.length} visible
                        </span>
                    </div>

                    {/* Privacy Presets Segmented Control */}
                    {isPrivacyPresetsEnabled() && (
                        <div className="border-b border-dashboard px-5 py-4 bg-gray-50/50 dark:bg-white/[0.01]">
                            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-2">
                                <Shield size={12} className="text-amber-600 dark:text-gold" />
                                Privacy Presets
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {(() => {
                                    const currentActivePreset = (() => {
                                        if (!settings.isPublicProfile) return "PRIVATE";
                                        if (
                                            settings.showRealName &&
                                            settings.showMoney &&
                                            settings.showBroker &&
                                            settings.showAccountNumber
                                        ) {
                                            return "FULL_PUBLIC";
                                        }
                                        if (
                                            !settings.showRealName &&
                                            !settings.showMoney &&
                                            !settings.showBroker &&
                                            !settings.showAccountNumber
                                        ) {
                                            if (
                                                settings.showBadges &&
                                                settings.showSessionStats &&
                                                settings.showTradingStyle
                                            ) {
                                                return "SAFE_PUBLIC";
                                            }
                                            if (
                                                !settings.showBadges &&
                                                !settings.showSessionStats &&
                                                !settings.showTradingStyle
                                            ) {
                                                return "PERFORMANCE_ONLY";
                                            }
                                        }
                                        return null;
                                    })();

                                    const presets: PublicPrivacyPreset[] = [
                                        "PRIVATE",
                                        "SAFE_PUBLIC",
                                        "PERFORMANCE_ONLY",
                                        "FULL_PUBLIC",
                                    ];

                                    const labelMap: Record<
                                        PublicPrivacyPreset,
                                        string
                                    > = {
                                        PRIVATE: "Private",
                                        SAFE_PUBLIC: "Safe Public",
                                        PERFORMANCE_ONLY: "Performance Only",
                                        FULL_PUBLIC: "Full Public",
                                    };

                                    return presets.map((preset) => {
                                        const isSelected =
                                            currentActivePreset === preset;

                                        return (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                key={preset}
                                                type="button"
                                                onClick={() =>
                                                    handlePresetSelect(preset)
                                                }
                                                className={`px-3 py-2 h-auto rounded-lg text-xs font-bold border transition-all ${
                                                    isSelected
                                                        ? "bg-gold/10 border-gold text-amber-600 dark:text-gold font-bold shadow-sm shadow-amber-500/10 hover:bg-gold/15"
                                                        : "bg-white dark:bg-[#151925] border-dashboard hover:border-gold/40 text-gray-600 dark:text-gray-300"
                                                }`}
                                            >
                                                {labelMap[preset]}
                                            </Button>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Toggle Grid */}
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {visibilityItems.map((item) => (
                            <PrivacyToggleCard
                                key={item.key}
                                icon={item.icon}
                                title={item.title}
                                description={item.description}
                                enabled={settings[item.key] as boolean}
                                onToggle={() => handleToggle(item.key)}
                                color={item.color}
                                bgColor={item.bgColor}
                            />
                        ))}
                    </div>

                    {/* Privacy Notice */}
                    <div className="px-5 py-4 border-t border-dashboard">
                        <div className="flex items-start gap-3">
                            <Shield
                                size={14}
                                className="text-emerald-500 mt-0.5 flex-shrink-0"
                            />
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Configure what public visitors can see.
                                Fine-tune data privacy below.
                            </p>
                        </div>
                    </div>

                    {/* Save Button (inside card footer) */}
                    <div className="px-5 py-4 border-t border-dashboard flex justify-end">
                        <Button
                            type="button"
                            variant="primary"
                            size="smd"
                            onClick={handleSave}
                            disabled={isPending || !hasChanges}
                        >
                            {isPending ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            <span>Save Changes</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* Data Privacy Controls (only when public) */}
            {settings.isPublicProfile && isPrivacyPresetsEnabled() && (
                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-dashboard flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                                <Lock size={16} className="text-amber-600 dark:text-gold" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-700 dark:text-white text-sm">
                                    Data Privacy
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Control which sensitive data is shown on
                                    your public profile.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <PrivacyToggleCard
                            icon={DollarSign}
                            title="Dollar Amounts"
                            description="Show P&L in dollar values (e.g., +$120)"
                            enabled={settings.showMoney}
                            onToggle={() => handleToggle("showMoney")}
                            color="text-emerald-500"
                            bgColor="bg-emerald-500/10 border border-emerald-500/20"
                        />
                        <PrivacyToggleCard
                            icon={Percent}
                            title="Percentage Metrics"
                            description="Show win rate, drawdown as percentages"
                            enabled={settings.showPercentMetrics}
                            onToggle={() => handleToggle("showPercentMetrics")}
                            color="text-emerald-500"
                            bgColor="bg-emerald-500/10 border border-emerald-500/20"
                        />
                        <PrivacyToggleCard
                            icon={UserCircle}
                            title="Real Name"
                            description="Show your real name or only username"
                            enabled={settings.showRealName}
                            onToggle={() => handleToggle("showRealName")}
                            color="text-amber-600 dark:text-gold"
                            bgColor="bg-gold/10 border border-gold/20"
                        />
                        <PrivacyToggleCard
                            icon={Building2}
                            title="Broker Name"
                            description="Display which broker you use"
                            enabled={settings.showBroker}
                            onToggle={() => handleToggle("showBroker")}
                            color="text-amber-600 dark:text-gold"
                            bgColor="bg-gold/10 border border-gold/20"
                        />
                        <PrivacyToggleCard
                            icon={Hash}
                            title="Account Number"
                            description="Show your trading account number"
                            enabled={settings.showAccountNumber}
                            onToggle={() => handleToggle("showAccountNumber")}
                            color="text-rose-500"
                            bgColor="bg-rose-500/10 border border-rose-500/20"
                        />
                    </div>

                    <div className="px-5 py-3 border-t border-dashboard">
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                            <Lightbulb size={12} className="inline-block mr-1 align-[-1px] text-amber-600 dark:text-gold" /> Tip: Most pro traders keep dollar amounts hidden
                            and only share percentage-based metrics.
                        </p>
                    </div>
                </div>
            )}

            {/* Save Button when profile is private (no Privacy Controls card shown) */}
            {!settings.isPublicProfile && (
                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-sm overflow-hidden">
                    <div className="px-5 py-4 flex justify-end">
                        <Button
                            type="button"
                            variant="primary"
                            size="smd"
                            onClick={handleSave}
                            disabled={isPending || !hasChanges}
                        >
                            {isPending ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            <span>Save Changes</span>
                        </Button>
                    </div>
                </div>
            )}

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-[490px] w-full p-0 overflow-hidden bg-white dark:bg-[#0D111C] border-dashboard dark:border-white/[0.08] rounded-2xl shadow-2xl max-h-[94vh] flex flex-col">
                    <div className="p-4 px-6 border-b border-dashboard dark:border-white/[0.08] flex-shrink-0">
                        <DialogHeader>
                            <DialogTitle className="text-base font-black text-gray-800 dark:text-white flex items-center gap-2">
                                <Shield size={16} className="text-amber-600 dark:text-gold" />
                                Live Trading Card Preview
                            </DialogTitle>
                        </DialogHeader>
                    </div>
                    <div className="p-0 overflow-y-auto scrollbar-hide flex-1">
                        <PublicProfileCard
                            isModal={true}
                            profile={{
                                name: settings.showRealName
                                    ? userDisplayName || "Trader"
                                    : "Trader",
                                username: settings.username || "trader",
                                image: null,
                                bio: null,
                                xp: 1500,
                                level: 5,
                                joinedDate: userJoinedDate || new Date(),
                                headline: settings.profileHeadline,
                                streak: 3,
                                performanceWindow: {
                                    label: "Last 90 days",
                                    days: 90,
                                    qualifyingClosedTrades: 124,
                                    calculatedAt: new Date(),
                                    latestTradeAt: new Date(),
                                    verificationLabel: "Preview sample",
                                },
                                dataSource: "Preview data only",
                                methodologyHref: "/faq",
                                badges: [
                                    {
                                        name: "Trader",
                                        icon: "TrendingUp",
                                        earnedAt: new Date(),
                                    },
                                    {
                                        name: "Risk Manager",
                                        icon: "ShieldCheck",
                                        earnedAt: new Date(),
                                    },
                                ],
                                topPairs: [
                                    {
                                        symbol: "EURUSD",
                                        winRate: 72,
                                        trades: 45,
                                    },
                                    {
                                        symbol: "GBPUSD",
                                        winRate: 60,
                                        trades: 30,
                                    },
                                ],
                                preferredSession: {
                                    name: "London",
                                    percentage: 58,
                                },
                                stats: {
                                    totalTrades: 124,
                                    winRate: 68.5,
                                    avgRR: 2.1,
                                    tradeScore: 82,
                                },
                                tradingStyle: settings.showTradingStyle
                                    ? userTradingStyle || {
                                          archetype: "DISCIPLINED_SNIPER",
                                          archetypeTitle:
                                              "The Disciplined Sniper",
                                      }
                                    : null,
                                visibility: {
                                    showRealName: settings.showRealName,
                                    showMoney: settings.showMoney,
                                    showPercentMetrics:
                                        settings.showPercentMetrics,
                                    showTradeScore: settings.showTradeScore,
                                    showPairStats: settings.showPairStats,
                                    showSessionStats: settings.showSessionStats,
                                    showTradingStyle: settings.showTradingStyle,
                                    showBadges: settings.showBadges,
                                    showBroker: settings.showBroker,
                                    showAccountNumber:
                                        settings.showAccountNumber,
                                },
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
