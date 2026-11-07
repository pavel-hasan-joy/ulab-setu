"use client";

import { useActionState, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Building, MapPin, Briefcase, Calendar, Trash2 } from "lucide-react";
import { updateJob, deleteJob } from "@/app/actions/jobs";
import { PageIn } from "@/components/motion";
import { Badge, Button, Card, Field, FormError, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { jobCategories, jobTypes } from "@/lib/site";
import type { JobStatus } from "@/lib/jobs";

const experienceLevels = ["Entry", "Mid-level", "Senior", "Executive"] as const;

export function EditJobForm({
  job,
  base = "/alumni",
}: {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    category: string;
    description: string;
    requirements: string | null;
    skills: string | null;
    salary: string | null;
    experienceLevel: string | null;
    deadline: string | null;
    externalUrl: string | null;
    contactEmail: string | null;
    hiringCapacity?: number | null;
    referral: boolean;
    status: JobStatus;
  };
  base?: string;
}) {
  const updateWithId = updateJob.bind(null, job.id);
  const [state, action, pending] = useActionState(updateWithId, undefined);
  const f = state?.fields ?? {};

  const [preview, setPreview] = useState({
    title: f.title ?? job.title,
    type: f.type ?? job.type,
    company: f.company ?? job.company,
    location: f.location ?? job.location,
    category: f.category ?? job.category,
    experienceLevel: f.experienceLevel ?? job.experienceLevel ?? "Entry",
    salary: f.salary ?? job.salary ?? "",
    skills: f.skills ?? job.skills ?? "",
    hiringCapacity: f.hiringCapacity ?? (job.hiringCapacity ? String(job.hiringCapacity) : ""),
    deadline: f.deadline ?? job.deadline ?? "",
    externalUrl: f.externalUrl ?? job.externalUrl ?? "",
    contactEmail: f.contactEmail ?? job.contactEmail ?? "",
    referral: f.referral !== undefined ? (f.referral === "on" || f.referral === "true") : job.referral,
    status: f.status ?? job.status,
  });

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to permanently delete "${job.title}"?`)) return;
    deleteJob(job.id);
  };

  return (
    <PageIn>
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`${base}/jobs/${job.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink transition"
        >
          <ArrowLeft size={16} /> Back to Job Details
        </Link>

        <button
          type="button"
          onClick={handleDelete}
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/20 transition"
        >
          <Trash2 size={14} /> Delete Job
        </button>
      </div>

      <PageHeader
        title="Edit Job Posting"
        description="Update role details, extend deadline, adjust qualifications or manage referral status."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="p-6">
          <form
            key={state?.at}
            action={action}
            className="space-y-6"
            onChange={(e) => {
              const form = e.currentTarget;
              const get = (n: string) => form.elements.namedItem(n) as HTMLInputElement | null;
              setPreview({
                title: get("title")?.value ?? "",
                type: get("type")?.value ?? "Full-time",
                company: get("company")?.value ?? "",
                location: get("location")?.value ?? "",
                category: get("category")?.value ?? "Software & IT",
                experienceLevel: get("experienceLevel")?.value ?? "Entry",
                salary: get("salary")?.value ?? "",
                skills: get("skills")?.value ?? "",
                hiringCapacity: get("hiringCapacity")?.value ?? "",
                deadline: get("deadline")?.value ?? "",
                externalUrl: get("externalUrl")?.value ?? "",
                contactEmail: get("contactEmail")?.value ?? "",
                referral: !!get("referral")?.checked,
                status: (get("status")?.value as JobStatus) ?? "PUBLISHED",
              });
            }}
          >
            {/* Basic Info */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-ulab">Job Details</h2>

              <Field label="Job Title">
                <Input name="title" required defaultValue={f.title ?? job.title} />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company / Organization">
                  <Input name="company" required defaultValue={f.company ?? job.company} />
                </Field>

                <Field label="Work Location">
                  <Input name="location" required defaultValue={f.location ?? job.location} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Employment Type">
                  <Select name="type" options={jobTypes} defaultValue={f.type ?? job.type} />
                </Field>

                <Field label="Category">
                  <Select name="category" options={jobCategories} defaultValue={f.category ?? job.category} />
                </Field>

                <Field label="Experience Level">
                  <Select
                    name="experienceLevel"
                    options={experienceLevels}
                    defaultValue={f.experienceLevel ?? job.experienceLevel ?? "Entry"}
                  />
                </Field>
              </div>
            </div>

            {/* Compensation & Timeline */}
            <div className="space-y-4 border-t border-mist/70 pt-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-ulab">Compensation & Applications</h2>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Salary / Compensation (Optional)">
                  <Input name="salary" defaultValue={f.salary ?? job.salary ?? ""} placeholder="e.g. BDT 40,000 / month" />
                </Field>

                <Field label="Number of People to Hire" hint="Hiring capacity">
                  <Input
                    name="hiringCapacity"
                    type="number"
                    min="1"
                    step="1"
                    defaultValue={f.hiringCapacity ?? (job.hiringCapacity ? String(job.hiringCapacity) : "")}
                    placeholder="e.g. 1, 2, 5"
                  />
                </Field>

                <Field label="Application Deadline">
                  <Input name="deadline" type="date" defaultValue={f.deadline ?? job.deadline ?? ""} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="External Application URL (Optional)">
                  <Input
                    name="externalUrl"
                    type="url"
                    defaultValue={f.externalUrl ?? job.externalUrl ?? ""}
                    placeholder="https://company.com/apply"
                  />
                </Field>

                <Field label="Contact Email (Optional)">
                  <Input
                    name="contactEmail"
                    type="email"
                    defaultValue={f.contactEmail ?? job.contactEmail ?? ""}
                    placeholder="talent@company.com"
                  />
                </Field>
              </div>
            </div>

            {/* Descriptions & Skills */}
            <div className="space-y-4 border-t border-mist/70 pt-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-ulab">Role Description & Requirements</h2>

              <Field label="Required Skills (Comma separated)">
                <Input
                  name="skills"
                  defaultValue={f.skills ?? job.skills ?? ""}
                  placeholder="e.g. React, Next.js, TypeScript"
                />
              </Field>

              <Field label="About the Role & Responsibilities">
                <Textarea
                  name="description"
                  rows={6}
                  required
                  defaultValue={f.description ?? job.description}
                />
              </Field>

              <Field label="Candidate Qualifications (One per line)">
                <Textarea
                  name="requirements"
                  rows={4}
                  defaultValue={f.requirements ?? job.requirements ?? ""}
                />
              </Field>
            </div>

            {/* Referral Option */}
            <div className="border-t border-mist/70 pt-5">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-mist p-4 transition hover:border-gold has-[:checked]:border-gold has-[:checked]:bg-gold-wash/60">
                <input
                  type="checkbox"
                  name="referral"
                  defaultChecked={preview.referral}
                  className="mt-0.5 size-4 accent-gold"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
                    <Sparkles size={16} className="text-gold" />
                    I can provide an internal employee referral for top candidates
                  </span>
                  <span className="block text-xs text-ink-soft mt-0.5">
                    Jobs with referral badges receive prominent placement and higher student response.
                  </span>
                </span>
              </label>
            </div>

            {/* Status Selection */}
            <div className="border-t border-mist/70 pt-5">
              <Field label="Job Status">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-1">
                  {[
                    { id: "PUBLISHED", label: "Published (Live)" },
                    { id: "DRAFT", label: "Draft" },
                    { id: "PAUSED", label: "Paused" },
                    { id: "CLOSED", label: "Closed" },
                  ].map((s) => (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-mist p-2.5 text-xs font-semibold hover:bg-mist transition has-[:checked]:border-ulab has-[:checked]:bg-sky/40"
                    >
                      <input
                        type="radio"
                        name="status"
                        value={s.id}
                        defaultChecked={preview.status === s.id}
                        className="accent-ulab"
                      />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
              </Field>
            </div>

            <FormError message={state?.error} />

            <div className="flex items-center gap-3 pt-3">
              <Button disabled={pending} className="px-6 py-2.5">
                {pending ? "Saving Changes..." : "Save Changes"}
              </Button>
              <Link
                href={`${base}/jobs/${job.id}`}
                className="rounded-xl border border-mist px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-mist hover:text-ink transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </Card>

        {/* Live Preview Card */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">Live Preview</p>
          <motion.div layout>
            <Card className="p-5 shadow-sm border border-mist/80">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone="blue">{preview.type}</Badge>
                {preview.referral && <Badge tone="gold">Referral Available</Badge>}
                {preview.status !== "PUBLISHED" && (
                  <Badge tone={preview.status === "PAUSED" ? "gold" : "gray"}>
                    {preview.status}
                  </Badge>
                )}
              </div>

              <p className="mt-3 text-lg font-bold leading-snug text-ink">{preview.title}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-ink-soft">
                <Building size={14} />
                {preview.company}
              </p>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
                <span className="flex items-center gap-1">
                  <MapPin size={13} />
                  {preview.location}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase size={13} />
                  {preview.experienceLevel}
                </span>
              </div>

              {preview.salary && (
                <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  💰 {preview.salary}
                </p>
              )}

              {preview.skills && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {preview.skills
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .slice(0, 4)
                    .map((skill) => (
                      <span
                        key={skill}
                        className="rounded bg-surface px-1.5 py-0.5 text-[11px] font-medium text-ink-soft border border-mist"
                      >
                        {skill}
                      </span>
                    ))}
                </div>
              )}

              {preview.deadline && (
                <p className="mt-3 flex items-center gap-1 border-t border-mist/60 pt-2 text-[11px] text-ink-soft">
                  <Calendar size={12} /> Apply by {preview.deadline}
                </p>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </PageIn>
  );
}
