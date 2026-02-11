import { Metadata } from "next";
import { Logo } from "@/components/ui/Logo";
import Image from "next/image";

export const metadata: Metadata = {
  title: {
    template: "%s | GSN CRM",
    default: "Authentication | GSN CRM",
  },
  description: "Sign in or create an account to access GSN CRM trading tools, academy, and journal.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0E14] text-white p-4 font-outfit">
      {/* Container */}
      <div className="flex w-full max-w-6xl items-center justify-center lg:justify-between gap-12 lg:gap-24">

        {/* LEFT: Form Section */}
        <div className="w-full lg:w-[480px] shrink-0">
          <div className="mb-8">
            <Logo textClassName="text-white" />
          </div>
          {children}
        </div>

        {/* RIGHT: Content/Features (Hidden on mobile) */}
        <div className="hidden lg:flex flex-col flex-1 max-w-lg">
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            Build Your Trading<br />
            <span className="text-primary">Edge</span>
          </h2>
          <p className="text-lg text-gray-400 mb-10 leading-relaxed">
            Stop guessing and start improving. Gain deep insights into your habits, master your psychology, and refine your strategy with data-driven journaling.
          </p>

          <div className="flex flex-col gap-4">
            {/* Card 1 */}
            <div className="bg-[#151925] p-5 rounded-xl flex items-center gap-5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-lg text-primary">Data-Driven Insights</h3>
                <p className="text-sm text-gray-500">Identify patterns and optimize your win rate</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#151925] p-5 rounded-xl flex items-center gap-5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#2F80ED]/10 flex items-center justify-center text-[#2F80ED]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" /><path d="M8.5 8.5v.01" /><path d="M16 12v.01" /><path d="M12 16v.01" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#2F80ED]">Psychology Mastery</h3>
                <p className="text-sm text-gray-500">Train your mind for disciplined execution</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#151925] p-5 rounded-xl flex items-center gap-5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#A855F7]/10 flex items-center justify-center text-[#A855F7]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#A855F7]">Smart Trade Journal</h3>
                <p className="text-sm text-gray-500">Seamlessly log and review every setup</p>
              </div>
            </div>
          </div>

          <div className="flex gap-8 mt-10 text-xs text-gray-600 font-semibold">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div> Bank-level security
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-600"></div> 24/7 support
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
