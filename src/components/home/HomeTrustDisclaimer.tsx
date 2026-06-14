import { ShieldCheck } from "lucide-react";

export function HomeTrustDisclaimer() {
  return (
    <div className="w-full border-t border-dashboard bg-gray-50/30 dark:bg-white/[0.005]">
      <section className="py-4 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-2 text-center">
        <ShieldCheck size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
        <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-500 font-medium leading-relaxed">
          Education and analytics only. TheNextTrade does not provide financial advice. Your trade data is used to help you review your own decisions.
        </p>
      </section>
    </div>
  );
}
