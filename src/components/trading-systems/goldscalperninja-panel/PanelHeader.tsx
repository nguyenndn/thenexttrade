"use client";

import React from "react";

export function PanelHeader() {
    return (
        <div className="mb-2 text-center select-none">
            <div className="text-[22px] font-black leading-none tracking-tight text-[#ffd21f]">
                GoldScalperNinja v3.1
            </div>
            <div
                className="mx-auto mt-1.5 h-px w-40 border-t border-dashed border-[#ffd21f]/80"
                aria-hidden="true"
            />
        </div>
    );
}
