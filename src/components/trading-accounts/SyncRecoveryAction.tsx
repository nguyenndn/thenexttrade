"use client";

import {
    ArrowRight,
    Monitor,
    Zap,
    HelpCircle,
    Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface SyncRecoveryActionProps {
    action?: {
        label: string;
        href?: string;
        action?:
            | "open_sync_setup"
            | "sync_first_trades"
            | "reconnect"
            | "contact_support";
    };
    onActionTrigger?: (action: string) => void;
}

export function SyncRecoveryAction({
    action,
    onActionTrigger,
}: SyncRecoveryActionProps) {
    if (!action) return null;

    const handleActionClick = () => {
        if (action.action && onActionTrigger) {
            onActionTrigger(action.action);
        }
    };

    const iconMap = {
        open_sync_setup: Monitor,
        sync_first_trades: Zap,
        reconnect: LinkIcon,
        contact_support: HelpCircle,
    };

    const IconComponent = action.action
        ? iconMap[action.action] || HelpCircle
        : ArrowRight;

    if (action.href) {
        return (
            <Link
                href={action.href}
                className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-amber-500 px-3 text-[11px] font-black text-white shadow-sm shadow-amber-500/20 hover:bg-amber-600 transition-colors"
            >
                <IconComponent size={12} />
                <span>{action.label}</span>
            </Link>
        );
    }

    return (
        <Button
            onClick={handleActionClick}
            className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-3 text-[11px] font-black text-white shadow-sm shadow-amber-500/20 transition-colors border-none"
        >
            <IconComponent size={12} />
            <span>{action.label}</span>
        </Button>
    );
}
