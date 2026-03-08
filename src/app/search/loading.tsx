import { CardSkeleton } from "@/components/ui/LoadingSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 animate-pulse" />
      <main className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-10 w-full max-w-2xl rounded bg-slate-200 dark:bg-slate-800 animate-pulse mb-8" />
        <div className="h-6 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse mb-6" />
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </main>
    </div>
  );
}
