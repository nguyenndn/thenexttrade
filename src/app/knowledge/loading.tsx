import { ArticleCardSkeleton } from "@/components/ui/LoadingSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 animate-pulse" />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <ArticleCardSkeleton count={6} />
          </div>
          <div className="space-y-4">
            <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}
