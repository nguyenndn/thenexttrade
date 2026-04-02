'use client';

import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
// If your project uses framer-motion, we animate. Otherwise, fallback to CSS transitions.

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    variant = 'danger',
    isLoading = false
}: ConfirmDialogProps) {
    const [render, setRender] = useState(isOpen);

    useEffect(() => {
        if (isOpen) setRender(true);
    }, [isOpen]);

    const handleAnimationEnd = () => {
        if (!isOpen) setRender(false);
    };

    if (!render) return null;

    const variantStyles = {
        danger: {
            icon: <Trash2 size={24} className="text-red-500" />,
            bg: "bg-red-50 dark:bg-red-500/10",
            buttonPrefix: "bg-red-500 hover:bg-red-600 focus:ring-red-500/50"
        },
        warning: {
            icon: <AlertTriangle size={24} className="text-orange-500" />,
            bg: "bg-orange-50 dark:bg-orange-500/10",
            buttonPrefix: "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500/50"
        },
        info: {
            icon: <AlertTriangle size={24} className="text-blue-500" />,
            bg: "bg-blue-50 dark:bg-blue-500/10",
            buttonPrefix: "bg-blue-500 hover:bg-blue-600 focus:ring-blue-500/50"
        }
    };

    const currentVariant = variantStyles[variant];

    return (
        <div 
            className={cn(
                "fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0",
                isOpen ? "animate-in fade-in duration-200" : "animate-out fade-out duration-200"
            )}
            onAnimationEnd={handleAnimationEnd}
        >
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" 
                onClick={!isLoading ? onCancel : undefined}
            />

            {/* Dialog Box */}
            <div 
                className={cn(
                    "relative w-full max-w-md bg-white dark:bg-[#1E2028] rounded-xl shadow-2xl overflow-hidden border border-gray-100 dark:border-white/10",
                    isOpen ? "animate-in zoom-in-95 slide-in-from-bottom-4 duration-300" : "animate-out zoom-out-95 slide-out-to-bottom-4 duration-200"
                )}
                role="alertdialog"
            >
                {/* Close Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="absolute top-4 right-4 p-2 w-10 h-10 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                    <X size={20} />
                </Button>

                <div className="p-6 pt-8 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                        {/* Icon */}
                        <div className={cn("p-3 rounded-full flex-shrink-0 mt-1", currentVariant.bg)}>
                            {currentVariant.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-2">
                            <h3 className="text-xl font-bold text-gray-700 dark:text-white mt-2 sm:mt-0">
                                {title}
                            </h3>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
                                {description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-gray-50 dark:bg-[#151925] px-6 py-4 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-gray-100 dark:border-white/5">
                    <Button
                        variant="ghost"
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-5 py-2.5 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={cn(
                            "px-5 py-2.5 rounded-xl font-bold text-white shadow-sm transition-all flex items-center justify-center gap-2 border-none",
                            currentVariant.buttonPrefix,
                            isLoading && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        {isLoading && (
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}
