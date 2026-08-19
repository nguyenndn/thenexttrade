"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { SPRING_SOFT } from "@/lib/animations";

interface DropdownMenuProps {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    className?: string;
}

export function DropdownMenu({
    children,
    open,
    onOpenChange,
    className,
}: DropdownMenuProps) {
    const [isInternalOpen, setIsInternalOpen] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const isOpen = open !== undefined ? open : isInternalOpen;
    const setIsOpen = React.useCallback(
        (value: boolean) => {
            if (onOpenChange) {
                onOpenChange(value);
            }
            if (open === undefined) {
                setIsInternalOpen(value);
            }
        },
        [onOpenChange, open]
    );

    React.useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            const isClickInsideTrigger = ref.current?.contains(
                event.target as Node
            );
            const isClickInsideContent = contentRef.current?.contains(
                event.target as Node
            );

            if (!isClickInsideTrigger && !isClickInsideContent) {
                setIsOpen(false);
            }
        };

        // Defer listener so it doesn't catch the same click that opened the menu
        const frameId = requestAnimationFrame(() => {
            document.addEventListener("mousedown", handleClickOutside);
        });

        return () => {
            cancelAnimationFrame(frameId);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, setIsOpen]);

    return (
        <DropdownMenuContext.Provider
            value={{ isOpen, setIsOpen, triggerRef, contentRef, mounted }}
        >
            <div
                ref={ref}
                className={cn(
                    "relative text-left",
                    className || "inline-block"
                )}
            >
                {children}
            </div>
        </DropdownMenuContext.Provider>
    );
}

const DropdownMenuContext = React.createContext<{
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
    contentRef: React.RefObject<HTMLDivElement | null>;
    mounted: boolean;
}>({
    isOpen: false,
    setIsOpen: () => {},
    triggerRef: { current: null },
    contentRef: { current: null },
    mounted: false,
});

interface DropdownMenuTriggerProps {
    asChild?: boolean;
    children: React.ReactNode;
}

export function DropdownMenuTrigger({
    asChild,
    children,
}: DropdownMenuTriggerProps) {
    const { isOpen, setIsOpen, triggerRef } =
        React.useContext(DropdownMenuContext);

    // If asChild is true, we clone the child and add onClick
    // Otherwise we wrap in a button

    const toggle = () => setIsOpen(!isOpen);

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            ref: triggerRef,
            onClick: (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                (children as React.ReactElement<any>).props.onClick?.(e);
                toggle();
            },
        });
    }

    return (
        <Button
            ref={triggerRef as any}
            variant="ghost"
            className="p-0 h-auto font-normal hover:bg-transparent"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggle();
            }}
            type="button"
        >
            {children}
        </Button>
    );
}

// Omit framer-motion's reserved props (onDrag/onAnimationStart/onTap/…): motion.div
// redefines them with its own signatures, so a raw HTMLAttributes spread would collide.
type DropdownMenuContentProps = Omit<
    React.HTMLAttributes<HTMLDivElement>,
    keyof MotionProps
> & {
    children: React.ReactNode;
    align?: "start" | "end" | "center";
};

export function DropdownMenuContent({
    children,
    align = "center",
    className,
    style: externalStyle,
    ...props
}: DropdownMenuContentProps & { style?: React.CSSProperties }) {
    const { isOpen, triggerRef, contentRef, mounted } =
        React.useContext(DropdownMenuContext);
    const [position, setPosition] = React.useState({
        top: 0,
        left: 0,
        width: 0,
    });

    React.useEffect(() => {
        if (isOpen && triggerRef.current) {
            const updatePosition = () => {
                const triggerRect = triggerRef.current!.getBoundingClientRect();

                let top = triggerRect.bottom + 4;
                let left = triggerRect.left;
                const width = triggerRect.width;

                if (contentRef.current) {
                    const contentRect =
                        contentRef.current.getBoundingClientRect();
                    if (align === "end") {
                        left = triggerRect.right - contentRect.width;
                    } else if (align === "center") {
                        left =
                            triggerRect.left +
                            triggerRect.width / 2 -
                            contentRect.width / 2;
                    }

                    if (top + contentRect.height > window.innerHeight) {
                        top = triggerRect.top - contentRect.height - 4;
                    }
                    if (left < 4) left = 4;
                    if (left + contentRect.width > window.innerWidth - 4) {
                        left = window.innerWidth - contentRect.width - 4;
                    }
                }

                setPosition({ top, left, width });
            };

            updatePosition();
            setTimeout(updatePosition, 0);

            window.addEventListener("resize", updatePosition);
            window.addEventListener("scroll", updatePosition, true);
            return () => {
                window.removeEventListener("resize", updatePosition);
                window.removeEventListener("scroll", updatePosition, true);
            };
        }
    }, [isOpen, triggerRef, align]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={contentRef}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={SPRING_SOFT}
                    className={cn(
                        "fixed z-[200] min-w-[8rem] overflow-hidden rounded-md border border-dashboard bg-white p-1 text-gray-950 shadow-md dark:bg-[#1E2028] dark:text-gray-50",
                        className
                    )}
                    {...props}
                    style={{
                        ...externalStyle,
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                        minWidth: `${position.width}px`,
                        transformOrigin: "top",
                    }}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    inset?: boolean;
}

export function DropdownMenuItem({
    className,
    inset,
    children,
    onClick,
    ...props
}: DropdownMenuItemProps) {
    const { setIsOpen } = React.useContext(DropdownMenuContext);

    return (
        <Button
            variant="ghost"
            className={cn(
                "relative flex w-full h-auto cursor-default font-normal justify-start select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 hover:text-gray-700 focus:bg-gray-100 focus:text-gray-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:hover:bg-white/10 dark:hover:text-gray-50 dark:focus:bg-white/10 dark:focus:text-gray-50",
                inset && "pl-8",
                className
            )}
            {...props}
            onClick={(e) => {
                onClick?.(e);
                setIsOpen(false);
            }}
        >
            {children}
        </Button>
    );
}

export function DropdownMenuLabel({
    className,
    inset,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }) {
    return (
        <div
            className={cn(
                "px-2 py-1.5 text-sm font-semibold",
                inset && "pl-8",
                className
            )}
            {...props}
        />
    );
}

export function DropdownMenuSeparator({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "-mx-1 my-1 h-px bg-gray-100 dark:bg-white/10",
                className
            )}
            {...props}
        />
    );
}

export function DropdownMenuCheckboxItem({
    className,
    children,
    checked,
    onCheckedChange,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}) {
    const { setIsOpen } = React.useContext(DropdownMenuContext);

    return (
        <Button
            variant="ghost"
            className={cn(
                "relative flex w-full h-auto cursor-default font-normal justify-start select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-gray-100 hover:text-gray-700 focus:bg-gray-100 focus:text-gray-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:hover:bg-white/10 dark:hover:text-gray-50 dark:focus:bg-white/10 dark:focus:text-gray-50",
                className
            )}
            onClick={(e) => {
                e.preventDefault();
                onCheckedChange?.(!checked);
            }}
            {...props}
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {checked && (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                    >
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                )}
            </span>
            {children}
        </Button>
    );
}
