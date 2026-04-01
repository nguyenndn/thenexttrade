import Link from "next/link";
import { ArrowRight, Globe, ExternalLink, Quote } from "lucide-react";
import { Button } from "@/components/ui/Button";

const TEAM = [
  {
    name: "Ninja Trader",
    role: "Founder & Lead Developer",
    initials: "NT",
    color: "bg-gradient-to-br from-primary to-teal-500",
  },
  {
    name: "PVSR Capital",
    role: "Trading Partner",
    initials: "PV",
    color: "bg-gradient-to-br from-amber-500 to-orange-500",
  },
  {
    name: "Tony",
    role: "Funded Trader",
    initials: "T",
    color: "bg-gradient-to-br from-sky-500 to-blue-600",
  },
];

const SITES = [
  {
    name: "TheNextTrade.com",
    desc: "Main Platform",
    url: "https://thenexttrade.vercel.app",
    initials: "TN",
    color: "bg-gradient-to-br from-primary to-emerald-500",
  },
  {
    name: "PVSRCapital.com",
    desc: "Trading & Investment",
    url: "https://pvsrcapital.com",
    initials: "PV",
    color: "bg-gradient-to-br from-blue-500 to-indigo-500",
  },
  {
    name: "Coming Soon",
    desc: "Funded Trading",
    url: "#",
    initials: "CS",
    color: "bg-gradient-to-br from-sky-500 to-blue-600",
  },
];

export function AboutUsSection() {
  return (
    <section className="py-16 relative overflow-hidden border-t border-primary/10 dark:border-white/10 bg-gradient-to-br from-emerald-50/60 via-cyan-50/40 to-blue-50/50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      {/* Mesh gradient blobs */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-cyan-500/5 dark:bg-cyan-500/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,200,136,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,200,136,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Brand Story — full width on tablet */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Globe size={22} className="text-primary" />
              About TheNextTrade
            </h2>
            <div className="relative mb-5">
              <Quote size={16} className="text-primary/30 absolute -left-1 -top-1" />
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic pl-4">
                From hard lessons to building the tools every trader deserves.
              </p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              After years of losses, scattered learning, and chasing shortcuts, I built TheNextTrade — a free, structured trading education platform so new traders don&apos;t repeat my mistakes.
            </p>
            <Link href="/about">
              <Button
                variant="outline"
                className="border-primary/30 dark:border-primary/40 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 hover:border-primary dark:hover:border-primary rounded-full text-sm"
              >
                Read My Story <ArrowRight size={16} className="ml-1" />
              </Button>
            </Link>
          </div>

          {/* Team & Sites — side by side on tablet, each 1 col on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-8 lg:col-span-2 lg:contents">
            {/* Team & Partners */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Team & Partners</h3>
              <div className="space-y-3">
                {TEAM.map((member, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/80 dark:bg-white/[0.05] backdrop-blur-sm border border-gray-200 dark:border-white/10 hover:border-primary dark:hover:border-primary/60 hover:shadow-md hover:shadow-primary/10 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className={`w-10 h-10 rounded-full ${member.color} flex items-center justify-center text-white text-sm font-black shadow-lg`}>
                      {member.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{member.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Our Sites */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Our Sites</h3>
              <div className="space-y-3">
                {SITES.map((site, idx) => (
                  <a
                    key={idx}
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/80 dark:bg-white/[0.05] backdrop-blur-sm border border-gray-200 dark:border-white/10 hover:border-primary dark:hover:border-primary/60 hover:shadow-md hover:shadow-primary/10 hover:-translate-y-0.5 transition-all duration-200 group"
                  >
                    <div className={`w-10 h-10 rounded-lg ${site.color} flex items-center justify-center text-white text-xs font-black shadow-lg`}>
                      {site.initials}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                        {site.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{site.desc}</p>
                    </div>
                    <ExternalLink size={14} className="text-gray-400 dark:text-gray-500 group-hover:text-primary transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
