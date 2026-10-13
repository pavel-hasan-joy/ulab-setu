"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Briefcase,
  CheckCircle2,
  FileCheck2,
  FileText,
  Globe,
  GraduationCap,
  Link as LinkIcon,
  Phone,
  UploadCloud,
  X,
} from "lucide-react";
import { useActionState, useState, useRef } from "react";
import type { User } from "@prisma/client";
import { applyToJob } from "@/app/actions/jobs";
import { Button, Card, Field, FormError, Input, Textarea } from "@/components/ui";

const statusText: Record<string, string> = {
  APPLIED: "Your application was sent. You'll see updates in Applications.",
  SHORTLISTED: "Good news: you've been shortlisted. Expect a message soon.",
  REJECTED: "This one didn't work out. Keep going, there are more jobs waiting.",
};

type SafeStudent = Pick<
  User,
  "id" | "name" | "email" | "department" | "batch" | "studentId" | "phone" | "linkedin" | "bio" | "skills"
>;

export function ApplyPanel({
  jobId,
  open,
  applied,
  student,
}: {
  jobId: string;
  open: boolean;
  applied: string | null;
  student?: SafeStudent;
}) {
  const [state, action, pending] = useActionState(applyToJob, undefined);
  const done = applied || (state && !state.error);

  // CV Upload state
  const [cvFile, setCvFile] = useState<{ name: string; size: string; data: string } | null>(null);
  const [cvUrl, setCvUrl] = useState("");
  const [cvMode, setCvMode] = useState<"upload" | "link">("upload");
  const [cvError, setCvError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCvError(null);

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setCvError("File size exceeds 5MB. Please upload a smaller PDF/DOCX or use a link.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;
      setCvFile({ name: file.name, size: sizeStr, data: result });
    };
    reader.onerror = () => {
      setCvError("Error reading file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setCvFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className="overflow-hidden p-5 shadow-soft">
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-4 text-center"
          >
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-sage-wash text-sage">
              <CheckCircle2 size={32} />
            </div>
            <p className="mt-3 font-display text-lg font-semibold text-ink">
              {applied === "SHORTLISTED"
                ? "Shortlisted"
                : applied === "REJECTED"
                ? "Not selected"
                : "Application Submitted"}
            </p>
            <p className="mt-1 text-sm text-ink-soft">{statusText[applied ?? "APPLIED"]}</p>
            <div className="mt-5 flex justify-center">
              <Link
                href="/student/applications"
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky px-4 py-2 text-sm font-semibold text-ulab-deep transition hover:bg-mist"
              >
                <FileText size={15} /> View my applications
              </Link>
            </div>
          </motion.div>
        ) : !open ? (
          <motion.p key="closed" className="py-2 text-sm text-ink-soft">
            This job is no longer taking applications.
          </motion.p>
        ) : (
          <motion.form key="form" action={action} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <input type="hidden" name="jobId" value={jobId} />
            {cvFile?.data && <input type="hidden" name="cvData" value={cvFile.data} />}
            {cvFile?.name && <input type="hidden" name="cvFileName" value={cvFile.name} />}
            {cvUrl && <input type="hidden" name="cvUrl" value={cvUrl} />}

            {/* Header */}
            <div>
              <div className="flex items-center justify-between">
                <p className="font-display text-base font-bold text-ink">Job Application</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-sage">
                  <FileCheck2 size={13} /> Complete Profile
                </span>
              </div>
              <p className="mt-0.5 text-xs text-ink-soft">
                Submit your CV and credentials directly to the alumnus.
              </p>
            </div>

            {/* Applicant Summary */}
            {student && (
              <div className="rounded-xl border border-mist bg-paper/60 p-3 text-xs text-ink-soft">
                <div className="flex items-center gap-2">
                  <GraduationCap size={14} className="text-ulab" />
                  <span className="font-semibold text-ink">{student.name}</span>
                </div>
                <p className="mt-1 text-[11px]">
                  {student.department} {student.batch ? `• Batch ${student.batch}` : ""} {student.studentId ? `• ID ${student.studentId}` : ""}
                </p>
                <p className="text-[11px] text-ink-soft/80">{student.email}</p>
              </div>
            )}

            {/* Professional Contact & Links */}
            <div className="space-y-3">
              <Field label="Phone number" hint="For interview calls / WhatsApp">
                <div className="relative">
                  <Phone size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                  <Input
                    name="phone"
                    type="tel"
                    defaultValue={student?.phone ?? ""}
                    placeholder="017XXXXXXXX"
                    className="pl-9 text-xs"
                    required
                  />
                </div>
              </Field>

              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="LinkedIn">
                  <Input
                    name="linkedin"
                    type="url"
                    defaultValue={student?.linkedin ?? ""}
                    placeholder="https://linkedin.com/in/…"
                    className="text-xs"
                  />
                </Field>
                <Field label="Portfolio / GitHub">
                  <Input
                    name="portfolio"
                    type="url"
                    placeholder="https://github.com/…"
                    className="text-xs"
                  />
                </Field>
              </div>

              <Field label="Available to start">
                <select
                  name="availability"
                  defaultValue="Immediately"
                  className="w-full rounded-xl border border-mist bg-surface px-3 py-2 text-xs text-ink focus:border-ulab-light focus:outline-none"
                >
                  <option value="Immediately">Immediately</option>
                  <option value="Within 2 Weeks">Within 2 Weeks</option>
                  <option value="Within 1 Month">Within 1 Month</option>
                  <option value="Flexible / Negotiable">Flexible / Negotiable</option>
                </select>
              </Field>
            </div>

            {/* CV / Resume Section */}
            <div className="rounded-xl border border-mist p-3.5 bg-surface">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-ink">
                  <Briefcase size={14} className="text-ulab" /> Attach CV / Resume
                </span>
                <div className="flex gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setCvMode("upload")}
                    className={`rounded-md px-2 py-0.5 font-medium transition ${
                      cvMode === "upload" ? "bg-sky text-ulab-deep font-semibold" : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    File
                  </button>
                  <button
                    type="button"
                    onClick={() => setCvMode("link")}
                    className={`rounded-md px-2 py-0.5 font-medium transition ${
                      cvMode === "link" ? "bg-sky text-ulab-deep font-semibold" : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    Link
                  </button>
                </div>
              </div>

              {cvMode === "upload" ? (
                <div className="mt-2.5">
                  {cvFile ? (
                    <div className="flex items-center justify-between rounded-lg border border-sage/40 bg-sage-wash/40 p-2.5">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileCheck2 size={16} className="shrink-0 text-sage" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-ink">{cvFile.name}</p>
                          <p className="text-[10px] text-ink-soft">{cvFile.size}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="rounded-md p-1 text-ink-soft hover:bg-surface hover:text-rose"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="cv-upload-input"
                      />
                      <label
                        htmlFor="cv-upload-input"
                        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-mist bg-paper/50 p-4 text-center transition hover:border-ulab hover:bg-sky/20"
                      >
                        <UploadCloud size={20} className="text-ulab mb-1" />
                        <span className="text-xs font-semibold text-ink">Upload your CV (PDF or DOCX)</span>
                        <span className="mt-0.5 text-[10px] text-ink-soft">Maximum file size: 5MB</span>
                      </label>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2.5">
                  <div className="relative">
                    <LinkIcon size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                    <Input
                      type="url"
                      value={cvUrl}
                      onChange={(e) => setCvUrl(e.target.value)}
                      placeholder="Google Drive, Dropbox, or Portfolio CV URL"
                      className="pl-8 text-xs"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-ink-soft">
                    Ensure link sharing is set to &ldquo;Anyone with the link can view&rdquo;.
                  </p>
                </div>
              )}

              {cvError && <p className="mt-1.5 text-[11px] text-rose font-medium">{cvError}</p>}
            </div>

            {/* Cover Note */}
            <Field
              label="Why are you a good fit?"
              hint="Highlight relevant coursework, projects, or experience"
            >
              <Textarea
                name="note"
                rows={3}
                placeholder="Briefly describe what makes you a great candidate for this role..."
                maxLength={800}
                className="text-xs"
              />
            </Field>

            <FormError message={state?.error} />

            <Button className="w-full py-3 text-sm font-semibold shadow-soft" disabled={pending}>
              {pending ? "Submitting Application…" : "Submit Application with CV"}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </Card>
  );
}
