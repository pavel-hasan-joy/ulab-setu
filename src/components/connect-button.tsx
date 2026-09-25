"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Check, Clock, MessageCircle, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { requestConnection } from "@/app/actions/network";
import { Button, Textarea } from "./ui";

export function ConnectButton({ toId, name, status, connectionId, messagesHref }: {
  toId: string; name: string; status: "NONE" | "PENDING" | "ACCEPTED" | "DECLINED"; connectionId?: string; messagesHref: string;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  if (status === "ACCEPTED") {
    return <Link href={`${messagesHref}?c=${connectionId}`} className="inline-flex items-center gap-1.5 rounded-xl bg-sage-wash px-3.5 py-2 text-sm font-semibold text-sage transition hover:brightness-95"><MessageCircle size={15} /> Message</Link>;
  }
  if (status === "PENDING" || sent) {
    return (
      <motion.span initial={sent ? { scale: 0.9 } : false} animate={{ scale: 1 }} className="inline-flex items-center gap-1.5 rounded-xl bg-mist/60 px-3.5 py-2 text-sm font-medium text-ink-soft">
        {sent ? <Check size={15} /> : <Clock size={15} />} Request sent
      </motion.span>
    );
  }
  if (status === "DECLINED") return null;

  return (
    <div className="w-full">
      <AnimatePresence initial={false} mode="wait">
        {!open ? (
          <motion.div key="btn" exit={{ opacity: 0 }}>
            <Button variant="soft" onClick={() => setOpen(true)} className="py-2"><UserPlus size={15} /> Connect</Button>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2 overflow-hidden">
            <Textarea rows={3} autoFocus value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder={`Say hi to ${name.split(" ")[0]} and what you'd like to ask.`} />
            <div className="flex gap-2">
              <Button className="py-2" disabled={pending} onClick={() => start(async () => { await requestConnection(toId, note); setSent(true); })}>
                {pending ? "Sending…" : "Send request"}
              </Button>
              <Button variant="ghost" className="py-2" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
