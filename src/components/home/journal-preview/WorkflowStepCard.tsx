import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { WorkflowStepItem } from "./journal-preview-steps";

interface WorkflowStepCardProps {
    step: WorkflowStepItem;
    isActive: boolean;
    onSelect: () => void;
}

export function WorkflowStepCard({
    step,
    isActive,
    onSelect,
}: WorkflowStepCardProps) {
    const Icon = step.icon;

    return (
        <Button
            variant="ghost"
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`preview-panel-${step.id}`}
            aria-label={step.title}
            onClick={onSelect}
            className={cn(
                "group w-full h-auto flex items-start gap-3.5 rounded-lg p-3.5 sm:p-4 text-left transition-all duration-300 relative border font-normal",
                isActive
                    ? "border-gold bg-white dark:bg-white/[0.05] shadow-[0_10px_24px_rgba(229,165,10,0.14)] ring-1 ring-gold/40 hover:bg-white dark:hover:bg-white/[0.05]"
                    : "border-gray-200 bg-white/70 dark:border-white/10 dark:bg-white/[0.02] hover:border-gold/30 hover:bg-white dark:hover:bg-white/[0.04]"
            )}
        >
            {/* Icon Container */}
            <div
                className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-300",
                    isActive
                        ? "bg-gold text-white shadow-md shadow-gold/20 scale-105"
                        : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 group-hover:text-gold group-hover:bg-gold/10"
                )}
            >
                <Icon size={17} strokeWidth={2.2} />
            </div>

            {/* Step Details */}
            <div className="w-full min-w-0 pt-0.5">
                <div className="mb-0.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span
                            className={cn(
                                "text-[10px] font-black uppercase tracking-wider",
                                isActive ? "text-gold" : "text-gray-400"
                            )}
                        >
                            {step.number}
                        </span>
                        <h4
                            className={cn(
                                "text-sm font-black transition-colors",
                                isActive
                                    ? "text-gray-900 dark:text-white"
                                    : "text-gray-700 dark:text-gray-300"
                            )}
                        >
                            {step.title}
                        </h4>
                    </div>

                    {/* Mini Pill */}
                    <span
                        className={cn(
                            "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                            isActive
                                ? "bg-gold/15 text-gold"
                                : "bg-gray-100 dark:bg-white/5 text-gray-400"
                        )}
                    >
                        {step.tag}
                    </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug font-medium">
                    {step.description}
                </p>
            </div>
        </Button>
    );
}
