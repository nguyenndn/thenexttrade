import { ShieldCheck, Target, AlertTriangle, Shield, CheckCircle2, XCircle } from "lucide-react";

export function EdgeInfoContent() {
 return (
 <div className="space-y-8 text-gray-700 dark:text-gray-300">
 {/* Introduction */}
 <section className="bg-white dark:bg-[#15171E] p-6 sm:p-8 rounded-2xl border border-dashboard dark:border-gray-800 shadow-sm">
 <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
 <Target className="text-amber-500 shrink-0" />
 What Is Edge?
 </h2>
 <p className="leading-relaxed">
 Edge is TheNextTrade's virtual score for disciplined learning, honest trade review, and risk-aware improvement. It helps you track consistency across Academy lessons, journal habits, streaks, and trading review workflows.
 </p>
 <p className="mt-4 leading-relaxed">
 Rather than tracking profits, Edge focuses on the habits that lead to long-term success. It represents the effort you put into developing your trading edge.
 </p>
 </section>

 {/* Tiers */}
 <section>
 <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-6">Ranks & Progress</h2>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
 {[
 { name: "Apprentice", edge: "0", color: "text-[#CD7F32]", bg: "bg-[#CD7F32]/10" },
 { name: "Builder", edge: "1,000", color: "text-[#C0C0C0]", bg: "bg-[#C0C0C0]/10" },
 { name: "Analyst", edge: "5,000", color: "text-[#FFD700]", bg: "bg-[#FFD700]/10" },
 { name: "Strategist", edge: "15,000", color: "text-[#E5E4E2]", bg: "bg-[#E5E4E2]/10" },
 { name: "Risk Manager", edge: "30,000", color: "text-[#06B6D4]", bg: "bg-[#06B6D4]/10" },
 { name: "Operator", edge: "50,000+", color: "text-[#FF6B35]", bg: "bg-[#FF6B35]/10" }
 ].map((tier) => (
 <div key={tier.name} className="p-3 sm:p-4 rounded-xl border border-dashboard dark:border-gray-800 flex flex-col items-center justify-center text-center bg-white dark:bg-[#15171E] shadow-sm">
 <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${tier.bg} flex items-center justify-center mb-2 sm:mb-3 shrink-0`}>
 <Shield className={`w-5 h-5 sm:w-6 sm:h-6 ${tier.color}`} />
 </div>
 <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">{tier.name}</h3>
 <span className="text-xs sm:text-sm text-gray-500">{tier.edge} Edge</span>
 </div>
 ))}
 </div>
 </section>

 <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
 {/* What Earns Edge */}
 <section className="flex flex-col h-full">
 <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
 <CheckCircle2 className="text-emerald-500 shrink-0" />
 How You Earn Edge
 </h2>
 <ul className="space-y-3 bg-white dark:bg-[#15171E] p-5 sm:p-6 rounded-xl border border-dashboard dark:border-gray-800 shadow-sm flex-1 text-sm sm:text-base">
 <li className="flex items-start gap-3">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
 <span><strong>Academy Progress:</strong> Completing lessons and passing quizzes.</span>
 </li>
 <li className="flex items-start gap-3">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
 <span><strong>Consistency:</strong> Daily check-ins and maintaining platform streaks.</span>
 </li>
 <li className="flex items-start gap-3">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
 <span><strong>Reviewing Trades:</strong> Writing journal entries and analyzing trading data.</span>
 </li>
 <li className="flex items-start gap-3">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
 <span><strong>Community:</strong> Winning platform challenges or milestones.</span>
 </li>
 </ul>
 </section>

 {/* What Does Not Earn Edge */}
 <section className="flex flex-col h-full">
 <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
 <XCircle className="text-red-500 shrink-0" />
 What Edge Does Not Reward
 </h2>
 <ul className="space-y-3 bg-white dark:bg-[#15171E] p-5 sm:p-6 rounded-xl border border-dashboard dark:border-gray-800 shadow-sm flex-1 text-sm sm:text-base">
 <li className="flex items-start gap-3">
 <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
 <span><strong>Profitability:</strong> High returns do not grant more Edge.</span>
 </li>
 <li className="flex items-start gap-3">
 <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
 <span><strong>Trading Volume:</strong> Overtrading is discouraged and unrewarded.</span>
 </li>
 <li className="flex items-start gap-3">
 <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
 <span><strong>Purchases:</strong> Edge cannot be bought.</span>
 </li>
 </ul>
 </section>
 </div>

 {/* Fair Use Rules */}
 <section className="bg-gray-50 dark:bg-gray-800/30 p-5 sm:p-6 rounded-xl border border-dashboard dark:border-gray-800">
 <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
 <ShieldCheck className="text-primary shrink-0" />
 Fair Use Rules
 </h2>
 <p className="text-sm">
 Edge is designed to foster a healthy trading community. Spamming journal entries, utilizing bots, or attempting to artificially manipulate your Edge score will result in the forfeiture of your rank and potential account restrictions. We actively monitor for abusive patterns.
 </p>
 </section>

 {/* Legal Disclaimer */}
 <section className="bg-amber-50 dark:bg-amber-900/10 p-5 sm:p-6 rounded-xl border border-amber-200 dark:border-amber-900/30">
 <h2 className="text-base sm:text-lg font-bold text-amber-900 dark:text-amber-500 flex items-center gap-2 mb-3">
 <AlertTriangle className="text-amber-600 dark:text-amber-500 shrink-0" />
 Important Disclaimer
 </h2>
 <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200/80 uppercase tracking-wide leading-relaxed font-semibold">
 Edge is not money, crypto, a financial asset, or a reward with real-world cash value. It cannot be sold, transferred, redeemed, or exchanged.
 </p>
 </section>
 </div>
 );
}
