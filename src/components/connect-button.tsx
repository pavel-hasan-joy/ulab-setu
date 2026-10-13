"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, UserCheck, UserPlus, X } from "lucide-react";
import {
  acceptConnectRequest,
  cancelConnectRequest,
  declineConnectRequest,
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
  const [isPending, startTransition] = useTransition();

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
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl border border-sage/40 bg-sage-wash/50 px-3 py-1.5 text-xs font-semibold text-sage shadow-xs",
          className
        )}
      >
        <UserCheck size={13} /> Connected
      </span>
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
