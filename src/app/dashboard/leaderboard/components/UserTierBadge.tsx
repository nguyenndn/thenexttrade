"use client";

import { Shield, ShieldCheck, Gem, Diamond, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserTierBadgeProps {
  tierName: string;
  tierColor: string;
  tierIcon: string;
  tierLabel: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  Shield,
  ShieldCheck,
  Gem,
  Diamond,
  Crown,
};

const sizeMap = {
  sm: 14,
  md: 16,
  lg: 20,
};

export function UserTierBadge({
  tierName,
  tierColor,
  tierIcon,
  tierLabel,
  size = "md",
  showLabel = true,
}: UserTierBadgeProps) {
  const Icon = iconMap[tierIcon] || Shield;
  const iconSize = sizeMap[size];

  return (
    <div className="flex items-center gap-1.5">
      <Icon
        size={iconSize}
        style={{ color: tierColor }}
        className="transition-colors"
      />
      {showLabel && (
        <span
          className={cn(
            "font-bold",
            size === "sm" && "text-[10px]",
            size === "md" && "text-xs",
            size === "lg" && "text-sm"
          )}
          style={{ color: tierColor }}
        >
          {tierLabel}
        </span>
      )}
    </div>
  );
}
