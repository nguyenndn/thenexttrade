import React from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { DynamicFirefly } from "@/components/ui/DynamicFirefly";

interface ToolsPageShellProps {
  children: React.ReactNode;
  className?: string;
  mainClassName?: string;
  maxWidth?: string; // e.g. "max-w-6xl"
}

export function ToolsPageShell({
  children,
  className = "",
  mainClassName = "",
  maxWidth = "max-w-6xl"
}: ToolsPageShellProps) {
  return (
    <div className={`min-h-screen flex flex-col bg-slate-50/60 dark:bg-[#0F1117] text-gray-700 dark:text-white relative overflow-hidden ${className}`}>
      {/* 1. Grid Pattern Background matching homepage */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      {/* 2. Brand glow blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-r from-gold/10 via-primary/5 to-transparent dark:from-gold/5 dark:via-primary/5 dark:to-transparent rounded-full blur-[120px] pointer-events-none z-0" />

      {/* 3. Noise Background texture */}
      <div className="absolute inset-0 noise-bg opacity-[0.02] dark:opacity-[0.04] pointer-events-none z-0" />

      {/* 4. Dynamic Firefly effect */}
      <DynamicFirefly />

      <PublicHeader />

      <main className={`flex-1 pt-32 pb-16 relative z-10 ${mainClassName}`}>
        {/* Soft top section divider using a thin Gold line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent pointer-events-none" />

        <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          {children}
        </div>

        {/* Soft bottom section divider using a thin Gold line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent pointer-events-none" />
      </main>

      <ScrollToTop />
      <SiteFooter />
    </div>
  );
}
