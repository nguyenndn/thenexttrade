"use client";

import React, { useState, useEffect } from "react";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
  type?: string;
}

interface WidgetGridProps {
  layout: LayoutItem[];
  onLayoutChange: (layout: LayoutItem[]) => void;
  isEditable?: boolean;
  children: React.ReactNode;
}

export function WidgetGrid({ layout, onLayoutChange, isEditable = false, children }: WidgetGridProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLayoutChange = (currentLayout: readonly any[], allLayouts: any) => {
    // Only call the prop callback if we're actually in edit mode,
    // otherwise react-grid-layout might trigger initial onLayoutChange 
    // and overwrite things when we don't want it to
    if (isEditable) {
      // Use allLayouts.lg to ensure we are saving the master layout, 
      // not a compressed layout from a smaller breakpoint which could drop items or corrupt widths.
      onLayoutChange(allLayouts.lg || currentLayout as LayoutItem[]);
    }
  };

  if (!mounted) return null;

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{
        lg: layout,
        md: layout,
        sm: layout,
        xs: layout,
        xxs: layout
      }}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 240, md: 240, sm: 120, xs: 60, xxs: 20 }}
      rowHeight={5} // Finer vertical sizing steps (5px base height)
      onDragStop={handleLayoutChange}
      onResizeStop={handleLayoutChange}
      isDraggable={isEditable}
      isResizable={isEditable}
      resizeHandles={["se", "sw"]}
      margin={[0, 0]}
      containerPadding={[0, 0]}
      useCSSTransforms={true}
    >
      {children}
    </ResponsiveGridLayout>
  );
}
