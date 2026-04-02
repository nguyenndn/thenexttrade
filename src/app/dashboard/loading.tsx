export default function Loading() {
  return (
    <div className="h-full w-full min-h-[60vh] flex flex-col items-center justify-center gap-6">
      <div className="relative w-16 h-16">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-900/20"></div>
        {/* Spinning Gradient Segment */}
        <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        
        {/* Center Pulse Dot */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-indigo-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.6)]"></div>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 tracking-wide animate-pulse">
          Loading dashboard...
        </span>
        <div className="flex gap-1.5 justify-center">
            <span className="w-1.5 h-1.5 bg-indigo-400/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 bg-indigo-400/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 bg-indigo-400/60 rounded-full animate-bounce"></span>
        </div>
      </div>
    </div>
  );
}
