"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Trophy, Sparkles, Target, Loader2, CheckCircle2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { MissionProgressItem } from "@/lib/services/edge-missions.service";
import { claimMission } from "@/actions/edge-missions";
import { trackEvent } from "@/lib/track";
import { toast } from "sonner";

interface NextBestActionCardProps {
  mission: MissionProgressItem | null;
  onClaimed?: () => void;
}

export function NextBestActionCard({ mission, onClaimed }: NextBestActionCardProps) {
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaim = async () => {
    if (!mission) return;
    setIsClaiming(true);
    try {
      const result = await claimMission(mission.missionId);
      if (result.success) {
        toast.success(`+${result.xpAwarded} Edge earned!`, {
          description: "Mission Complete!",
        });
        if (onClaimed) onClaimed();
      } else {
        toast.error(result.error || "Claim Failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsClaiming(false);
    }
  };

  if (!mission) {
    return (
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 p-6 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-4">
          <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={24} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">You're caught up!</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          You've completed all available missions. Keep trading and learning to unlock more opportunities.
        </p>
        <div className="flex gap-3">
          <Link href="/dashboard/journal">
            <Button variant="outline" className="gap-2">
              <Target size={16} />
              Log a Trade
            </Button>
          </Link>
          <Link href="/dashboard/academy">
            <Button variant="primary" className="gap-2">
              <BookOpen size={16} />
              Go to Academy
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isClaimable = mission.completed && !mission.claimed;

  return (
    <div className="rounded-2xl relative overflow-hidden group">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent dark:from-primary/20" />
      <div className="absolute inset-0 border border-gray-200 dark:border-white/10 rounded-2xl bg-white/50 dark:bg-[#151925]/50 backdrop-blur-xl" />
      
      <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <span className="text-xs font-bold text-primary tracking-wider uppercase">Your Next Best Action</span>
          </div>
          
          <div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
              {mission.def.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xl leading-relaxed">
              {mission.def.whyItMatters || mission.def.description}
            </p>
          </div>
          
          {!isClaimable && (
            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden max-w-xs">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-teal-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((mission.progress / mission.target) * 100))}%` }}
                />
              </div>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                {mission.progress} / {mission.target}
              </span>
            </div>
          )}
        </div>

        <div className="w-full md:w-auto shrink-0 flex flex-col items-center gap-2">
          {isClaimable ? (
            <Button
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full md:w-auto bg-gradient-to-r from-gold to-amber-500 hover:from-amber-400 hover:to-gold text-gray-900 border-0 shadow-lg shadow-gold/20 font-bold px-6 py-2.5 rounded-lg transition-all hover:scale-105"
            >
              {isClaiming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <Trophy className="mr-2 h-4 w-4" />
                  Claim {mission.def.xpReward} Edge
                </>
              )}
            </Button>
          ) : (
            <Link
              href={mission.def.ctaHref || "#"}
              className="w-full"
              onClick={() => {
                if (mission.def.ctaHref?.includes("/reports")) {
                  trackEvent("mission_report_cta_clicked", { surface: "missions", action: "open_weekly_review", missionId: mission.missionId });
                }
              }}
            >
              <Button 
                variant="primary" 
                className="w-full md:w-auto px-6 py-2.5 rounded-lg font-bold group-hover:shadow-lg group-hover:shadow-primary/20 transition-all"
              >
                {mission.def.ctaLabel || "Continue"}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          )}
          
          {isClaimable && (
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Ready to claim!</span>
          )}
        </div>
      </div>
    </div>
  );
}
