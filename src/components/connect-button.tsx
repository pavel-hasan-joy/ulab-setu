"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, UserCheck, UserPlus, UserX, X } from "lucide-react";
import {
  acceptConnectRequest,
  cancelConnectRequest,
  declineConnectRequest,
  removeConnection,
  sendConnectRequest,
} from "@/app/actions/network";
import { Button, cn } from "./ui";

export type ConnectionState = "none" | "sent_pending" | "received_pending" | "connected";

export function ConnectButton({
  targetUserId,
  targetUserName,
  initialState,
  connectionId,
  className,
}: {
  targetUserId: string;
  targetUserName: string;
  initialState: ConnectionState;
  connectionId?: string | null;
  className?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<ConnectionState>(initialState);
  const [connId, setConnId] = useState<string | null>(connectionId ?? null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setState(initialState);
  }, [initialState]);

  useEffect(() => {
    if (connectionId !== undefined) {
      setConnId(connectionId ?? null);
    }
  }, [connectionId]);

  const handleSend = () => {
    setState("sent_pending");
    startTransition(async () => {
      const res = await sendConnectRequest(targetUserId);
      if (res.error) {
        setState("none");
      }
      router.refresh();
    });
  };

  const handleCancel = () => {
    setState("none");
    startTransition(async () => {
      await cancelConnectRequest(targetUserId);
      router.refresh();
    });
  };

  const handleDisconnect = () => {
    setShowConfirm(false);
    setState("none");
    startTransition(async () => {
      await removeConnection(targetUserId);
      router.refresh();
    });
  };

  const handleAccept = () => {
    if (!connId) return;
    setState("connected");
    startTransition(async () => {
      await acceptConnectRequest(connId);
      router.refresh();
    });
  };

  const handleDecline = () => {
    if (!connId) return;
    setState("none");
    startTransition(async () => {
      await declineConnectRequest(connId);
      router.refresh();
    });
  };

  if (state === "connected") {
    return (
      <>
        <div className={cn("inline-flex items-center gap-1.5", className)}>
          <span
            className="inline-flex items-center gap-1.5 rounded-xl border border-sage/40 bg-sage-wash/50 px-3 py-1.5 text-xs font-semibold text-sage shadow-xs"
          >
            <UserCheck size={13} /> Connected
          </span>
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={isPending}
            title={`Disconnect from ${targetUserName}`}
            className="inline-flex items-center gap-1 rounded-xl border border-mist bg-surface px-2 py-1.5 text-xs font-medium text-ink-soft transition hover:border-rose/40 hover:bg-rose-wash hover:text-rose active:scale-95"
          >
            <UserX size={13} />
            <span className="hidden sm:inline text-[11px]">Disconnect</span>
          </button>
        </div>

        {showConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-4 animate-in fade-in"
            onClick={(e) => {
              e.stopPropagation();
              if (e.target === e.currentTarget) setShowConfirm(false);
            }}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-mist bg-surface p-5 shadow-lift"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-wash text-rose">
                  <UserX size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-bold text-ink">Disconnect Connection?</h3>
                  <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                    Are you sure you want to remove your connection with <span className="font-semibold text-ink">{targetUserName}</span>?
                  </p>
                </div>
              </div>

              <p className="mt-3 text-[11px] text-ink-soft/80 bg-paper/60 rounded-xl p-2.5 border border-mist/60">
                You will no longer be connected. You can send another connection request whenever you want.
              </p>

              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  disabled={isPending}
                  className="px-3 py-1.5 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDisconnect}
                  disabled={isPending}
                  className="px-3 py-1.5 text-xs"
                >
                  {isPending ? "Disconnecting..." : "Disconnect"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (state === "sent_pending") {
    return (
      <div className={cn("inline-flex items-center gap-1", className)}>
        <span
          className="inline-flex items-center gap-1 rounded-xl border border-mist bg-paper/60 px-2.5 py-1.5 text-xs font-semibold text-ink-soft"
          title="Invitation sent"
        >
          <Clock size={12} className="animate-pulse text-amber-500" /> Pending
        </span>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          title="Withdraw invitation"
          className="rounded-lg p-1 text-ink-soft transition hover:bg-rose-wash hover:text-rose"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  if (state === "received_pending") {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Button
          type="button"
          variant="primary"
          onClick={handleAccept}
          disabled={isPending}
          className="px-2.5 py-1 text-xs"
        >
          <Check size={13} /> Accept
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleDecline}
          disabled={isPending}
          className="px-2 py-1 text-xs text-ink-soft hover:text-rose"
        >
          <X size={13} />
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="soft"
      onClick={handleSend}
      disabled={isPending}
      className={cn("px-3 py-1.5 text-xs font-semibold shadow-xs", className)}
    >
      <UserPlus size={13} /> Connect
    </Button>
  );
}
