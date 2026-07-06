"use client";

import React from "react";
import { Plus, GripHorizontal, Check } from "lucide-react";
import { AVAILABLE_WIDGETS, WidgetConfig } from "./WidgetRegistry";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";

interface WidgetCatalogueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (widget: WidgetConfig) => void;
  addedWidgetTypes?: string[];
}

export function WidgetCatalogueModal({ isOpen, onClose, onAddWidget, addedWidgetTypes = [] }: WidgetCatalogueModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-2xl gap-0 bg-white dark:bg-[#1A1D27] border-gray-200 dark:border-[#382F1D]">
        <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-[#382F1D] text-left">
          <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">Add Widget</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
            Select a widget to add to your dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)] custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {AVAILABLE_WIDGETS.map((widget) => {
              const isAdded = addedWidgetTypes.includes(widget.type);
              return (
                <div 
                  key={widget.type}
                  className={cn(
                    "group p-4 rounded-xl border border-gray-200 dark:border-[#2C2E3B] transition-all flex flex-col justify-between bg-white dark:bg-[#1E2028]",
                    isAdded 
                      ? "opacity-75 cursor-default" 
                      : "hover:border-amber-500/50 dark:hover:border-amber-400/50 hover:shadow-md cursor-pointer"
                  )}
                  onClick={isAdded ? undefined : () => {
                    onAddWidget(widget);
                  }}
                >
                  <div>
                    <h3 className={cn(
                      "font-bold text-gray-900 dark:text-gray-100 mb-1 transition-colors",
                      !isAdded && "group-hover:text-amber-500 dark:group-hover:text-amber-400"
                    )}>{widget.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{widget.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">
                      <GripHorizontal size={12} />
                      {widget.defaultW / 60}x{Math.round(widget.defaultH / 22)} Default
                    </div>
                    {isAdded ? (
                      <button 
                        type="button" 
                        disabled
                        className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-xl cursor-not-allowed opacity-90 border border-emerald-500/20"
                      >
                        <Check size={14} />
                        Added
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddWidget(widget);
                        }}
                        className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 group-hover:bg-amber-500/20 px-3 py-1.5 rounded-xl transition-colors"
                      >
                        <Plus size={14} />
                        Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
