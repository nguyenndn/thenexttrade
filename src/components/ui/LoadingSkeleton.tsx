"use client";

import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4", className)}>
      <div className="flex gap-4">
        <div className="h-20 w-20 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/4 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function ArticleCardSkeleton({ count = 3 }: LoadingSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("h-[500px] rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse", className)}>
      <div className="h-full w-full flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="h-8 w-64 mx-auto rounded bg-slate-300 dark:bg-slate-700 animate-pulse" />
          <div className="h-4 w-48 mx-auto rounded bg-slate-300 dark:bg-slate-700 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function StatsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse mb-4" />
          <div className="h-8 w-16 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
      <div className="p-4 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="flex-1 h-4 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
      <StatsSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton className="h-[300px]" />
        <CardSkeleton className="h-[300px]" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse" />
      <main className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <HeroSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <ArticleCardSkeleton count={3} />
            </div>
            <div className="space-y-4">
              <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <ArticleCardSkeleton count={2} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function HomeFeedSkeleton() {
  return (
    <div className="pt-24 pb-8  mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        <div className="lg:col-span-2 space-y-4">
          <HeroSkeleton />
        </div>
        <div className="space-y-4 flex flex-col h-full min-h-[400px]">
          <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse mb-4" />
          <ArticleCardSkeleton count={4} />
        </div>
      </div>
      <div className="space-y-8">
        <div className="h-10 w-48 mx-auto rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="flex gap-4 justify-center">
          <div className="h-12 w-24 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-12 w-24 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-12 w-24 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-12 w-24 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
        <StatsSkeleton className="mt-8" />
      </div>
    </div>
  );
}
