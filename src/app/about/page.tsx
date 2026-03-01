import { Metadata } from 'next';
import { Target, Shield, Zap, Users, Globe2, TrendingUp, ChevronRight, Activity, Code, Award } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'About Us | The Next Trade',
    description: 'Learn about The Next Trade, our mission to empower global traders with institutional-grade tools and education.',
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0F1117] text-gray-900 dark:text-white overflow-hidden relative">
            
            {/* Background Glows (Premium Aesthetic) */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-primary/10 dark:bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

            <PublicHeader />
            
            <main className="py-24 relative z-10">
                {/* 1. Hero Section */}
                <section className="px-4 mb-24">
                    <div className="max-w-4xl mx-auto text-center space-y-8 mt-12">
                        <div className="inline-flex items-center justify-center p-3 rounded-xl bg-cyan-500/10 text-cyan-500 mb-2 ring-4 ring-cyan-500/5 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500">
                            <Globe2 size={40} strokeWidth={1.5} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-900 dark:text-white leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700">
                            Building the Future of <br className="hidden md:block"/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">Retail Trading</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-[900ms]">
                            We are constructing the ultimate ecosystem for modern traders, combining institutional-grade analytics with radically accessible education.
                        </p>
                    </div>
                </section>

                {/* 2. Stats Banner */}
                <section className="px-4 mb-32 max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {[
                            { label: "Active Traders", value: "50K+", icon: Users },
                            { label: "Systems Built", value: "1,200+", icon: Code },
                            { label: "Uptime", value: "99.99%", icon: Activity },
                            { label: "Awards Won", value: "15+", icon: Award }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-all group">
                                <stat.icon className="w-8 h-8 mx-auto mb-4 text-cyan-500 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                                <div className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-1">{stat.value}</div>
                                <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. The Story (Split Side-by-Side) */}
                <section className="px-4 mb-32 max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="relative order-2 lg:order-1">
                            {/* Premium abstract block instead of a raw image if none exists */}
                            <div className="aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-br from-[#1E2028] to-[#0F1117] border border-white/10 p-8 shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                                <div className="w-full h-full border border-white/5 rounded-xl flex items-center justify-center p-8 bg-black/20 backdrop-blur-sm group-hover:bg-black/10 transition-colors">
                                   <div className="text-center space-y-4">
                                      <Zap className="w-16 h-16 mx-auto text-primary opacity-80" />
                                      <div className="text-2xl font-black text-white/50 tracking-widest font-mono uppercase">EST. 2024</div>
                                   </div>
                                </div>
                            </div>
                            
                            {/* Decorative element */}
                            <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-cyan-500/20 rounded-full blur-[50px] pointer-events-none"></div>
                        </div>
                        
                        <div className="space-y-8 order-1 lg:order-2">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                                <h2 className="text-sm font-bold text-primary uppercase tracking-widest">Our Story</h2>
                            </div>
                            <h3 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight">
                                From Frustration to <br/> Innovation
                            </h3>
                            <div className="space-y-6 text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
                                <p>
                                    Years ago, our founders—veteran traders and software engineers—realized a fundamental flaw in the retail trading industry. The tools were fragmented, the education was often misleading, and the playing field was heavily tilted against the everyday trader.
                                </p>
                                <p>
                                    We set out to build exactly what we wished we had when we started: a <strong className="text-gray-900 dark:text-gray-200">single, unified ecosystem</strong>. One that doesn't just provide signals, but teaches the intricate systems behind them. One that doesn't just show charts, but provides deep, actionable analytics.
                                </p>
                                <p>
                                    Today, The Next Trade is trusted by thousands of traders worldwide who rely on our platform to build rule-based strategies, manage risk with precision, and scale their trading business.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Mission & Vision Cards */}
                <section className="px-4 mb-32 max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Mission */}
                        <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-10 md:p-14 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-5 dark:opacity-[0.03] group-hover:opacity-10 dark:group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none">
                                <Target size={200} />
                            </div>
                            <div className="relative z-10 space-y-6">
                                <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-8">
                                    <Target size={32} />
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Our Mission</h2>
                                <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                    To democratize professional trading tools and education, empowering retail traders globally to make data-driven, systematic decisions in the financial markets. We believe that with the right data, anyone can trade intelligently.
                                </p>
                            </div>
                        </div>

                        {/* Vision */}
                        <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-10 md:p-14 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-5 dark:opacity-[0.03] group-hover:opacity-10 dark:group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none">
                                <Zap size={200} />
                            </div>
                            <div className="relative z-10 space-y-6">
                                <div className="w-16 h-16 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-8">
                                    <Zap size={32} />
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Our Vision</h2>
                                <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                    To become the central hub for modern retail trading—where learning, analyzing, and executing trades happen seamlessly within a single, powerful ecosystem. We envision a future where guesswork is eliminated.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. Core Values */}
                <section className="px-4 mb-32 max-w-6xl mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white">Core Values</h2>
                        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                            The fundamental beliefs that guide our product development and community.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: Shield, color: "text-blue-500", bg: "bg-blue-500/10", title: "Transparency", desc: "Honest data, unbiased broker reviews, and clear risk warnings. No fake Lamborghinis." },
                            { icon: TrendingUp, color: "text-primary", bg: "bg-primary/10", title: "Systematic Approach", desc: "We believe in systems over gambling, and probability over luck. Rules dictate everything." },
                            { icon: Users, color: "text-purple-500", bg: "bg-purple-500/10", title: "Community Driven", desc: "Built by traders, for traders. Every feature we ship solves a real problem our users face." }
                        ].map((item, i) => (
                            <div key={i} className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/5 rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 group">
                                <div className={`w-14 h-14 rounded-xl ${item.bg} ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <item.icon size={28} />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{item.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
                
                {/* 6. CTA Bottom */}
                <section className="px-4 mb-10 max-w-4xl mx-auto">
                    <div className="bg-gradient-to-br from-[#1E2028] to-[#0A0D14] border border-white/10 rounded-3xl p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[500px] bg-primary/20 blur-[100px] pointer-events-none rounded-full" />
                        
                        <div className="relative z-10 space-y-8">
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">Ready to Trade Differently?</h2>
                            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                                Join thousands of systematic traders who have discovered the power of data-driven decisions.
                            </p>
                            <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-[#00B078] text-white font-bold px-8 py-4 rounded-xl shadow-xl hover:shadow-primary/25 transition-all text-lg active:scale-95">
                                <span>Join The Next Trade</span>
                                <ChevronRight size={20} />
                            </Link>
                        </div>
                    </div>
                </section>

            </main>
            
            <SiteFooter />
        </div>
    );
}
