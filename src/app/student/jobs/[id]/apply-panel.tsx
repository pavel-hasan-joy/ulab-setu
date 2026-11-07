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
  Sparkles,
  Calendar,
  AlertCircle,
  HelpCircle,
  Plus,
  FolderGit2,
} from "lucide-react";
import { useActionState, useState, useRef } from "react";
import type { User } from "@prisma/client";
import { applyToJob } from "@/app/actions/jobs";
import { Button, Card, Field, FormError, Input, Textarea, Badge } from "@/components/ui";
import { APPLICATION_STATUS_CONFIG, type ApplicationStatus } from "@/lib/applications";

type SafeStudent = Pick<
  User,
  | "id"
  | "name"
  | "email"
  | "department"
  | "batch"
  | "studentId"
  | "phone"
  | "linkedin"
  | "github"
  | "bio"
  | "skills"
  | "savedCvUrl"
  | "savedCvName"
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
  const hasSavedCv = !!student?.savedCvUrl;
  const [useSavedCv, setUseSavedCv] = useState(hasSavedCv);
  const [saveCvToProfile, setSaveCvToProfile] = useState(true);
  const [cvFile, setCvFile] = useState<{ name: string; size: string; data: string } | null>(null);
  const [cvUrl, setCvUrl] = useState("");
  const [cvMode, setCvMode] = useState<"upload" | "link">("upload");
  const [cvError, setCvError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Optional Multiple Projects & Portfolio state
  const [projectList, setProjectList] = useState<Array<{ id: string; title: string; url: string }>>([
    { id: "proj_1", title: "", url: "" },
  ]);

  const addProject = () => {
    setProjectList((prev) => [
      ...prev,
      { id: `proj_${Date.now()}_${prev.length + 1}`, title: "", url: "" },
    ]);
  };

  const removeProject = (id: string) => {
    setProjectList((prev) => {
      const remaining = prev.filter((p) => p.id !== id);
      if (remaining.length === 0) {
        return [{ id: `proj_${Date.now()}`, title: "", url: "" }];
      }
      return remaining;
    });
  };

  const updateProject = (id: string, field: "title" | "url", value: string) => {
    setProjectList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

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
      const sizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;
      setCvFile({ name: file.name, size: sizeStr, data: result });
      setUseSavedCv(false);
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

  const statusInfo = applied ? APPLICATION_STATUS_CONFIG[applied as ApplicationStatus] : null;

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
            <div
              className={`mx-auto flex size-14 items-center justify-center rounded-2xl ${
                applied === "SHORTLISTED" || applied === "SELECTED"
                  ? "bg-sage-wash text-sage"
                  : applied === "REJECTED"
                  ? "border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400"
                  : applied === "INTERVIEW"
                  ? "border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-400"
                  : applied === "WITHDRAWN"
                  ? "bg-mist text-ink-soft"
                  : "bg-sky text-ulab"
              }`}
            >
              {applied === "REJECTED" ? (
                <X size={30} />
              ) : applied === "INTERVIEW" ? (
                <Calendar size={28} />
              ) : (
                <CheckCircle2 size={32} />
              )}
            </div>

            <p className="mt-3 font-display text-lg font-bold text-ink">
              {statusInfo?.label || "Application Submitted"}
            </p>

            <p className="mt-1 text-xs text-ink-soft leading-relaxed px-2">
              {statusInfo?.description ||
                "Your application has been received and forwarded directly to the hiring alumnus."}
            </p>

            <div className="mt-5 flex justify-center">
              <Link
                href="/student/applications"
                className="inline-flex items-center gap-1.5 rounded-xl bg-ulab px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-ulab-deep transition"
              >
                <FileText size={14} /> View in My Applications
              </Link>
            </div>
          </motion.div>
        ) : !open ? (
          <motion.div key="closed" className="py-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-mist text-ink-soft">
              <AlertCircle size={24} />
            </div>
            <p className="mt-2 text-sm font-semibold text-ink">Applications Closed</p>
            <p className="mt-1 text-xs text-ink-soft">
              This job posting has reached its deadline or has been closed by the poster.
            </p>
          </motion.div>
        ) : (
          <motion.form key="form" action={action} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <input type="hidden" name="jobId" value={jobId} />
            {useSavedCv && <input type="hidden" name="useSavedCv" value="true" />}
            {saveCvToProfile && <input type="hidden" name="saveCvToProfile" value="true" />}
            {cvFile?.data && <input type="hidden" name="cvData" value={cvFile.data} />}
            {cvFile?.name && <input type="hidden" name="cvFileName" value={cvFile.name} />}
            {cvUrl && <input type="hidden" name="cvUrl" value={cvUrl} />}

            {/* Header */}
            <div>
              <div className="flex items-center justify-between">
                <p className="font-display text-base font-bold text-ink">Submit Application</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-sage">
                  <FileCheck2 size={13} /> Setu Direct
                </span>
              </div>
              <p className="mt-0.5 text-xs text-ink-soft">
                Your credentials and CV are securely sent directly to the hiring senior.
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
                  {student.department} {student.batch ? `• Batch ${student.batch}` : ""}{" "}
                  {student.studentId ? `• ID ${student.studentId}` : ""}
                </p>
                <p className="text-[11px] text-ink-soft/80">{student.email}</p>
              </div>
            )}

            {/* CV Selection / Upload Section */}
            <div className="space-y-2 border-t border-mist/70 pt-3">
              <label className="block text-xs font-bold text-ink">Curriculum Vitae (CV / Resume)</label>

              {/* Option A: Use Saved CV if present */}
              {hasSavedCv && (
                <div
                  onClick={() => setUseSavedCv(!useSavedCv)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                    useSavedCv
                      ? "border-sage bg-sage-wash/60 text-sage"
                      : "border-mist bg-surface hover:border-mist/80 text-ink-soft"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileCheck2 size={16} className={useSavedCv ? "text-sage" : "text-ink-soft"} />
                    <div className="text-left">
                      <p className="text-xs font-semibold text-ink">
                        Use Saved Profile CV: {student?.savedCvName || "Resume.pdf"}
                      </p>
                      <p className="text-[10px] text-ink-soft">1-click application ready</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={useSavedCv}
                    onChange={(e) => setUseSavedCv(e.target.checked)}
                    className="size-4 accent-sage cursor-pointer"
                  />
                </div>
              )}

              {/* Option B: Upload new CV or Link */}
              {(!useSavedCv || !hasSavedCv) && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCvMode("upload")}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                        cvMode === "upload" ? "bg-ulab text-white" : "bg-surface text-ink-soft hover:bg-mist"
                      }`}
                    >
                      Upload File (PDF/DOCX)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCvMode("link")}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                        cvMode === "link" ? "bg-ulab text-white" : "bg-surface text-ink-soft hover:bg-mist"
                      }`}
                    >
                      Google Drive Link
                    </button>
                  </div>

                  {cvMode === "upload" ? (
                    <div>
                      {cvFile ? (
                        <div className="flex items-center justify-between rounded-xl border border-sage/50 bg-sage-wash/40 p-2.5 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <FileText size={16} className="text-sage shrink-0" />
                            <span className="font-semibold text-ink truncate">{cvFile.name}</span>
                            <span className="text-[10px] text-ink-soft shrink-0">({cvFile.size})</span>
                          </div>
                          <button
                            type="button"
                            onClick={removeFile}
                            className="p-1 text-ink-soft hover:text-rose-600 transition"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-mist p-4 text-center hover:border-ulab transition">
                          <UploadCloud size={20} className="text-ulab mb-1" />
                          <span className="text-xs font-semibold text-ink">Choose PDF or DOCX file</span>
                          <span className="text-[10px] text-ink-soft">Max file size: 5MB</span>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,.doc"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Input
                        type="url"
                        placeholder="https://drive.google.com/... or OneDrive"
                        value={cvUrl}
                        onChange={(e) => setCvUrl(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  )}

                  {/* Save to Profile Checkbox */}
                  <label className="flex cursor-pointer items-center gap-2 text-[11px] text-ink-soft pt-1">
                    <input
                      type="checkbox"
                      checked={saveCvToProfile}
                      onChange={(e) => setSaveCvToProfile(e.target.checked)}
                      className="accent-ulab size-3.5"
                    />
                    <span>Save this CV to my profile for future 1-click applications</span>
                  </label>
                </div>
              )}

              {cvError && <p className="text-xs font-medium text-rose-600">{cvError}</p>}
            </div>

            {/* Contact Details */}
            <div className="space-y-3 border-t border-mist/70 pt-3">
              <Field label="Phone / WhatsApp" hint="For interview calls">
                <Input
                  name="phone"
                  type="tel"
                  defaultValue={student?.phone ?? ""}
                  placeholder="e.g. 017xxxxxxxx"
                  className="text-xs"
                />
              </Field>

              <Field label="Portfolio or GitHub Link (Optional)">
                <Input
                  name="portfolio"
                  type="text"
                  defaultValue={student?.github ?? ""}
                  placeholder="https://github.com/your-username"
                  className="text-xs"
                />
              </Field>
            </div>

            {/* Projects & Portfolio (Optional) */}
            <div className="space-y-3 border-t border-mist/70 pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-ink flex items-center gap-1.5">
                    <FolderGit2 size={14} className="text-ulab" />
                    Projects & Portfolio (Optional)
                  </h3>
                  <p className="text-[11px] text-ink-soft">
                    Share links to your best projects, live websites, or code repositories.
                  </p>
                </div>
              </div>

              {/* Serialized project links for server action */}
              <input
                type="hidden"
                name="projectLinks"
                value={JSON.stringify(
                  projectList
                    .filter((p) => p.url.trim().length > 0)
                    .map((p) => ({ title: p.title.trim() || null, url: p.url.trim() }))
                )}
              />

              <div className="space-y-3">
                {projectList.map((project, index) => (
                  <div
                    key={project.id}
                    className="relative rounded-xl border border-mist bg-surface/50 p-3 space-y-2.5 transition hover:border-mist-deep"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                        Project {index + 1}
                      </span>
                      {projectList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProject(project.id)}
                          className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline inline-flex items-center gap-0.5"
                          title="Remove this project input"
                        >
                          <X size={12} /> Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-ink-soft mb-0.5">
                          Project Title / Name (Optional)
                        </label>
                        <Input
                          type="text"
                          placeholder="e.g. E-commerce Website, Java Management System"
                          value={project.title}
                          onChange={(e) => updateProject(project.id, "title", e.target.value)}
                          className="text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-ink-soft mb-0.5">
                          Project URL <span className="text-ink-soft font-normal">(e.g. https://github.com/...)</span>
                        </label>
                        <Input
                          type="url"
                          placeholder="https://..."
                          value={project.url}
                          onChange={(e) => updateProject(project.id, "url", e.target.value)}
                          className="text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addProject}
                className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-ulab/60 bg-sky/20 px-3 py-2 text-xs font-semibold text-ulab-deep hover:bg-sky/40 transition w-full justify-center"
              >
                <Plus size={13} /> Add Another Project
              </button>
            </div>

            {/* Cover Note */}
            <div className="border-t border-mist/70 pt-3">
              <Field
                label="Why are you a good fit?"
                hint="Share relevant projects, coursework, or why this role excites you."
              >
                <Textarea
                  name="note"
                  rows={4}
                  placeholder="Hi senior! I saw this role and have completed courses in Database & Web Dev with React projects..."
                  className="text-xs"
                />
              </Field>
            </div>

            <FormError message={state?.error} />

            <Button disabled={pending} className="w-full py-2.5 text-xs font-semibold">
              {pending ? "Submitting Application..." : "Submit Application"}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </Card>
  );
}
