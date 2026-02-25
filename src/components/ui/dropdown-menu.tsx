"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuProps {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function DropdownMenu({ children, open, onOpenChange }: DropdownMenuProps) {
    const [isInternalOpen, setIsInternalOpen] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    const isOpen = open !== undefined ? open : isInternalOpen;
    const setIsOpen = React.useCallback((value: boolean) => {
        if (onOpenChange) {
            onOpenChange(value);
        }
        if (open === undefined) {
            setIsInternalOpen(value);
        }
    }, [onOpenChange, open]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, setIsOpen]);

    return (
        <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
            <div ref={ref} className="relative inline-block text-left">
                {children}
            </div>
        </DropdownMenuContext.Provider>
    );
}

const DropdownMenuContext = React.createContext<{
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}>({ isOpen: false, setIsOpen: () => { } });

interface DropdownMenuTriggerProps {
    asChild?: boolean;
    children: React.ReactNode;
}

export function DropdownMenuTrigger({ asChild, children }: DropdownMenuTriggerProps) {
    const { isOpen, setIsOpen } = React.useContext(DropdownMenuContext);

    // If asChild is true, we clone the child and add onClick
    // Otherwise we wrap in a button

    const toggle = () => setIsOpen(!isOpen);

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
                (children as React.ReactElement<any>).props.onClick?.(e);
                toggle();
            }
        });
    }

    return (
        <button onClick={toggle} type="button">
            {children}
        </button>
    );
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    align?: "start" | "end" | "center";
}

export function DropdownMenuContent({ children, align = "center", className, ...props }: DropdownMenuContentProps) {
    const { isOpen } = React.useContext(DropdownMenuContext);

    if (!isOpen) return null;

    const alignmentClasses = {
        start: "left-0",
        end: "right-0",
        center: "left-1/2 -translate-x-1/2",
    };

    return (
        <div
            className={cn(
                "absolute z-[150] mt-2 min-w-[8rem] overflow-hidden rounded-md border border-gray-100 bg-white p-1 text-gray-950 shadow-md dark:border-white/10 dark:bg-[#1E2028] dark:text-gray-50",
                alignmentClasses[align],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    inset?: boolean;
}

export function DropdownMenuItem({ className, inset, children, ...props }: DropdownMenuItemProps) {
    const { setIsOpen } = React.useContext(DropdownMenuContext);

    return (
        <button
            className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:hover:bg-white/10 dark:hover:text-gray-50 dark:focus:bg-white/10 dark:focus:text-gray-50",
                inset && "pl-8",
                className
            )}
            onClick={(e) => {
                props.onClick?.(e);
                setIsOpen(false);
            }}
            {...props}
        >
            {children}
        </button>
    );
}

export function DropdownMenuLabel({ className, inset, ...props }: React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }) {
    return (
        <div className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)} {...props} />
    );
}

export function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("-mx-1 my-1 h-px bg-gray-100 dark:bg-white/10", className)} {...props} />
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
        <button
            className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:hover:bg-white/10 dark:hover:text-gray-50 dark:focus:bg-white/10 dark:focus:text-gray-50",
                className
            )}
            onClick={(e) => {
                e.preventDefault();
                onCheckedChange?.(!checked);
                // Keep menu open for multiple selections? usually yes for checkboxes.
                // But the context closes it on click in MenuItem.
                // Here we override onClick.
                // If we want it to verify, we shouldn't close it?
                // The user usually wants toggling multiple things.
                // So do NOT call setIsOpen(false).
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
        </button>
    );
}
