"use client";

import React from "react";
import { TargetPeriodField } from "@/components/dashboard/targets/TargetPeriodField";
import {
    TargetType,
    WEEKLY_PRESETS,
    MONTHLY_PRESETS,
} from "@/components/dashboard/targets/TargetProgressTypes";

export interface AccountProfitTargetState {
    weeklyEnabled: boolean;
    weeklyTarget: string;
    weeklyTargetType: TargetType;
    monthlyEnabled: boolean;
    monthlyTarget: string;
    monthlyTargetType: TargetType;
}

export interface AccountProfitTargetSettingsProps {
    value: AccountProfitTargetState;
    onChange: (state: AccountProfitTargetState) => void;
}

export function AccountProfitTargetSettings({
    value,
    onChange,
}: AccountProfitTargetSettingsProps) {
    return (
        <div className="space-y-4 pt-2 border-t border-dashboard">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <h3 className="text-[11px] font-black text-primary uppercase tracking-widest">
                        Profit Milestones & Targets
                    </h3>
                </div>
                <span className="text-[10px] text-gray-400">
                    Per-account weekly & monthly targets
                </span>
            </div>

            <div className="space-y-4">
                <TargetPeriodField
                    id="account-weekly-target"
                    label="Weekly Target"
                    targetType={value.weeklyTargetType}
                    onTypeChange={(t) =>
                        onChange({ ...value, weeklyTargetType: t })
                    }
                    value={value.weeklyTarget}
                    onValueChange={(v) =>
                        onChange({ ...value, weeklyTarget: v })
                    }
                    enabled={value.weeklyEnabled}
                    onToggleEnabled={(enabled) =>
                        onChange({ ...value, weeklyEnabled: enabled })
                    }
                    helperText={
                        value.weeklyTargetType === "USD"
                            ? "Absolute dollar target for Monday to Sunday UTC"
                            : "Percentage of starting capital base for the week"
                    }
                    presets={
                        value.weeklyTargetType === "USD"
                            ? WEEKLY_PRESETS.usd
                            : WEEKLY_PRESETS.pct
                    }
                />
                <TargetPeriodField
                    id="account-monthly-target"
                    label="Monthly Target"
                    targetType={value.monthlyTargetType}
                    onTypeChange={(t) =>
                        onChange({ ...value, monthlyTargetType: t })
                    }
                    value={value.monthlyTarget}
                    onValueChange={(v) =>
                        onChange({ ...value, monthlyTarget: v })
                    }
                    enabled={value.monthlyEnabled}
                    onToggleEnabled={(enabled) =>
                        onChange({ ...value, monthlyEnabled: enabled })
                    }
                    helperText={
                        value.monthlyTargetType === "USD"
                            ? "Absolute dollar target for calendar month"
                            : "Percentage of starting capital base for the month"
                    }
                    presets={
                        value.monthlyTargetType === "USD"
                            ? MONTHLY_PRESETS.usd
                            : MONTHLY_PRESETS.pct
                    }
                />
            </div>
        </div>
    );
}
