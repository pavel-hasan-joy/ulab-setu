"use client";

import { useState } from "react";
import { ShieldCheck, CheckCircle2, RefreshCw, Sparkles } from "lucide-react";
import { verifyAlumniStatus, autoVerifyAllAlumni } from "@/app/actions/admin";
import { Button, cn } from "@/components/ui";

interface AlumniVerificationProps {
  userId: string;
  isVerified: boolean;
  alumniName: string;
  verificationMethod?: string | null;
  verifiedAt?: string | null;
}

export function AlumniCardVerificationBadge({
  userId,
  isVerified,
  alumniName,
  verificationMethod = "ulab_email",
}: AlumniVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [verifiedState, setVerifiedState] = useState(isVerified);

  const handleVerify = async () => {
    try {
      setLoading(true);
      await verifyAlumniStatus(userId);
      setVerifiedState(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to verify alumni.");
    } finally {
      setLoading(false);
    }
  };

  if (verifiedState) {
    return (
      <div className="flex items-center gap-1.5">
        <span
          title={`Verified Alumni - Method: ${verificationMethod || "ulab_email"}`}
          className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 shadow-xs dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
        >
          <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
          Verified Alumni
        </span>
      </div>
    );
  }

  return (
    <Button
      variant="soft"
      disabled={loading}
      onClick={handleVerify}
      className="h-7 gap-1 rounded-full border border-gold/40 bg-gold-wash/80 px-2.5 text-[11px] font-semibold text-gold-ink hover:bg-gold-wash"
    >
      <CheckCircle2 size={13} className={cn(loading && "animate-spin")} />
      {loading ? "Verifying…" : "Verify Alumni"}
    </Button>
  );
}

export function AlumniBulkVerifyButton({ totalAlumni }: { totalAlumni: number }) {
  const [syncing, setSyncing] = useState(false);
  const [done, setDone] = useState(false);

  const handleBulkVerify = async () => {
    try {
      setSyncing(true);
      await autoVerifyAllAlumni();
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to auto-verify all alumni.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      variant="outline"
      disabled={syncing}
      onClick={handleBulkVerify}
      className={cn(
        "gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all",
        done
          ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
          : "border-mist/80 hover:border-emerald-400 hover:text-emerald-700"
      )}
    >
      {done ? (
        <>
          <CheckCircle2 size={14} className="text-emerald-600" />
          All {totalAlumni} Alumni Verified!
        </>
      ) : (
        <>
          <RefreshCw size={13} className={cn(syncing && "animate-spin text-emerald-600")} />
          {syncing ? "Auto-Verifying…" : "Sync & Verify All Alumni"}
        </>
      )}
    </Button>
  );
}
