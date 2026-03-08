import { CardSkeleton, HeroSkeleton } from "@/components/ui/LoadingSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 animate-pulse" />
      <main className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HeroSkeleton className="h-[300px] mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton className="h-[200px]" />
          <CardSkeleton className="h-[200px]" />
          <CardSkeleton className="h-[200px]" />
        </div>
      </main>
    </div>
  );
}
