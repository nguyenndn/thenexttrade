"use client";

import { useState, useTransition } from "react";
import { submitVipRequest } from "@/actions/vip-request";
import { trackEvent } from "@/lib/track";
import {
  BROKER_INFO,
  SUPPORTED_BROKERS,
  type SupportedBroker,
} from "@/lib/validations/vip-request";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  Loader2,
  AlertCircle,
  Mail,
  Copy,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { TurnstileWidget } from "@/components/ui/TurnstileWidget";

interface VipRequestFormProps {
  userEmail: string;
  userName?: string;
}

type Step = "broker" | "account_status" | "details" | "review";

export function VipRequestForm({ userEmail, userName }: VipRequestFormProps) {
  const [step, setStep] = useState<Step>("broker");
  const [selectedBroker, setSelectedBroker] = useState<SupportedBroker | null>(null);
  const [accountStatus, setAccountStatus] = useState<"new" | "existing" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [accountNumber, setAccountNumber] = useState("");
  const [balance, setBalance] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [fullName, setFullName] = useState(userName || "");
  const [country, setCountry] = useState("");
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const brokerInfo = selectedBroker ? BROKER_INFO[selectedBroker] : null;

  function handleSelectBroker(broker: SupportedBroker) {
    setSelectedBroker(broker);
    setStep("account_status");
    setAccountStatus(null);
    setError(null);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSubmit() {
    if (!selectedBroker) return;
    setError(null);

    const formData = new FormData();
    formData.set("broker", selectedBroker);
    formData.set("accountNumber", accountNumber);
    formData.set("balance", balance);
    formData.set("email", userEmail);
    formData.set("telegramId", telegramId);
    if (fullName) formData.set("fullName", fullName);
    if (country) formData.set("country", country);
    formData.set('cf-turnstile-response', turnstileToken);

    startTransition(async () => {
      const result = await submitVipRequest(formData);
      if (result.error) {
        setError(result.error);
      } else {
        trackEvent('signup_complete', { broker: selectedBroker || '' });
        setSuccess(true);
      }
    });
  }

  if (success) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center mx-auto">
          <Check size={32} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
          Request Submitted!
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Your VIP request is under review. You will see the result here once processed.
          For urgent cases, contact{" "}
          <a
            href="https://t.me/GoldScalperNinja"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2AABEE] font-medium hover:underline"
          >
            @GoldScalperNinja
          </a>{" "}
          on Telegram.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 text-sm font-medium">
        {(["broker", "account_status", "details", "review"] as Step[]).map((s, i) => {
          const labels = ["Broker", "Account", "Details", "Review"];
          const stepIndex = ["broker", "account_status", "details", "review"].indexOf(step);
          const isCompleted = i < stepIndex;
          const isCurrent = step === s;
          return (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isCurrent
                    ? "bg-primary text-white"
                    : isCompleted
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                }`}
              >
                {isCompleted ? <Check size={12} /> : i + 1}
              </div>
              <span
                className={`hidden sm:inline text-xs ${
                  isCurrent
                    ? "text-gray-800 dark:text-white"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {labels[i]}
              </span>
              {i < 3 && (
                <div className="w-8 h-[2px] bg-gray-200 dark:bg-white/10" />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-700 dark:text-red-400">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Step 1: Select Broker */}
      {step === "broker" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Select the broker you registered with
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SUPPORTED_BROKERS.map((broker) => {
              const info = BROKER_INFO[broker];
              return (
                <button
                  key={broker}
                  onClick={() => handleSelectBroker(broker)}
                  className="group flex flex-col items-center gap-3 p-6 rounded-xl border border-gray-200 dark:border-white/10 hover:border-primary dark:hover:border-primary/30 bg-white dark:bg-[#151925] hover:shadow-lg transition-all text-center"
                >
                  <img
                    src={info.logo}
                    alt={info.name}
                    className="w-20 h-20 rounded-xl object-contain"
                  />
                  <div>
                    <p className="font-bold text-gray-800 dark:text-white text-base">
                      {info.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Min. ${info.minDeposit} USD
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
            Select your broker to continue
          </p>
        </div>
      )}

      {/* Step 2: Account Status */}
      {step === "account_status" && brokerInfo && selectedBroker && (
        <div className="space-y-4">
          <div className="text-center mb-2">
            <p className="text-sm text-gray-800 dark:text-white">Selected Broker: <span className="font-bold">{brokerInfo.name}</span></p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Do you already have a {brokerInfo.name} account?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Option: New Account */}
            <button
              onClick={() => {
                setAccountStatus("new");
                trackEvent('click_open_account', { broker: selectedBroker || '' });
                window.open(brokerInfo.affiliateUrl, "_blank");
              }}
              className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center ${
                accountStatus === "new"
                  ? "border-emerald-400 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/5"
                  : "border-gray-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/20 bg-white dark:bg-[#151925]"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
                <UserPlus size={22} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-800 dark:text-white">No, create new account</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Opens registration in new tab</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Open Account <ExternalLink size={10} />
              </span>
            </button>

            {/* Option: Existing Account */}
            <button
              onClick={() => setAccountStatus("existing")}
              className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center ${
                accountStatus === "existing"
                  ? "border-blue-400 dark:border-blue-500/40 bg-blue-50 dark:bg-blue-500/5"
                  : "border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/20 bg-white dark:bg-[#151925]"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
                <RefreshCw size={22} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-800 dark:text-white">Yes, I have an account</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Transfer IB to get VIP access</p>
              </div>
            </button>
          </div>

          {/* IB Transfer Guide (shown when "existing" selected) */}
          {accountStatus === "existing" && (
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/15 space-y-3">
              <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                How to transfer IB — {brokerInfo.name}
              </p>
              <ol className="text-sm text-blue-600 dark:text-blue-300 space-y-1.5 list-decimal list-inside">
                {brokerInfo.ibTransferGuide.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>

              {/* Email template for Vantage/VTMarkets */}
              {brokerInfo.ibTransferGuide.emails && (
                <div className="p-3 rounded-lg bg-white dark:bg-[#151925] border border-blue-100 dark:border-white/5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Mail size={14} /> Email template
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>To:</strong>{" "}
                      <a href={`mailto:${brokerInfo.ibTransferGuide.emails.to}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                        {brokerInfo.ibTransferGuide.emails.to}
                      </a>
                    </p>
                    {brokerInfo.ibTransferGuide.emails.cc && (
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>CC:</strong>{" "}
                        <a href={`mailto:${brokerInfo.ibTransferGuide.emails.cc}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                          {brokerInfo.ibTransferGuide.emails.cc}
                        </a>
                      </p>
                    )}
                    <p className="text-gray-700 dark:text-gray-300"><strong>Subject:</strong> {brokerInfo.ibTransferGuide.emails.subject}</p>
                    <p className="text-gray-700 dark:text-gray-300"><strong>Content:</strong> {brokerInfo.ibTransferGuide.emails.body}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(brokerInfo.ibTransferGuide.emails!.body)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mt-1"
                  >
                    <Copy size={10} /> {copied ? "Copied!" : "Copy email content"}
                  </button>
                </div>
              )}

              {brokerInfo.ibTransferGuide.note && (
                <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/15 rounded-lg p-2.5">
                  ⚠️ {brokerInfo.ibTransferGuide.note}
                </p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setStep("broker");
                setSelectedBroker(null);
                setAccountStatus(null);
                setError(null);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors rounded-xl border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
            >
              <ArrowLeft size={14} /> Back
            </button>
            {accountStatus && (
              <button
                onClick={() => {
                  setError(null);
                  setStep("details");
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-xl transition-all hover:opacity-90"
              >
                Continue <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Account Details */}
      {step === "details" && brokerInfo && selectedBroker && (
        <div className="space-y-4">
          {/* Broker requirements */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 space-y-3">
            <p className="text-sm font-bold text-primary">
              {brokerInfo.name} — Account Requirements
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Account", value: brokerInfo.accountType },
                { label: "Leverage", value: brokerInfo.leverage },
                { label: "Currency", value: "USD" },
                { label: "Min. Deposit", value: `$${brokerInfo.minDeposit}` },
              ].map((item) => (
                <div
                  key={item.label}
                  className="px-3 py-2.5 rounded-lg bg-white dark:bg-[#151925] border border-primary/10 text-center"
                >
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {item.label}
                  </p>
                  <p className="text-sm font-bold text-gray-800 dark:text-white mt-1">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 12345678"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Balance (USD) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="e.g. 200"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Telegram ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="e.g. @yourusername"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={userEmail}
                disabled
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0F1117] text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>

            {/* Conditional: Full Name */}
            {brokerInfo.requiresFullName && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            )}

            {/* Conditional: Country */}
            {brokerInfo.requiresCountry && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Vietnam"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setStep("account_status");
                setError(null);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors rounded-xl border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <button
              onClick={() => {
                if (!accountNumber || !balance || !telegramId) {
                  setError("Please fill in all required fields");
                  return;
                }
                if (
                  brokerInfo.requiresFullName &&
                  !fullName.trim()
                ) {
                  setError("Full name is required");
                  return;
                }
                if (
                  brokerInfo.requiresCountry &&
                  !country.trim()
                ) {
                  setError("Country is required");
                  return;
                }
                setError(null);
                setStep("review");
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-xl transition-all hover:opacity-90"
            >
              Review <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === "review" && brokerInfo && selectedBroker && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-4 space-y-4">
            <p className="text-sm text-gray-800 dark:text-white">Broker Selected: <span className="font-bold">{brokerInfo.name}</span></p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Account", value: accountNumber },
                { label: "Balance", value: `$${balance}` },
                { label: "Telegram", value: telegramId },
                { label: "Email", value: userEmail },
                ...(brokerInfo.requiresFullName
                  ? [{ label: "Full Name", value: fullName }]
                  : []),
                ...(brokerInfo.requiresCountry
                  ? [{ label: "Country", value: country }]
                  : []),
              ].map((row) => (
                <div key={row.label}>
                  <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">
                    {row.label}
                  </p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                    {row.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setStep("details");
                setError(null);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors rounded-xl border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
            >
              <ArrowLeft size={14} /> Edit
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
            >
              <Check size={14} /> Submit Request
            </button>
          </div>

          <TurnstileWidget onVerify={setTurnstileToken} className="flex justify-center mt-4" />

          {/* Confirmation Modal */}
          {showConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="w-full max-w-sm bg-white dark:bg-[#1A1D27] rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className="text-amber-500" />
                  <h3 className="text-sm font-bold text-gray-800 dark:text-white">Confirm Submission</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  I confirm that all information provided above is accurate and complete.
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors rounded-xl border border-gray-200 dark:border-white/10"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirm(false);
                      handleSubmit();
                    }}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                  >
                    {isPending ? (
                      <><Loader2 size={14} className="animate-spin" /> Submitting...</>
                    ) : (
                      <><Check size={14} /> Submit</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
