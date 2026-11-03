import Link from "next/link";
import { ArrowRight, LayoutDashboard, Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { WorkflowStepCard } from "./WorkflowStepCard";
import type { WorkflowStepItem } from "./journal-preview-steps";

interface WorkflowStepListProps {
    steps: readonly WorkflowStepItem[];
    activeStep: number;
    onSelectStep: (stepId: number) => void;
    isLoggedIn: boolean;
}

export function WorkflowStepList({
    steps,
    activeStep,
    onSelectStep,
    isLoggedIn,
}: WorkflowStepListProps) {
    return (
        <div className="lg:col-span-5 flex flex-col justify-between h-full text-left">
            {/* Interactive Steps List */}
            <div
                role="tablist"
                aria-label="Trading workflow steps"
                className="flex-1 flex flex-col justify-between gap-3 mb-4 sm:mb-5 w-full"
            >
                {steps.map((step) => (
                    <WorkflowStepCard
                        key={step.id}
                        step={step}
                        isActive={activeStep === step.id}
                        onSelect={() => onSelectStep(step.id)}
                    />
                ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                <Link
                    href={
                        isLoggedIn
                            ? "/dashboard"
                            : "/auth/signup?source=home_product_preview"
                    }
                    className={cn(
                        buttonVariants({ variant: "gold" }),
                        "w-full sm:flex-1 min-h-11 sm:min-h-12 px-6 rounded-lg bg-gold hover:bg-amber-600 text-white font-extrabold text-sm shadow-[0_8px_20px_rgba(245,158,11,0.22)] hover:shadow-[0_12px_28px_rgba(245,158,11,0.32)] transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap group"
                    )}
                >
                    {isLoggedIn ? (
                        <>
                            Go to Dashboard{" "}
                            <LayoutDashboard
                                size={16}
                                className="text-yellow-200 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300"
                            />
                        </>
                    ) : (
                        <>
                            Start Free Journal{" "}
                            <Zap
                                size={16}
                                className="text-yellow-200 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300"
                            />
                        </>
                    )}
                </Link>
                <Link
                    href="/get-started"
                    className={cn(
                        buttonVariants({ variant: "outline" }),
                        "w-full sm:flex-1 min-h-11 sm:min-h-12 px-6 rounded-lg bg-white/90 dark:bg-white/[0.03] border border-gold/35 dark:border-gold/25 hover:border-gold hover:bg-gold/[0.08] dark:hover:bg-gold/[0.06] text-gray-800 dark:text-gray-200 hover:text-gray-950 dark:hover:text-white font-extrabold text-sm shadow-sm transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap group"
                    )}
                >
                    View Setup Path{" "}
                    <ArrowRight
                        size={16}
                        className="group-hover:translate-x-1 transition-transform duration-300"
                    />
                </Link>
            </div>
        </div>
    );
}
