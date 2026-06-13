import { Target, Plus, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function StrategyEmptyState({ onAdd }: { onAdd: () => void }) {
 return (
 <div className="text-center py-16 bg-white dark:bg-[#1E2028] rounded-xl border-2 border-dashed border-dashboard mt-8">
 {/* Animated Target Icon */}
 <div className="relative w-20 h-20 mb-6 mx-auto">
 {/* Glow ring */}
 <div className="absolute inset-0 rounded-full bg-primary/10 dark:bg-primary/5 animate-[ping-slow_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
 {/* Icon container with float */}
 <div className="relative w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center animate-[float_3s_ease-in-out_infinite]">
 <Target size={32} className="text-gray-500 dark:text-gray-300 animate-[spin-slow_8s_linear_infinite]" />
 {/* Crosshair pulse ring */}
 <div className="absolute inset-2 rounded-full border-2 border-dashed border-primary/20 dark:border-primary/10 animate-[spin-reverse_12s_linear_infinite]" />
 {/* Sparkle dots */}
 <div className="absolute -top-2 left-3 w-1.5 h-1.5 rounded-full bg-primary/40 animate-[sparkle-1_2.5s_ease-in-out_infinite_1.2s]" />
 <div className="absolute -bottom-1 -right-1 w-1 h-1 rounded-full bg-primary/30 animate-[sparkle-2_3s_ease-in-out_infinite_0.8s]" />
 <div className="absolute top-0 -right-2 w-1 h-1 rounded-full bg-primary/25 animate-[sparkle-3_2s_ease-in-out_infinite_1.5s]" />
 </div>
 </div>

 <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">
 No strategies yet
 </h3>
 <p className="text-gray-600 px-6 max-w-sm mx-auto mb-6">
 Create strategies to track which setups work best for you.
 Tag your trades and analyze their performance.
 </p>
 <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
 <Button variant="primary" onClick={onAdd}>
 <Plus size={18} strokeWidth={2.5} />
 Add Strategy
 </Button>
 <a href="/dashboard/academy">
 <Button
 variant="outline"
 className="gap-2 px-5 h-10 text-sm font-bold rounded-xl border-dashboard hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
 >
 <GraduationCap size={16} />
 Start Academy
 </Button>
 </a>
 </div>

 <style jsx>{`
 @keyframes float {
 0%, 100% { transform: translateY(0px); }
 50% { transform: translateY(-6px); }
 }
 @keyframes spin-slow {
 from { transform: rotate(0deg); }
 to { transform: rotate(360deg); }
 }
 @keyframes spin-reverse {
 from { transform: rotate(0deg); }
 to { transform: rotate(-360deg); }
 }
 @keyframes ping-slow {
 0% { transform: scale(1); opacity: 0.3; }
 75%, 100% { transform: scale(1.3); opacity: 0; }
 }
 @keyframes sparkle-1 {
 0%, 100% { opacity: 0; transform: scale(0); }
 50% { opacity: 1; transform: scale(1); }
 }
 @keyframes sparkle-2 {
 0%, 100% { opacity: 0; transform: scale(0); }
 60% { opacity: 1; transform: scale(1.2); }
 }
 @keyframes sparkle-3 {
 0%, 100% { opacity: 0; transform: scale(0); }
 40% { opacity: 0.8; transform: scale(1); }
 }
 `}</style>
 </div>
 );
}
