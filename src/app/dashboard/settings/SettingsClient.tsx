"use client";

import { useState, useEffect } from 'react';
import { User, Save, Loader2, Camera, BarChart3, Search, ShieldCheck, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TRADING_GOALS = [
 { id: "track", label: "Track my trades", description: "Keep an organized record of all my entries and exits", icon: BarChart3 },
 { id: "mistakes", label: "Find my mistakes", description: "Identify patterns that cost me money", icon: Search },
 { id: "discipline", label: "Build discipline", description: "Follow my plan and manage risk consistently", icon: ShieldCheck },
 { id: "pro", label: "Prepare for Pro tools", description: "Get EA access, AI coaching, and advanced analytics", icon: Sparkles },
] as const;

export default function SettingsClient() {
 const router = useRouter();
 const [isLoading, setIsLoading] = useState(true);
 const [isSaving, setIsSaving] = useState(false);

 const [formData, setFormData] = useState({ name: '', email: '', bio: '', telegramId: '', country: '', image: '', tradingGoal: '' });

 useEffect(() => { fetchProfile(); }, []);

 const fetchProfile = async () => {
 try {
 const res = await fetch('/api/profile');
 if (res.ok) {
 const data = await res.json();
 setFormData({
 name: data.name || '',
 email: data.email || '',
 bio: data.bio || '',
 telegramId: data.telegramId || '',
 country: data.country || '',
 image: data.image || '',
 tradingGoal: data.tradingGoal || ''
 });
 }
 } catch { /* Failed to fetch */ }
 finally { setIsLoading(false); }
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setIsSaving(true);
 try {
 const res = await fetch('/api/profile', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 name: formData.name,
 bio: formData.bio,
 telegramId: formData.telegramId,
 country: formData.country,
 image: formData.image,
 tradingGoal: formData.tradingGoal
 })
 });
 if (!res.ok) {
 const text = await res.text();
 console.error("Settings save error:", text);
 throw new Error(text);
 }
 toast.success('Profile updated successfully!');
 router.refresh();
 } catch { toast.error('Something went wrong. Please try again.'); }
 finally { setIsSaving(false); }
 };

 if (isLoading) {
 return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-primary" size={28} /></div>;
 }

 return (
 <form onSubmit={handleSubmit} className="w-full space-y-5">

 {/* ── Unified Profile Card ── */}
 <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-dashboard overflow-hidden shadow-sm">

 {/* Gradient Banner + Avatar */}
 <div className="h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent dark:from-primary/30 dark:via-primary/15 dark:to-transparent relative">
 <div className="absolute inset-0 opacity-30"
 style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #00C888 0%, transparent 60%)' }} />
 </div>

 <div className="px-6 pb-5">
 <div className="flex items-end gap-5 -mt-12 mb-3">
 <div className="relative flex-shrink-0">
 <div className="w-[100px] h-[100px] rounded-xl overflow-hidden bg-gray-100 dark:bg-[#151925] border-4 border-white dark:border-[#0B0E14] shadow-lg">
 {formData.image ? (
 <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-gray-500">
 <User size={36} />
 </div>
 )}
 </div>
 <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors cursor-pointer">
 <Camera size={14} className="text-white" />
 <input
 type="file"
 accept="image/*"
 className="sr-only"
 onChange={(e) => {
 const file = e.target.files?.[0];
 if (file) {
 if (file.size > 1 * 1024 * 1024) return;
 const reader = new FileReader();
 reader.onloadend = () => {
 setFormData(prev => ({ ...prev, image: reader.result as string }));
 };
 reader.readAsDataURL(file);
 }
 }}
 />
 </label>
 </div>
 <div className="pb-1">
 <p className="text-sm font-bold text-gray-700 dark:text-white">{formData.name || 'Your Name'}</p>
 <p className="text-xs text-gray-500 mt-0.5">{formData.email || ''}</p>
 </div>
 </div>
 <p className="text-xs text-gray-400">JPG, PNG or GIF · Max 1MB · Recommended 400×400px</p>
 </div>

 {/* Personal Information Section */}
 <div className="border-t border-dashboard px-6 py-5 space-y-4">
 <div className="flex items-center gap-2.5 mb-1">
 <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
 <User size={14} className="text-primary" />
 </div>
 <h2 className="text-sm font-bold text-gray-700 dark:text-white">Personal Information</h2>
 </div>
 <div>
 <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1.5">Display Name</label>
 <input
 type="text"
 value={formData.name}
 onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
 className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#151925] border border-dashboard rounded-xl text-sm text-gray-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
 placeholder="Your full name"
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1.5">Telegram ID</label>
 <input
 type="text"
 value={formData.telegramId}
 onChange={(e) => setFormData(prev => ({ ...prev, telegramId: e.target.value }))}
 className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#151925] border border-dashboard rounded-xl text-sm text-gray-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
 placeholder="@username or Chat ID"
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1.5">Country</label>
 <input
 type="text"
 value={formData.country}
 onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
 className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#151925] border border-dashboard rounded-xl text-sm text-gray-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
 placeholder="e.g. Vietnam"
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1.5">Bio</label>
 <textarea
 value={formData.bio}
 onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
 rows={3}
 className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#151925] border border-dashboard rounded-xl text-sm text-gray-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none transition-all"
 placeholder="Tell us about your trading journey..."
 />
 <p className="text-xs text-gray-400 mt-1">{formData.bio.length}/200 characters</p>
 </div>
 </div>

 {/* Main Trading Goal Section */}
 <div className="border-t border-dashboard px-6 py-5 space-y-4">
 <div className="flex items-center gap-2.5 mb-1">
 <div className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
 <Sparkles size={14} className="text-amber-500" />
 </div>
 <h2 className="text-sm font-bold text-gray-700 dark:text-white">Main Trading Goal</h2>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {TRADING_GOALS.map((g) => {
 const Icon = g.icon;
 const isSelected = formData.tradingGoal === g.id;
 return (
 <button
 key={g.id}
 type="button"
 onClick={() => setFormData(prev => ({ ...prev, tradingGoal: g.id }))}
 className={cn(
 "flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all duration-200 w-full active:scale-[0.98]",
 isSelected
 ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-sm shadow-amber-500/10"
 : "border-dashboard bg-transparent hover:border-amber-500/35 dark:hover:border-amber-500/25 hover:bg-gray-50/50 dark:hover:bg-white/[0.01]"
 )}
 >
 <div className={cn(
 "p-2 rounded-lg shrink-0 transition-colors",
 isSelected ? "bg-amber-500/10 text-amber-500" : "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500"
 )}>
 <Icon size={18} />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-xs font-black text-gray-800 dark:text-white">{g.label}</p>
 <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium leading-relaxed">{g.description}</p>
 </div>
 {isSelected && (
 <Check size={14} className="text-amber-500 shrink-0" />
 )}
 </button>
 );
 })}
 </div>
 </div>

 {/* Save Footer */}
 <div className="px-6 py-4 border-t border-dashboard flex justify-end">
 <Button type="submit" variant="primary" size="smd" disabled={isSaving}>
 {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
 Save Changes
 </Button>
 </div>
 </div>
 </form>
 );
}
