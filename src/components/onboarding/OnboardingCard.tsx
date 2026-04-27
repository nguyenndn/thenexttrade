"use client";
import type { CardComponentProps } from "onborda";
import { useOnborda } from "onborda";
import { X, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";

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
            className="relative bg-white dark:bg-[#1A1D27] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl w-[340px] overflow-hidden pointer-events-auto"
            style={{ zIndex: 99999 }}
        >
            {/* Progress Bar */}
            <div className="h-1 bg-gray-100 dark:bg-white/5">
                <div
                    className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
                    style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                />
            </div>

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                        {step.icon && (
                            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary text-lg">
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
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 pointer-events-auto"
                        aria-label="Close tour"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
                    {step.content}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                    {!isFirst ? (
                        <button
                            onClick={prevStep}
                            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors pointer-events-auto"
                        >
                            <ArrowLeft size={14} /> Back
                        </button>
                    ) : (
                        <span />
                    )}

                    <button
                        onClick={handleNext}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-primary to-emerald-500 rounded-lg hover:opacity-90 transition-opacity shadow-sm pointer-events-auto"
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
                    </button>
                </div>
            </div>

            {/* Arrow */}
            {arrow}
        </div>
    );
}
