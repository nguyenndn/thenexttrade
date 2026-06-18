import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpenText, ExternalLink, Quote, Sparkles, UsersRound, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";

const TEAM = [
  {
    name: "Kee",
    role: "Trader - Founder & Lead Developer",
    initials: "K",
    color: "bg-gradient-to-br from-amber-500 to-teal-500",
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
    color: "bg-gradient-to-br from-amber-500 to-emerald-500",
    image: "/icons/icon-192x192.png",
  },
  {
    name: "PVSRCapital.com",
    desc: "Trading & Investment",
    url: "https://pvsrcapital.com",
    initials: "PV",
    color: "bg-gradient-to-br from-blue-500 to-indigo-500",
    image: "/images/pvsr-favicon.ico",
  },
];

export function AboutUsSection() {
  return (
    <div className="relative overflow-hidden border-y border-amber-200/70 bg-white">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:56px_56px]" />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(118deg,rgba(245,158,11,0.12)_0%,rgba(255,251,235,0.82)_24%,transparent_48%,rgba(20,184,166,0.08)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />

      <section className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1.35fr] gap-8 xl:gap-12 items-stretch">
          <div className="relative overflow-hidden rounded-[28px] border border-amber-300/70 bg-white/90 p-6 sm:p-8 lg:p-10 shadow-[0_26px_70px_rgba(120,72,0,0.12)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-300 to-emerald-400" />
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-50 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-amber-600">
              <Sparkles size={13} />
              Founder note
            </div>

            <h2 className="mt-6 text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
              Built from losses,
              <span className="block text-amber-500">rebuilt into a system.</span>
            </h2>

            <div className="relative mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
              <Quote size={18} className="absolute -top-2 left-4 text-amber-500" />
              <p className="pl-3 text-sm sm:text-base leading-relaxed text-gray-700 italic">
                From hard lessons to building the tools every trader deserves.
              </p>
            </div>

            <p className="mt-6 text-sm sm:text-base leading-7 text-gray-650">
              After years of losses, scattered learning, and chasing shortcuts, I built TheNextTrade as a practical
              trading workspace: sync your trades, review what happened, and turn each week into one clear next action.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link href="/about" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto min-h-11 rounded-xl bg-amber-500 px-5 text-sm font-black text-white hover:bg-amber-600 shadow-[0_14px_30px_rgba(245,158,11,0.22)]">
                  Read My Story <ArrowRight size={16} className="ml-1" />
                </Button>
              </Link>
              <Link
                href="/auth/signup?source=about-brand-story"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-200 bg-white px-5 text-sm font-extrabold text-gray-800 transition-colors hover:border-amber-400 hover:text-amber-600"
              >
                Start Free Journal
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-[24px] border border-dashboard bg-white/85 p-5 sm:p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-600">People behind it</p>
                  <h3 className="mt-2 text-xl font-black text-gray-900">Team & Partners</h3>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600">
                  <UsersRound size={19} />
                </div>
              </div>

              <div className="space-y-3">
                {TEAM.map((member, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center gap-3 rounded-2xl border border-dashboard bg-white p-3 transition-all duration-300 hover:border-amber-300 hover:shadow-md hover:shadow-amber-500/10"
                  >
                    <div className="h-11 w-11 shrink-0 rounded-2xl border border-amber-200 bg-amber-50/40 p-1">
                      <div className={`flex h-full w-full items-center justify-center rounded-xl ${member.color} text-sm font-black text-white shadow-lg`}>
                        {member.initials}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-gray-900 group-hover:text-amber-600 transition-colors">
                        {member.name}
                      </p>
                      <p className="truncate text-xs text-gray-500">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-dashboard bg-white/85 p-5 sm:p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-600">The ecosystem</p>
                  <h3 className="mt-2 text-xl font-black text-gray-900">Our Sites</h3>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600">
                  <Zap size={19} />
                </div>
              </div>

              <div className="space-y-3">
                {SITES.map((site, idx) => (
                  <a
                    key={idx}
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-2xl border border-dashboard bg-white p-3 transition-all duration-300 hover:border-amber-300 hover:shadow-md hover:shadow-amber-500/10"
                  >
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/40 p-1">
                      {site.image ? (
                        <Image src={site.image} alt={site.name} width={44} height={44} className="h-full w-full rounded-xl object-cover" />
                      ) : (
                        <div className={`flex h-full w-full items-center justify-center rounded-xl ${site.color} text-xs font-black text-white shadow-lg`}>
                          {site.initials}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-gray-900 group-hover:text-amber-600 transition-colors">
                        {site.name}
                      </p>
                      <p className="truncate text-xs text-gray-500">{site.desc}</p>
                    </div>
                    <ExternalLink size={14} className="shrink-0 text-gray-400 transition-colors group-hover:text-amber-600" />
                  </a>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                <div className="flex items-start gap-3">
                  <BookOpenText size={17} className="mt-0.5 shrink-0 text-amber-600" />
                  <p className="text-xs leading-5 text-gray-650">
                    One brand system for learning, trade tracking, weekly coach reports, and practical tools.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
