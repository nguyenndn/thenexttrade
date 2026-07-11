"use client";

import React from "react";

export const ButtonSizeContext = React.createContext<'sm' | 'md' | 'lg' | 'icon' | 'smd' | null>(null);

export function AdminButtonSizeProvider({ children }: { children: React.ReactNode }) {
    return (
        <ButtonSizeContext.Provider value="smd">
            {children}
        </ButtonSizeContext.Provider>
    );
}
