
"use client";

import { Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NewsletterWidget() {
    return (
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Mail size={24} className="text-white" />
                </div>
                <h3 className="font-bold text-lg">Weekly Alpha</h3>
            </div>

            <p className="text-cyan-50 text-sm mb-6 leading-relaxed">
                Join 15,000+ traders receiving our weekly market analysis and high-probability setups.
            </p>

            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                <input
                    type="email"
                    placeholder="hello@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 placeholder:text-cyan-100/70 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all text-sm"
                    required
                />
                <Button
                    type="submit"
                    className="w-full py-3 bg-white text-cyan-600 rounded-xl font-bold text-sm hover:bg-cyan-50 transition-colors flex items-center justify-center gap-2"
                >
                    Subscribe Free <ArrowRight size={16} />
                </Button>
            </form>

            <p className="text-xs text-cyan-100/60 mt-4 text-center">
                No spam. Unsubscribe anytime.
            </p>
        </div>
    );
}
