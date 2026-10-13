"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogIn, X } from "lucide-react";
import { joinClassroomByCode } from "@/app/actions/classroom";
import { Button, Field, Input } from "../ui";

export function JoinClassroomModal({
  isOpen,
  onClose,
  basePath,
}: {
  isOpen: boolean;
  onClose: () => void;
  basePath: "/teacher/classroom" | "/student/classroom";
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Please enter the class code.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const res = await joinClassroomByCode(code);
      if (res.error) {
        setError(res.error);
        return;
      }

      onClose();
      setCode("");
      router.push(`${basePath}/${res.classroomId}`);
      router.refresh();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-mist bg-surface p-6 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-mist/50">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-sage-wash text-sage">
              <KeyRound size={22} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-ink">Join Classroom</h2>
              <p className="text-xs text-ink-soft">Enter the class code provided by your teacher</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-ink-soft hover:bg-paper hover:text-ink transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-wash p-3 text-xs font-semibold text-rose">
              {error}
            </div>
          )}

          <Field label="Class Code" hint="Ask your teacher for the 6-character code (e.g. 7K2M9P)">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. 7K2M9P"
              className="text-center font-mono text-xl tracking-widest uppercase font-bold"
              maxLength={10}
              required
            />
          </Field>

          <div className="rounded-2xl border border-mist/70 bg-paper/60 p-4 text-xs text-ink-soft leading-relaxed">
            <p className="font-semibold text-ink mb-1">To sign in with a class code:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Use an authorized ULAB student or faculty account</li>
              <li>Use a class code with 6 letters or numbers</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-mist/50">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isPending}>
              <LogIn size={15} />
              {isPending ? "Joining..." : "Join Class"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
