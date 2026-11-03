import { BarChart3, PlugZap, Target, type LucideIcon } from "lucide-react";

export interface WorkflowStepItem {
    id: number;
    number: string;
    title: string;
    icon: LucideIcon;
    description: string;
    tag: string;
}

export const WORKFLOW_STEPS: readonly WorkflowStepItem[] = [
    {
        id: 0,
        number: "01",
        title: "1. Live MT5 Sync",
        icon: PlugZap,
        description: "Trade Manager EA streams every tick, entry, and stop-loss directly to your dashboard.",
        tag: "Real-Time",
    },
    {
        id: 1,
        number: "02",
        title: "2. Expose The Leaks",
        icon: BarChart3,
        description: "Uncover the hidden patterns draining your equity: off-session FOMO, news chasing, and lot size spikes.",
        tag: "Telemetry",
    },
    {
        id: 2,
        number: "03",
        title: "3. Execute The Fix",
        icon: Target,
        description: "Receive one strict weekly action plan. Fix one specific execution habit across your next 10 trades.",
        tag: "10-Trade Sprint",
    },
] as const;
