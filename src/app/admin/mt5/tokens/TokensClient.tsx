"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Key, Copy, Check, Loader2, Plus, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { toast } from "sonner";
import { createMt5EnrollmentToken, deleteEnrollmentToken } from "@/actions/admin/mt5";
import { formatDistanceToNow, format } from "date-fns";

interface TokensClientProps {
  initialTokens: any[];
}

export function TokensClient({ initialTokens }: TokensClientProps) {
  const [tokens, setTokens] = useState(initialTokens);
  const router = useRouter();

  useEffect(() => {
    setTokens(initialTokens);
  }, [initialTokens]);
  const [isPending, setIsPending] = useState(false);
  const [targetWorkerId, setTargetWorkerId] = useState("");
  const [ttlMinutes, setTtlMinutes] = useState("15");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewToken, setViewToken] = useState<any>(null);

  const [selectedTokenHash, setSelectedTokenHash] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleGenerate = () => {
    if (!targetWorkerId) {
      toast.error("Please enter a target Worker ID");
      return;
    }

    setIsPending(true);
    createMt5EnrollmentToken(targetWorkerId, ttlMinutes ? parseInt(ttlMinutes) : 15)
      .then((res) => {
        setGeneratedToken(res.enrollmentToken);
        toast.success("Enrollment token generated successfully!");
        // Refresh token list by window reload or updating state
        router.refresh();
      })
      .catch((err) => {
        toast.error(err.message || "Failed to generate token");
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  const handleDelete = (hash: string) => {
    setSelectedTokenHash(hash);
    setIsConfirmOpen(true);
  };


  const confirmDelete = () => {
    if (!selectedTokenHash) return;

    setIsPending(true);
    deleteEnrollmentToken(selectedTokenHash)
      .then(() => {
        toast.success("Enrollment token deleted");
        router.refresh();
      })
      .catch(() => {
        toast.error("Failed to delete token");
      })
      .finally(() => {
        setIsPending(false);
        setIsConfirmOpen(false);
      });
  };



  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Token copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getTokenStatus = (token: any) => {
    const now = new Date();
    if (token.usedAt) return { label: "USED", variant: "used" };
    if (new Date(token.expiresAt) < now) return { label: "EXPIRED", variant: "expired" };
    return { label: "ACTIVE", variant: "active" };
  };

  return (
    <div className="space-y-6">
      {/* Generate Card */}
      <div className="rounded-xl border border-dashboard bg-white p-6 dark:bg-[#1E2028] shadow-sm">
        <h3 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
          <Key size={18} className="text-primary" />
          Generate Worker Enrollment Token
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <PremiumInput
            label="Target Worker ID (e.g. VPS-01)"
            placeholder="Enter worker computer unique identifier"
            value={targetWorkerId}
            onChange={(e) => setTargetWorkerId(e.target.value)}
          />

          <PremiumInput
            label="Token TTL (Minutes)"
            type="number"
            placeholder="15"
            value={ttlMinutes}
            onChange={(e) => setTtlMinutes(e.target.value)}
          />

          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={isPending || !targetWorkerId}
            className="w-full h-[46px] font-bold gap-2"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Generate Token
          </Button>
        </div>

        {generatedToken && (
          <div className="mt-5 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 rounded-xl space-y-2">
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
              Generated Token (Copy immediately!)
            </p>
            <div className="flex gap-2">
              <code className="flex-1 p-3 bg-white dark:bg-[#151925] border border-dashboard rounded-lg font-mono text-sm text-primary break-all select-all">
                {generatedToken}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(generatedToken)}
                className="h-11 w-11 rounded-lg border-dashboard"
              >
                {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
              </Button>
            </div>
            <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/60 leading-relaxed">
              For the local Windows worker, copy this token and run <code className="px-1 py-0.5 bg-white/60 dark:bg-black/20 rounded font-mono">START_LOCAL_WORKER.bat</code>. The launcher will ask for the token once and store the worker credential securely.
            </p>
          </div>
        )}
      </div>

      {/* History Card */}
      <div className="overflow-hidden rounded-xl border border-dashboard bg-white dark:bg-[#1E2028] shadow-sm">
          {tokens.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <Key className="mx-auto w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-bold">No Enrollment Tokens Issued</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/5 border-b border-dashboard text-xs uppercase text-gray-500 font-black tracking-wider">
                    <th className="px-6 py-4">Worker ID</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Token Hash</th>
                    <th className="px-6 py-4">Expires At</th>
                    <th className="px-6 py-4">Used At</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/10 text-sm text-gray-700 dark:text-gray-300">
                  {tokens.map((t) => {
                    const status = getTokenStatus(t);
                    return (
                      <tr key={t.tokenHash} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                        <td className="px-6 py-4 font-semibold">{t.workerId}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                              status.variant === "active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                : status.variant === "expired"
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                                : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10"
                            }`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400 max-w-[120px] truncate" title={t.tokenHash}>
                          {t.tokenHash}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(t.expiresAt))}
                          {new Date(t.expiresAt) > new Date() ? " left" : " ago"}
                          <div className="text-[10px] text-gray-400 dark:text-gray-500">
                            {format(new Date(t.expiresAt), "yyyy-MM-dd HH:mm")}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                          {t.usedAt ? (
                            <>
                              <div>{formatDistanceToNow(new Date(t.usedAt))} ago</div>
                              <div className="text-[10px] text-gray-400 dark:text-gray-500">
                                {format(new Date(t.usedAt), "yyyy-MM-dd HH:mm")}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewToken(t)}
                              className="h-8 text-blue-500 hover:bg-blue-50 hover:text-blue-600 border-blue-100 hover:border-blue-200 dark:border-blue-500/10 dark:hover:bg-blue-500/15"
                            >
                              <Eye size={14} className="mr-1.5" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(t.tokenHash)}
                              className="h-8 text-red-500 hover:bg-red-50 hover:text-red-600 border-red-100 hover:border-red-200 dark:border-red-500/10 dark:hover:bg-red-500/15"
                            >
                              <Trash2 size={14} className="mr-1.5" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete Token"
        description="Are you sure you want to delete this enrollment token? Unregistered workers will not be able to register using this token. This action cannot be undone."
        confirmText={isPending ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
        variant="danger"
      />

      <Dialog open={!!viewToken} onOpenChange={(open) => !open && setViewToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Token Information</DialogTitle>
            <DialogDescription>
              Here is the raw token. Please copy it and keep it secure.
            </DialogDescription>
          </DialogHeader>
          
          {viewToken && (
            <div className="space-y-4 mt-4">
              <div className="space-y-1">
                <div className="text-xs text-gray-500 font-bold uppercase">Worker ID</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{viewToken.workerId}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-500 font-bold uppercase">Raw Token</div>
                <div className="text-sm font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-black/20 p-2 rounded-lg border border-dashboard break-all">
                  {viewToken.rawToken || "Legacy token (Hash only: " + viewToken.tokenHash + ")"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 font-bold uppercase">Status</div>
                  <div className="text-sm">
                    {getTokenStatus(viewToken).label}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 font-bold uppercase">Expires At</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {format(new Date(viewToken.expiresAt), "yyyy-MM-dd HH:mm:ss")}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
