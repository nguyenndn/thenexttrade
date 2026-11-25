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
        title: "1. Dual MT5 Sync (EA & Cloud)",
        icon: PlugZap,
        description: "Stream via Trade Manager EA on PC/VPS (Sync Key) or 1-Click Cloud Sync from mobile (read-only Investor Password). Zero manual CSV uploads.",
        tag: "EA + Cloud Sync",
    },
    {
        id: 1,
        number: "02",
        title: "2. Audit Playbooks & Leaks",
        icon: BarChart3,
        description: "Score trades against SMC/ICT playbook checklists (A+ to C) and expose hidden leaks: off-session FOMO, news chasing, and lot size spikes.",
        tag: "Playbooks & Leaks",
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
