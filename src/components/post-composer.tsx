"use client";

import { AnimatePresence, motion } from "motion/react";
import { Megaphone } from "lucide-react";
import { useActionState, useState } from "react";
import { createPost } from "@/app/actions/posts";
import { postKinds } from "@/lib/site";
import { Button, Card, Field, FormError, Input, Select, Textarea } from "./ui";

export function PostComposer({ verified }: { verified: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(async (prev: Awaited<ReturnType<typeof createPost>>, fd: FormData) => {
    const result = await createPost(prev, fd);
    if (result?.fields?.posted) setOpen(false);
    return result;
  }, undefined);
  const f = state?.fields ?? {};
  const posted = !!f.posted;

  if (!verified) {
    return (
      <Card className="mb-6 p-5 text-sm text-ink-soft">
        You can post to the board once the alumni office verifies your account.
      </Card>
    );
  }

  return (
    <Card className="mb-6 overflow-hidden">
      <AnimatePresence initial={false} mode="wait">
        {!open ? (
          <motion.button
            key="closed"
            type="button"
            onClick={() => setOpen(true)}
            className="flex w-full items-center gap-3 p-5 text-left transition hover:bg-sky/50"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-sky text-ulab"><Megaphone size={18} /></span>
            <span className="flex-1 text-ink-soft">{posted ? "Posted. Share another notice, event or opportunity…" : "Share a notice, event, scholarship or research call…"}</span>
          </motion.button>
        ) : (
          <motion.form
            key={`form-${state?.at ?? 0}`}
            action={action}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 p-5"
          >
            <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
              <Field label="Type"><Select name="kind" options={postKinds} defaultValue={f.kind ?? "Notice"} /></Field>
              <Field label="Title"><Input name="title" required defaultValue={f.posted ? "" : f.title} placeholder="Research assistant needed for a climate project" /></Field>
            </div>
            <Field label="Details"><Textarea name="body" rows={4} required defaultValue={f.posted ? "" : f.body} placeholder="Who it's for, what to do, deadline…" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Link" hint="Optional, e.g. a form or website"><Input name="link" type="url" defaultValue={f.posted ? "" : f.link} placeholder="https://" /></Field>
              <Field label="Date" hint="Optional, for events and deadlines"><Input name="eventDate" type="date" defaultValue={f.posted ? "" : f.eventDate} /></Field>
            </div>
            <FormError message={state?.error} />
            <div className="flex gap-2">
              <Button disabled={pending}>{pending ? "Posting…" : "Post to board"}</Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </Card>
  );
}
