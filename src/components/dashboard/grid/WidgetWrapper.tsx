"use client";

import React from "react";
import { GripHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetWrapperProps {
  id: string;
  isEditable?: boolean;
  onRemove?: (id: string) => void;
  children: React.ReactNode;
}

export function WidgetWrapper({ id, isEditable = false, onRemove, children }: WidgetWrapperProps) {
  return (
    <div className={cn("w-full h-full relative group rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col", isEditable ? "ring-1 ring-amber-500/30 border-amber-500/50 dark:border-amber-400/50 shadow-md shadow-amber-500/5" : "transition-all duration-200")}>
      
      {/* Edit Mode Overlay */}
      {isEditable && (
        <div className="absolute top-0 left-0 right-0 h-8 bg-amber-500/5 dark:bg-amber-500/[0.03] border-b border-amber-500/20 dark:border-amber-400/20 flex items-center justify-between px-4 z-10 cursor-grab active:cursor-grabbing handle">
          <div className="flex items-center gap-1.5 text-gray-500">
            <GripHorizontal className="w-4 h-4" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Drag to move</span>
          </div>
          
          <button 
            onClick={() => onRemove?.(id)}
            className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className={cn("flex-1 overflow-hidden", isEditable && "pt-8 pointer-events-none opacity-80")}>
        {children}
      </div>
    </div>
  );
}
