"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, Download, FolderOpen, Copy, RefreshCw, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button"; // Check if Button exists or use standard button

type WizardType = "MT5_EA" | "MT5_INDICATOR";

interface InstallationWizardProps {
    type: WizardType;
}

export function InstallationWizard({ type }: InstallationWizardProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            title: "Download File",
            description: `Download the ${type === "MT5_EA" ? "Expert Advisor" : "Indicator"} file (.ex5) from your dashboard.`,
            icon: Download,
            content: (
                <div className="bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4 text-green-700 dark:text-green-400 font-bold">
                        <Download size={20} />
                        <span>Download from Dashboard</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        Ensure you save the file to an easily accessible location like your <strong>Desktop</strong> or <strong>Downloads</strong> folder.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-3 rounded-lg">
                        <Info size={14} />
                        <span>Do not rename the file after downloading.</span>
                    </div>
                </div>
            )
        },
        {
            title: "Open Data Folder",
            description: "Locate the correct folder in your MetaTrader 5 terminal.",
            icon: FolderOpen,
            content: (
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        In your MT5 terminal, click on <strong>File</strong> in the top menu, then select <strong>Open Data Folder</strong>.
                    </p>
                    <div className="bg-gray-100 dark:bg-white/5 p-4 rounded-xl font-mono text-xs text-gray-500 dark:text-gray-400">
                        File &gt; Open Data Folder
                    </div>
                </div>
            )
        },
        {
            title: "Navigate to Folder",
            description: `Go to the MQL5 folder and find the ${type === "MT5_EA" ? "Experts" : "Indicators"} directory.`,
            icon: FolderOpen,
            content: (
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        Open the <strong>MQL5</strong> folder. Inside, find and open the
                        <strong className="text-gray-900 dark:text-white mx-1">
                            {type === "MT5_EA" ? "Experts" : "Indicators"}
                        </strong>
                        folder.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <FolderOpen size={16} />
                        <span>MQL5</span>
                        <ChevronRight size={14} />
                        <span className="font-bold text-gray-900 dark:text-white">{type === "MT5_EA" ? "Experts" : "Indicators"}</span>
                    </div>
                </div>
            )
        },
        {
            title: "Copy File",
            description: "Move the downloaded .ex5 file into the target folder.",
            icon: Copy,
            content: (
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                        <Copy size={24} />
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                        Paste the <strong>.ex5</strong> file here
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Make sure the file extension remains .ex5
                    </p>
                </div>
            )
        },
        {
            title: "Refresh & Activate",
            description: "Update your Navigator panel to see the new tool.",
            icon: RefreshCw,
            content: (
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        Right-click on the <strong>Navigator</strong> panel in MT5 (usually on the left side) and select <strong>Refresh</strong>.
                    </p>
                    <div className="bg-gray-100 dark:bg-white/5 p-3 rounded-lg flex items-center gap-3">
                        <RefreshCw size={16} className="text-gray-500" />
                        <span className="text-sm font-medium">Refresh</span>
                    </div>
                    <p className="text-sm text-gray-500">
                        Your new {type === "MT5_EA" ? "Expert Advisor" : "Indicator"} should now appear in the list!
                    </p>
                </div>
            )
        }
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(curr => curr + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(curr => curr - 1);
        }
    };

    const progress = ((currentStep + 1) / steps.length) * 100;
    const CurrentIcon = steps[currentStep].icon;

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Progress Header */}
            <div className="mb-8">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                        Step {currentStep + 1} of {steps.length}
                    </span>
                    <span className="text-xs font-bold text-primary">
                        {Math.round(progress)}% Complete
                    </span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Step Card */}
            <div className="bg-white dark:bg-[#151925] border border-gray-100 dark:border-white/5 rounded-3xl p-8 shadow-xl shadow-gray-200/50 dark:shadow-none min-h-[400px] flex flex-col relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-[0.02] pointer-events-none">
                    <CurrentIcon size={200} />
                </div>

                <div className="flex-1 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold uppercase tracking-wider mb-6">
                        STEP {currentStep + 1}
                    </div>

                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        {steps[currentStep].title}
                    </h2>

                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 leading-relaxed">
                        {steps[currentStep].description}
                    </p>

                    <div className="mt-4">
                        {steps[currentStep].content}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-12 pt-8 border-t border-gray-100 dark:border-white/5 flex items-center justify-between relative z-10">
                    <button
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all",
                            currentStep === 0
                                ? "text-gray-300 dark:text-gray-700 cursor-not-allowed"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                        )}
                    >
                        <ChevronLeft size={18} />
                        Previous
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={currentStep === steps.length - 1}
                        className={cn(
                            "flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg",
                            currentStep === steps.length - 1
                                ? "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 cursor-default"
                                : "bg-primary hover:bg-[#00A870] text-white shadow-primary/20 hover:scale-105 active:scale-95"
                        )}
                    >
                        {currentStep === steps.length - 1 ? (
                            <>Type "Finish" to Done <CheckCircle size={18} /></>
                        ) : (
                            <>Next <ChevronRight size={18} /></>
                        )}
                    </button>
                </div>
            </div>

            {/* Step Indicators */}
            <div className="flex justify-center gap-3 mt-8">
                {steps.map((_, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "w-2.5 h-2.5 rounded-full transition-all duration-300",
                            idx === currentStep
                                ? "bg-primary scale-125"
                                : idx < currentStep
                                    ? "bg-primary"
                                    : "bg-gray-200 dark:bg-white/10"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}
