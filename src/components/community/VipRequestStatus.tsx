import {
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Crown,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import type { VipRequest } from "@prisma/client";

interface VipRequestStatusProps {
  request: VipRequest;
  vipLink?: string | null;
  onReset?: () => void;
}

export function VipRequestStatus({
  request,
  vipLink,
  onReset,
}: VipRequestStatusProps) {
  // PENDING
  if (request.status === "PENDING") {
    return (
      <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center shrink-0">
              <Clock size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300">
                Request Under Review
              </h3>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 truncate">
                {request.broker} · {request.accountNumber} · Submitted{" "}
                {new Date(request.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <a
            href="https://t.me/ZantTrader"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2AABEE] hover:underline whitespace-nowrap shrink-0"
          >
            <Send size={12} /> Contact Admin
          </a>
        </div>
      </div>
    );
  }

  // APPROVED
  if (request.status === "APPROVED") {
    return (
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
              <CheckCircle2
                size={18}
                className="text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                VIP Access Approved!
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 truncate">
                Action required to receive your invite.
              </p>
            </div>
          </div>

          <a
            href="https://t.me/ZantTrader"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 font-bold text-xs rounded-xl text-white bg-[#2AABEE] hover:bg-[#2AABEE]/90 transition-all hover:-translate-y-0.5 shadow-lg shadow-[#2AABEE]/25 whitespace-nowrap shrink-0"
          >
            <Send size={14} /> Message Admin
          </a>
        </div>

        <div className="text-xs text-emerald-700 dark:text-emerald-300/80 p-3 bg-emerald-100/50 dark:bg-emerald-500/10 rounded-lg space-y-1.5">
          <p className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">To get the private invite link:</p>
          <p className="flex items-start gap-2">
            <span className="font-medium">1.</span> 
            <span>Take a screenshot of this entire screen showing your approved status.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="font-medium">2.</span> 
            <span>Send it via DM to <a href="https://t.me/ZantTrader" target="_blank" rel="noopener noreferrer" className="text-[#2AABEE] hover:underline font-bold">@ZantTrader</a>.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="font-medium">3.</span> 
            <span><strong>Important:</strong> You must message from the exact Telegram account you originally registered with.</span>
          </p>
        </div>
      </div>
    );
  }

  // REJECTED
  return (
    <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 p-4 sm:p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center shrink-0">
            <XCircle size={18} className="text-red-600 dark:text-red-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-red-800 dark:text-red-300">
              Request Rejected
            </h3>
            <p className="text-[11px] text-red-600 dark:text-red-400 truncate">
              {request.rejectReason || "No reason provided"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onReset && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all hover:opacity-90 text-white bg-primary shadow-lg shadow-primary/25"
            >
              <RefreshCw size={12} /> Resubmit
            </button>
          )}
          <a
            href="https://t.me/ZantTrader"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2AABEE] hover:underline whitespace-nowrap"
          >
            <Send size={12} /> Contact
          </a>
        </div>
      </div>
    </div>
  );
}
