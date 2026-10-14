"use client";

import { useState } from "react";
import { X, BookOpen, AlertCircle, Sparkles } from "lucide-react";
import { createTuition, type TuitionActionState } from "@/app/actions/tuitions";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";

const CLASS_OPTIONS = [
  "Class 1-5 (Primary)",
  "Class 6-8 (Junior Secondary)",
  "Class 9-10 (SSC)",
  "Class 11-12 (HSC)",
  "O-Level (Cambridge / Edexcel)",
  "A-Level (Cambridge / Edexcel)",
  "Admission Test Preparation",
  "University Coursework / Coding",
  "Spoken English / IELTS",
  "Other",
] as const;

const CURRICULUM_OPTIONS = [
  "Bangla Medium",
  "English Version",
  "English Medium",
  "Madrasah Curriculum",
  "Other",
] as const;

const TUTORING_TYPE_OPTIONS = [
  "Home Tutoring",
  "Online Tutoring",
  "Tutor's Place",
] as const;

const DAYS_OPTIONS = [
  "2 Days / Week",
  "3 Days / Week",
  "4 Days / Week",
  "5 Days / Week",
  "Weekend Only",
  "Negotiable",
] as const;

const STUDENT_GENDER_OPTIONS = [
  "Male",
  "Female",
  "Any / Multiple Students",
] as const;

const TUTOR_GENDER_OPTIONS = [
  "Any",
  "Male Preferred",
  "Female Preferred",
] as const;

export function CreateTuitionModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
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
    const result = await createTuition({}, formData);

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
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-mist/80 bg-surface p-6 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-mist/60">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-sky text-ulab-deep">
              <BookOpen size={22} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink font-display">Post a Tuition Requirement</h2>
              <p className="text-xs text-ink-soft">
                Connect with passionate tutors and students across the ULAB community.
              </p>
            </div>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Field label="Tuition Title *" hint="A descriptive headline (e.g. Need HSC 2026 Higher Math & Physics Home Tutor)">
            <Input
              name="title"
              required
              placeholder="e.g. Need Class 9 Higher Math & Physics Home Tutor"
              defaultValue=""
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Class / Grade *">
              <Select
                name="classGrade"
                required
                options={CLASS_OPTIONS}
                defaultValue={CLASS_OPTIONS[2]}
              />
            </Field>

            <Field label="Curriculum / Medium *">
              <Select
                name="curriculum"
                required
                options={CURRICULUM_OPTIONS}
                defaultValue={CURRICULUM_OPTIONS[1]}
              />
            </Field>
          </div>

          <Field label="Subjects *">
            <Input
              name="subjects"
              required
              placeholder="e.g. Higher Math, Physics, ICT"
              defaultValue=""
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tutoring Type *">
              <Select
                name="tutoringType"
                required
                options={TUTORING_TYPE_OPTIONS}
                defaultValue={TUTORING_TYPE_OPTIONS[0]}
              />
            </Field>

            <Field label="Location / Area *">
              <Input
                name="location"
                required
                placeholder="e.g. Dhanmondi (Near ULAB Campus), Dhaka"
                defaultValue=""
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Days per Week *">
              <Select
                name="daysPerWeek"
                required
                options={DAYS_OPTIONS}
                defaultValue={DAYS_OPTIONS[1]}
              />
            </Field>

            <Field label="Salary / Remuneration *">
              <Input
                name="salary"
                required
                placeholder="e.g. 7,000 BDT/Month (or Negotiable)"
                defaultValue=""
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Student Gender">
              <Select
                name="studentGender"
                options={STUDENT_GENDER_OPTIONS}
                defaultValue={STUDENT_GENDER_OPTIONS[0]}
              />
            </Field>

            <Field label="Preferred Tutor Gender">
              <Select
                name="preferredTutorGender"
                options={TUTOR_GENDER_OPTIONS}
                defaultValue={TUTOR_GENDER_OPTIONS[0]}
              />
            </Field>
          </div>

          <Field
            label="Additional Requirements & Notes"
            hint="Specify preferred department/major, suitable class timings, specific topics, or any exam target."
          >
            <Textarea
              name="requirements"
              rows={3}
              placeholder="e.g. Seeking a CSE or EEE student with strong math background. Class timing should be around 5:30 PM."
            />
          </Field>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-mist/60">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              <Sparkles size={16} />
              {loading ? "Posting..." : "Publish Tuition"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
