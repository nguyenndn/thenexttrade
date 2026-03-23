export default function LeaderboardLoading() {
  return (
    <div className="space-y-4 pb-10 animate-in fade-in">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4">
        <div className="h-10 w-80 bg-gray-200 dark:bg-white/5 rounded-lg animate-pulse" />
        <div className="h-12 w-full max-w-md bg-gray-200 dark:bg-white/5 rounded-xl animate-pulse" />
      </div>

      {/* Podium skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-44 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 animate-pulse"
          />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 animate-pulse">
          <div className="space-y-0">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-14 border-b border-gray-200 dark:border-white/5"
              />
            ))}
          </div>
        </div>
        <div className="w-full lg:w-80 shrink-0">
          <div className="h-72 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
