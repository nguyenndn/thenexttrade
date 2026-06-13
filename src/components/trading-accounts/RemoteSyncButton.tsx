"use client";

import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/Button";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/Dialog";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface RemoteSyncButtonProps {
 tradingAccountId: string;
 accountName: string;
 isConnected: boolean;
 variant?: "default" | "icon" | "premium";
}

type CommandStatus = "idle" | "pending" | "processing" | "completed" | "failed";

const BROKER_OFFSET_HOURS = 2; // UTC+2

export function RemoteSyncButton({
 tradingAccountId,
 accountName,
 isConnected,
 variant = "default",
}: RemoteSyncButtonProps) {
 const [open, setOpen] = useState(false);
 const [syncPeriod, setSyncPeriod] = useState("7");
 const [status, setStatus] = useState<CommandStatus>("idle");
 const [commandId, setCommandId] = useState<string | null>(null);
 const [result, setResult] = useState<any>(null);

 // Poll for command status
 useEffect(() => {
 if (!commandId || status === "completed" || status === "failed") return;

 const interval = setInterval(async () => {
 try {
 const res = await fetch(`/api/ea/commands/${commandId}`);
 const data = await res.json();

 if (data.command) {
 setStatus(data.command.status.toLowerCase() as CommandStatus);
 if (data.command.result) {
 setResult(data.command.result);
 }
 if (data.command.errorMessage) {
 setResult({ error: data.command.errorMessage });
 }
 }
 } catch (error) {
 console.error("Failed to poll command status:", error);
 }
 }, 2000);

 return () => clearInterval(interval);
 }, [commandId, status]);

 const handleSync = async () => {
 try {
 setStatus("pending");
 setResult(null);

 let params = {};
 const isAll = syncPeriod === "all";

 if (!isAll) {
 const days = parseInt(syncPeriod);

 // Calculate Broker Time (UTC+2) to send specific date range
 // This forces EA to use SyncDateRange (Deal Ticket) instead of SyncRecentTrades
 const now = new Date();
 const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
 const brokerNow = new Date(utcMs + (BROKER_OFFSET_HOURS * 60 * 60 * 1000));

 const toDate = format(brokerNow, "yyyy.MM.dd");
 const fromDate = format(subDays(brokerNow, days - 1), "yyyy.MM.dd");

 params = { fromDate, toDate };
 }

 const res = await fetch("/api/ea/commands", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 tradingAccountId,
 type: isAll ? "SYNC_ALL" : "SYNC_TRADES",
 params,
 }),
 });

 const data = await res.json();

 if (!res.ok) {
 throw new Error(data.error || "Failed to create sync command");
 }

 setCommandId(data.command.id);
 toast.info("Sync command sent to EA. Waiting for response...");
 } catch (error: any) {
 setStatus("failed");
 setResult({ error: error.message });
 toast.error(error.message);
 }
 };

 const getStatusIcon = () => {
 switch (status) {
 case "pending":
 case "processing":
 return <Loader2 className="h-4 w-4 animate-spin" />;
 case "completed":
 return <CheckCircle2 className="h-4 w-4 text-green-500" />;
 case "failed":
 return <XCircle className="h-4 w-4 text-red-500" />;
 default:
 return <Clock className="h-4 w-4" />;
 }
 };

 const getStatusText = () => {
 switch (status) {
 case "pending":
 return "Waiting for EA to pick up...";
 case "processing":
 return "EA is syncing trades...";
 case "completed":
 return result?.message || `Synced ${result?.syncedCount || 0} trades`;
 case "failed":
 return result?.error || "Sync failed";
 default:
 return "";
 }
 };

 const resetDialog = () => {
 setStatus("idle");
 setCommandId(null);
 setResult(null);
 setSyncPeriod("7");
 };

 return (
 <Dialog open={open} onOpenChange={(isOpen) => {
 setOpen(isOpen);
 if (!isOpen) resetDialog();
 }}>
 <DialogTrigger asChild>
 <Button
 variant="outline"
 size={variant === "icon" ? "icon" : "sm"}
 className={
 variant === "premium"
 ? "flex h-8 min-w-[92px] items-center justify-center gap-1.5 rounded-lg border border-dashboard bg-white px-3.5 text-[11px] font-black text-gray-950 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-950 dark:bg-white/5 dark:text-gray-100 dark:hover:bg-white/10 dark:hover:text-white"
 : variant === "icon" ? "h-8 w-8 text-gray-600" : "gap-2"
 }
 title={!isConnected ? "EA must be connected to sync" : "Remote Sync"}
 >
 <RefreshCw className={variant === "premium" ? "h-3.5 w-3.5 text-gray-500" : "h-4 w-4"} />
 {variant !== "icon" && <span>Sync</span>}
 </Button>
 </DialogTrigger>
 <DialogContent className="sm:max-w-md">
 <DialogHeader>
 <DialogTitle>Remote Sync - {accountName}</DialogTitle>
 <DialogDescription>
 Trigger sync from EA running on your MT4/MT5 terminal.
 <br />
 <span className="text-xs text-muted-foreground">
 (EA must be running and connected)
 </span>
 </DialogDescription>
 </DialogHeader>

 {status === "idle" ? (
 <div className="space-y-4 py-4">
 <div className="space-y-2">
 <label className="text-sm font-medium">Sync Period</label>
 <Select value={syncPeriod} onValueChange={setSyncPeriod}>
 <SelectTrigger className="w-full">
 <SelectValue placeholder="Select period" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="1">Today</SelectItem>
 <SelectItem value="3">Last 3 Days</SelectItem>
 <SelectItem value="7">Last Week</SelectItem>
 <SelectItem value="30">Last Month</SelectItem>
 <SelectItem value="90">Last 3 Months</SelectItem>
 <SelectItem value="180">Last 6 Months</SelectItem>
 <SelectItem value="all">Entire History</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <Button onClick={handleSync} className="w-full">
 <RefreshCw className="h-4 w-4 mr-2" />
 Start Remote Sync
 </Button>
 </div>
 ) : (
 <div className="py-6 space-y-4">
 <div className="flex flex-col items-center justify-center gap-3">
 {getStatusIcon()}
 <span className={`text-sm font-medium ${status === "completed" ? "text-green-600" :
 status === "failed" ? "text-red-600" :
 "text-muted-foreground"
 }`}>
 {getStatusText()}
 </span>
 </div>

 {result?.syncedCount !== undefined && (
 <div className="text-center">
 <span className="text-3xl font-bold text-primary">
 {result.syncedCount}
 </span>
 <p className="text-sm text-muted-foreground">trades synced</p>
 </div>
 )}

 {(status === "completed" || status === "failed") && (
 <div className="flex gap-2">
 <Button variant="outline" onClick={resetDialog} className="flex-1">
 Sync Again
 </Button>
 <Button onClick={() => setOpen(false)} className="flex-1">
 Done
 </Button>
 </div>
 )}
 </div>
 )}
 </DialogContent>
 </Dialog>
 );
}
