"use client";

import { useState } from "react";
import { X, Send, AlertCircle, CheckCircle } from "lucide-react";
import { applyTuition, type TuitionActionState } from "@/app/actions/tuitions";
import { Button, Field, Input, Textarea } from "@/components/ui";

export function ApplyTuitionModal({
  isOpen,
  onClose,
  tuitionId,
  tuitionTitle,
  tuitionSalary,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  tuitionId: string;
  tuitionTitle: string;
  tuitionSalary: string;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<TuitionActionState>({});

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setState({});

    const formData = new FormData(e.currentTarget);
    const result = await applyTuition({}, formData);

    setLoading(false);
    if (result.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setState(result);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-mist/80 bg-surface p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between pb-3 border-b border-mist/60">
          <div>
            <h2 className="text-xl font-semibold text-ink font-display">Apply for Tuition</h2>
            <p className="mt-0.5 line-clamp-1 text-xs text-ink-soft">
              {tuitionTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-ink-soft hover:text-ink rounded-xl hover:bg-mist/40 transition"
          >
            <X size={20} />
          </button>
        </div>

        {state.error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-wash px-4 py-3 text-sm text-rose">
            <AlertCircle size={18} className="shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <input type="hidden" name="tuitionId" value={tuitionId} />

          <Field label="Expected Salary / Month" hint={`Client budget: ${tuitionSalary}`}>
            <Input
              name="expectedSalary"
              placeholder={`e.g. ${tuitionSalary}`}
              defaultValue={tuitionSalary}
            />
          </Field>

          <Field label="Tutoring Experience" hint="Briefly mention relevant teaching background">
            <Input
              name="experience"
              placeholder="e.g. 2 years experience tutoring SSC Math & Science"
              required
            />
          </Field>

          <Field label="Weekly Availability" hint="Which days and times are you free?">
            <Input
              name="availability"
              placeholder="e.g. Sun, Tue, Thu after 5:00 PM"
              required
            />
          </Field>

          <Field label="Cover Note to Student / Parent" hint="Introduce yourself and why you are the best fit">
            <Textarea
              name="note"
              rows={3}
              placeholder="e.g. I am a 3rd year student in CSE at ULAB with strong mathematical foundation. I can provide regular weekly assessments..."
              required
            />
          </Field>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-mist/60">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              <Send size={15} />
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
