"use client";
import type { CardComponentProps } from "onborda";
import { useOnborda } from "onborda";
import { X, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function OnboardingCard({
    step,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    arrow,
}: CardComponentProps) {
    const { closeOnborda } = useOnborda();
    const isLast = currentStep === totalSteps - 1;
    const isFirst = currentStep === 0;

    const handleNext = () => {
        if (isLast) {
            closeOnborda();
        } else {
            nextStep();
        }
    };

    const handleClose = () => {
        closeOnborda();
    };

    return (
        <div
            className="relative bg-white dark:bg-[#1A1D27] rounded-lg border border-dashboard shadow-2xl w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden pointer-events-auto"
            style={{ zIndex: 99999 }}
        >
            {/* Progress Bar */}
            <div className="h-1 bg-gray-100 dark:bg-white/5">
                <div
                    className="h-full bg-gold transition-all duration-500"
                    style={{
                        width: `${((currentStep + 1) / totalSteps) * 100}%`,
                    }}
                />
            </div>

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                        {step.icon && (
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary text-lg">
                                {step.icon}
                            </div>
                        )}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                                {step.title}
                            </h3>
                            <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                                Step {currentStep + 1} of {totalSteps}
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        className="h-7 w-7 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 pointer-events-auto"
                        aria-label="Close tour"
                    >
                        <X size={16} />
                    </Button>
                </div>

                {/* Content */}
                <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
                    {step.content}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                    {!isFirst ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={prevStep}
                            className="h-auto p-0 flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors pointer-events-auto hover:bg-transparent"
                        >
                            <ArrowLeft size={14} /> Back
                        </Button>
                    ) : (
                        <span />
                    )}

                    <Button
                        type="button"
                        variant="gold"
                        size="sm"
                        onClick={handleNext}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gold hover:bg-amber-600 rounded-lg transition-colors shadow-sm pointer-events-auto"
                    >
                        {isLast ? (
                            <>
                                <CheckCircle size={14} /> Done!
                            </>
                        ) : (
                            <>
                                Next <ArrowRight size={14} />
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Arrow */}
            {arrow}
        </div>
    );
}
