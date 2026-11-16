"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { usePathname } from "next/navigation";
import {
    type DashboardTourState,
    shouldAutoStartDashboardTour,
} from "@/lib/onboarding/tour-state";
import {
    type ResolvedTourStep,
    resolveVisibleTourSteps,
} from "./tour-steps";
import {
    hasShownTourInSession,
    markTourShownInSession,
    persistTourState,
    readLocalTourState,
} from "./tour-storage";
import { SpotlightOverlay } from "./SpotlightOverlay";

interface DashboardTourContextValue {
    isOpen: boolean;
    startTour: () => void;
}

const DashboardTourContext = createContext<DashboardTourContextValue>({
    isOpen: false,
    startTour: () => {},
});

export function useDashboardTour() {
    return useContext(DashboardTourContext);
}

export function DashboardTourProvider({
    children,
    initialTourState,
    onEnsureSidebarExpanded,
}: {
    children: React.ReactNode;
    initialTourState: DashboardTourState;
    onEnsureSidebarExpanded?: () => void;
}) {
    const pathname = usePathname();
    const [, setTourState] = useState<DashboardTourState>(initialTourState);
    const [steps, setSteps] = useState<ResolvedTourStep[]>([]);
    const [stepIndex, setStepIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const openWithFreshSteps = useCallback(() => {
        onEnsureSidebarExpanded?.();
        setTimeout(() => {
            const visible = resolveVisibleTourSteps();
            if (visible.length === 0) return;
            setSteps(visible);
            setStepIndex(0);
            setIsOpen(true);
        }, 120);
    }, [onEnsureSidebarExpanded]);

    useEffect(() => {
        if (pathname !== "/dashboard") {
            setIsOpen(false);
            return;
        }
        const merged = readLocalTourState(initialTourState);
        setTourState(merged);
        if (!shouldAutoStartDashboardTour(merged) || hasShownTourInSession()) {
            return;
        }

        const attemptAutoStart = () => {
            if (document.querySelector("[role='dialog']")) return false;
            const visible = resolveVisibleTourSteps();
            if (visible.length === 0) return false;

            const updated: DashboardTourState = {
                completed: merged.completed,
                views: merged.views + 1,
            };
            setTourState(updated);
            persistTourState(updated);
            markTourShownInSession();
            onEnsureSidebarExpanded?.();
            setSteps(visible);
            setStepIndex(0);
            setIsOpen(true);
            return true;
        };

        const timer = setTimeout(() => {
            if (attemptAutoStart()) return;
            const observer = new MutationObserver(() => {
                if (attemptAutoStart()) observer.disconnect();
            });
            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => observer.disconnect(), 15000);
        }, 900);

        return () => clearTimeout(timer);
    }, [pathname, initialTourState, onEnsureSidebarExpanded]);

    const markCompletedAndClose = useCallback(() => {
        setIsOpen(false);
        setTourState((prev) => {
            const updated: DashboardTourState = {
                completed: true,
                views: Math.max(1, prev.views),
            };
            persistTourState(updated);
            return updated;
        });
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
            if (e.key === "ArrowRight") {
                if (stepIndex >= steps.length - 1) markCompletedAndClose();
                else setStepIndex((i) => i + 1);
            }
            if (e.key === "ArrowLeft" && stepIndex > 0) {
                setStepIndex((i) => i - 1);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, stepIndex, steps.length, markCompletedAndClose]);

    const value = useMemo(
        () => ({ isOpen, startTour: openWithFreshSteps }),
        [isOpen, openWithFreshSteps]
    );
    const activeStep = isOpen ? steps[stepIndex] : undefined;

    return (
        <DashboardTourContext.Provider value={value}>
            {children}
            {activeStep && (
                <SpotlightOverlay
                    step={activeStep}
                    stepIndex={stepIndex}
                    totalSteps={steps.length}
                    onNext={() => {
                        if (stepIndex >= steps.length - 1) {
                            markCompletedAndClose();
                        } else {
                            setStepIndex((i) => i + 1);
                        }
                    }}
                    onPrev={() => setStepIndex((i) => Math.max(0, i - 1))}
                    onSkip={markCompletedAndClose}
                    onClose={() => setIsOpen(false)}
                />
            )}
        </DashboardTourContext.Provider>
    );
}
