import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { PreviewConnectView } from "@/components/home/preview/PreviewConnectView";
import { PreviewAnalyzeView } from "@/components/home/preview/PreviewAnalyzeView";
import { PreviewImproveView } from "@/components/home/preview/PreviewImproveView";
import { type WorkflowStepItem } from "./journal-preview-steps";

interface WorkflowConsolePreviewProps {
    steps: readonly WorkflowStepItem[];
    activeStep: number;
    onSelectStep: (stepId: number) => void;
}

export function WorkflowConsolePreview({
    steps,
    activeStep,
    onSelectStep,
}: WorkflowConsolePreviewProps) {
    return (
        <div className="lg:col-span-7 flex flex-col h-full">
            <div className="relative p-3.5 sm:p-4 rounded-xl border border-gold/25 dark:border-gold/15 bg-white/95 dark:bg-[#0D111C] shadow-[0_20px_50px_rgba(15,23,42,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-md overflow-hidden flex flex-col justify-between h-full">
                {/* Subtle Ambient Decorative Glows */}
                <div className="absolute -top-12 -left-12 w-48 h-48 bg-gold/15 dark:bg-gold/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* App Window Header Bar */}
                <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-1.5 py-1 border-b border-gray-200 dark:border-white/10 mb-2.5 shrink-0">
                    <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>

                    {/* Step Switcher Inside App Bar */}
                    <div
                        role="tablist"
                        aria-label="Workflow preview view tabs"
                        className="flex items-center gap-0.5 sm:gap-1 bg-gray-100 dark:bg-[#151925] p-0.5 rounded-lg overflow-x-auto scrollbar-hide touch-pan-x"
                    >
                        {steps.map((step) => (
                            <Button
                                variant="ghost"
                                size="sm"
                                key={step.id}
                                type="button"
                                role="tab"
                                aria-selected={activeStep === step.id}
                                aria-controls={`preview-panel-${step.id}`}
                                aria-label={`Switch to step ${step.number}: ${step.tag}`}
                                onClick={() => onSelectStep(step.id)}
                                className={cn(
                                    "h-auto text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-1 rounded-lg transition-all duration-150 whitespace-nowrap",
                                    activeStep === step.id
                                        ? "bg-gold text-white hover:bg-amber-600 hover:text-white shadow-sm"
                                        : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-transparent"
                                )}
                            >
                                <span className="hidden sm:inline font-mono tabular-nums mr-0.5">
                                    {step.number}
                                </span>
                                <span>{step.tag}</span>
                            </Button>
                        ))}
                    </div>

                    {/* Static PREVIEW indicator */}
                    <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-amber-600 dark:text-gold shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="hidden sm:inline">PREVIEW</span>
                    </div>
                </div>

                {/* Interactive Screens Body */}
                <div
                    role="tabpanel"
                    id={`preview-panel-${activeStep}`}
                    aria-label={steps[activeStep]?.tag}
                    className="w-full h-[265px] sm:h-[275px] overflow-hidden"
                >
                    {activeStep === 0 && <PreviewConnectView />}
                    {activeStep === 1 && <PreviewAnalyzeView />}
                    {activeStep === 2 && <PreviewImproveView />}
                </div>

                {/* Cockpit Status Bar Footer */}
                <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-[10px] text-gray-400 shrink-0">
                    <span className="font-mono text-[9px]">app.thenexttrade.com</span>
                    <span className="text-[9px]">Click steps or tabs to explore live preview</span>
                </div>
            </div>
        </div>
    );
}
