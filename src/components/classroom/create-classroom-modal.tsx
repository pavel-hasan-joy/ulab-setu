"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Sparkles, X } from "lucide-react";
import { createClassroom } from "@/app/actions/classroom";
import { Button, Field, Input, Textarea } from "../ui";

export function CreateClassroomModal({
  isOpen,
  onClose,
  basePath,
}: {
  isOpen: boolean;
  onClose: () => void;
  basePath: "/teacher/classroom" | "/student/classroom";
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a classroom name.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const res = await createClassroom({
        name,
        section,
        subject,
        description,
      });

      if (res.error) {
        setError(res.error);
        return;
      }

      onClose();
      setName("");
      setSection("");
      setSubject("");
      setDescription("");
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
        className="w-full max-w-lg rounded-3xl border border-mist bg-surface p-6 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-mist/50">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-ulab/10 text-ulab">
              <GraduationCap size={22} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-ink">Create New Classroom</h2>
              <p className="text-xs text-ink-soft">Create a space for notices and WhatsApp-style group chat</p>
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

          <Field label="Classroom / Course Name" hint="e.g. CSE 311: Database Management Systems">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Course title or group name"
              required
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Section / Semester" hint="e.g. Sec 1, Spring 2026">
              <Input
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="Section 1"
              />
            </Field>

            <Field label="Subject / Department" hint="e.g. CSE, BBA, MSJ">
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="CSE"
              />
            </Field>
          </div>

          <Field label="Description (Optional)" hint="Short welcome message or course overview">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Share what this classroom is for..."
              rows={3}
            />
          </Field>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-mist/50">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isPending}>
              <Sparkles size={15} />
              {isPending ? "Creating..." : "Create Classroom"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
