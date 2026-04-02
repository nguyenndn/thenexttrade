"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";

export function TradingSetupModal() {
  const [open, setOpen] = useState(true);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
        {/* Header Gradient */}
        <div className="bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Trophy size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-black text-white">Trading Leaderboard</h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              No account selected
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
              To appear on the Trading leaderboard, you need to select one of your
              <strong className="text-gray-700 dark:text-gray-300"> Real trading accounts</strong>. 
              Go to your Trading Accounts page and use the <strong className="text-gray-700 dark:text-gray-300">⋮ menu → "Use for Leaderboard"</strong> option.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-row gap-2 sm:justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-xl"
            >
              Maybe later
            </Button>
            <Link
              href="/dashboard/accounts"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              Go to Accounts
              <ArrowRight size={14} />
            </Link>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
