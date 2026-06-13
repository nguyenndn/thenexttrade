import Link from "next/link";
import { Cog, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = {
 title: "System Upgrade | The Next Trade",
 description: "We're currently upgrading our platform. Please check back shortly.",
};

export default async function MaintenancePage() {
 // Direct server-side check — if maintenance is OFF, redirect away
 let isMaintenanceOn = true;
 try {
 const record = await prisma.systemSetting.findUnique({
 where: { key: "site_config" },
 });
 const config = (record?.value as Record<string, unknown>) || {};
 isMaintenanceOn = config.maintenanceMode === true;
 } catch (e) {
 // If DB fails, assume we're in maintenance or just render the page to be safe
 }

 if (!isMaintenanceOn) {
 redirect('/');
 }

 return (
 <div className="min-h-screen relative flex items-center justify-center bg-[#F8FAFC] overflow-hidden selection:bg-[#00C888]/20 font-sans">
 {/* Premium Light Background Gradient */}
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00C888]/10 via-white/50 to-[#F8FAFC] z-0"></div>
 
 {/* Grid Pattern overlay - Light mode */}
 <div 
 className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] z-0 opacity-60"
 style={{ 
 WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 80%)',
 maskImage: 'radial-gradient(circle at center, black, transparent 80%)' 
 }}
 ></div>

 {/* Main Content Container (Glassmorphism Light) */}
 <div className="relative z-10 max-w-lg w-full mx-4">
 <div className="backdrop-blur-xl bg-white/70 border border-white rounded-[32px] p-8 sm:p-12 text-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05),0_0_60px_-15px_rgba(0,200,136,0.15)] relative overflow-hidden">
 
 {/* Inner glowing orbs */}
 <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#00C888] rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-pulse" style={{ animationDuration: '4s' }}></div>
 <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-10"></div>

 {/* Animated Icon Group */}
 <div className="relative mx-auto w-[100px] h-[100px] mb-8 group">
 <div className="absolute inset-0 bg-[#00C888]/20 rounded-3xl animate-pulse blur-xl group-hover:bg-[#00C888]/30 transition-all duration-500"></div>
 <div className="relative w-full h-full bg-white border border-dashboard rounded-3xl flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md">
 <Cog size={44} className="text-[#00C888] animate-[spin_4s_linear_infinite]" strokeWidth={2} />
 <div className="absolute bottom-2 right-2 bg-white rounded-full p-1 border border-dashboard shadow-md">
 <Sparkles size={16} className="text-amber-400 animate-pulse" strokeWidth={2.5} />
 </div>
 </div>
 </div>

 {/* Status Badge */}
 <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00C888]/10 border border-[#00C888]/20 mb-6 backdrop-blur-sm shadow-sm">
 <span className="relative flex h-2 w-2">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C888] opacity-75"></span>
 <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00C888]"></span>
 </span>
 <span className="text-xs font-bold text-[#00C888] uppercase tracking-wider">System Upgrade</span>
 </div>

 {/* Typography */}
 <h1 className="text-[36px] sm:text-[42px] font-black text-slate-900 mb-4 tracking-tight leading-tight">
 We're Upgrading
 </h1>
 <p className="text-slate-500 text-[15px] mb-10 leading-relaxed font-medium max-w-[90%] mx-auto">
 The Next Trade platform is currently undergoing scheduled maintenance to bring you powerful new features and better performance.
 </p>

 {/* Footer */}
 <div className="pt-6 border-t border-dashboard">
 <p className="text-[13px] text-slate-500 font-medium">
 Need immediate assistance?{" "}
 <a href="mailto:support@thenexttrade.com" className="text-slate-900 font-bold hover:text-[#00C888] transition-colors decoration-[#00C888]/40 underline underline-offset-4">
 Contact Support
 </a>
 </p>
 </div>
 </div>
 </div>
 </div>
 );
}
