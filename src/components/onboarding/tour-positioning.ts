import type { TourPlacement } from "./tour-steps";

export interface TargetBox {
    top: number;
    left: number;
    width: number;
    height: number;
}

export function computeCardPosition(
    box: TargetBox,
    cardW: number,
    cardH: number,
    preferred: TourPlacement
): { top: number; left: number } {
    const gap = 14;
    const margin = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const fitsRight = box.left + box.width + gap + cardW <= vw - margin;
    const fitsLeft = box.left - gap - cardW >= margin;
    const fitsBottom = box.top + box.height + gap + cardH <= vh - margin;

    let placement: TourPlacement = preferred;
    if (preferred === "right" && !fitsRight) {
        placement = fitsBottom ? "bottom" : fitsLeft ? "left" : "top";
    } else if (preferred === "left" && !fitsLeft) {
        placement = fitsRight ? "right" : "bottom";
    } else if (preferred === "bottom" && !fitsBottom) {
        placement = "top";
    }

    let top = box.top;
    let left = box.left;

    if (placement === "right") {
        left = box.left + box.width + gap;
        top = box.top + Math.min(24, Math.max(0, (box.height - cardH) / 2));
    } else if (placement === "left") {
        left = box.left - cardW - gap;
        top = box.top;
    } else if (placement === "bottom") {
        top = box.top + box.height + gap;
        left = box.left + (box.width - cardW) / 2;
    } else {
        top = box.top - cardH - gap;
        left = box.left + (box.width - cardW) / 2;
    }

    return {
        left: Math.min(
            Math.max(margin, left),
            Math.max(margin, vw - cardW - margin)
        ),
        top: Math.min(
            Math.max(margin, top),
            Math.max(margin, vh - cardH - margin)
        ),
    };
}
