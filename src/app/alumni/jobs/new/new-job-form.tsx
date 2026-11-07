"use client";

import { useActionState, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Building, MapPin, Briefcase, Calendar, Globe, Mail } from "lucide-react";
import { createJob } from "@/app/actions/jobs";
import { PageIn } from "@/components/motion";
import { Badge, Button, Card, Field, FormError, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { jobCategories, jobTypes } from "@/lib/site";

const experienceLevels = ["Entry", "Mid-level", "Senior", "Executive"] as const;

export function NewJobForm({ company, base = "/alumni" }: { company: string; base?: string }) {
  const [state, action, pending] = useActionState(createJob, undefined);
  const f = state?.fields ?? {};

  const [preview, setPreview] = useState({
    title: f.title ?? "",
    type: f.type ?? "Full-time",
    company: f.company ?? company,
    location: f.location ?? "",
    category: f.category ?? "Software & IT",
    experienceLevel: f.experienceLevel ?? "Entry",
    salary: f.salary ?? "",
    skills: f.skills ?? "",
    hiringCapacity: f.hiringCapacity ?? "",
    deadline: f.deadline ?? "",
    externalUrl: f.externalUrl ?? "",
    contactEmail: f.contactEmail ?? "",
    referral: f.referral === "on" || f.referral === "true",
    status: f.status ?? "PUBLISHED",
  });

  return (
    <PageIn>
      <div className="mb-4">
        <Link
          href={`${base}/jobs`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink transition"
        >
          <ArrowLeft size={16} /> Back to My Jobs
        </Link>
      </div>

      <PageHeader
        title="Post a Job Opportunity"
        description="Share career opportunities, internships, or referral roles directly with ambitious ULAB students."
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
                status: get("status")?.value ?? "PUBLISHED",
              });
            }}
          >
            {/* Basic Info */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-ulab">Job Details</h2>

              <Field label="Job Title" hint="e.g. Junior Software Engineer, Associate Brand Manager">
                <Input
                  name="title"
                  required
                  defaultValue={f.title}
                  placeholder="e.g. Junior Frontend Developer"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company / Organization">
                  <Input
                    name="company"
                    required
                    defaultValue={f.company ?? company}
                    placeholder="e.g. Brain Station 23 / Pathao"
                  />
                </Field>

                <Field label="Work Location" hint="City, area or work model">
                  <Input
                    name="location"
                    required
                    defaultValue={f.location}
                    placeholder="e.g. Dhanmondi, Dhaka (Hybrid) or Remote"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Employment Type">
                  <Select name="type" options={jobTypes} defaultValue={f.type ?? "Full-time"} />
                </Field>

                <Field label="Category">
                  <Select name="category" options={jobCategories} defaultValue={f.category ?? "Software & IT"} />
                </Field>

                <Field label="Experience Level">
                  <Select
                    name="experienceLevel"
                    options={experienceLevels}
                    defaultValue={f.experienceLevel ?? "Entry"}
                  />
                </Field>
              </div>
            </div>

            {/* Compensation & Timeline */}
            <div className="space-y-4 border-t border-mist/70 pt-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-ulab">Compensation & Applications</h2>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Salary / Compensation (Optional)" hint="e.g. BDT 40,000 / month, or Negotiable">
                  <Input name="salary" defaultValue={f.salary} placeholder="e.g. BDT 40,000 / month" />
                </Field>

                <Field label="Number of People to Hire" hint="How many candidates to recruit">
                  <Input
                    name="hiringCapacity"
                    type="number"
                    min="1"
                    step="1"
                    defaultValue={f.hiringCapacity}
                    placeholder="e.g. 1, 2, 5"
                  />
                </Field>

                <Field label="Application Deadline" hint="Applications close after date">
                  <Input name="deadline" type="date" defaultValue={f.deadline} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="External Application URL (Optional)" hint="Link to company career portal or Google Form">
                  <Input
                    name="externalUrl"
                    type="url"
                    defaultValue={f.externalUrl}
                    placeholder="https://company.com/careers/apply"
                  />
                </Field>

                <Field label="Contact Email (Optional)" hint="For applicant inquiries or direct CVs">
                  <Input
                    name="contactEmail"
                    type="email"
                    defaultValue={f.contactEmail}
                    placeholder="talent@company.com"
                  />
                </Field>
              </div>
            </div>

            {/* Descriptions & Skills */}
            <div className="space-y-4 border-t border-mist/70 pt-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-ulab">Role Description & Requirements</h2>

              <Field label="Required Skills (Comma separated)" hint="e.g. React, Next.js, TypeScript, Tailwind CSS">
                <Input
                  name="skills"
                  defaultValue={f.skills}
                  placeholder="e.g. JavaScript, React, REST API, Git"
                />
              </Field>

              <Field label="About the Role & Responsibilities">
                <Textarea
                  name="description"
                  rows={6}
                  required
                  defaultValue={f.description}
                  placeholder="Describe the day-to-day work, team dynamics, projects, and what the student will learn..."
                />
              </Field>

              <Field label="Candidate Qualifications (One per line)">
                <Textarea
                  name="requirements"
                  rows={4}
                  defaultValue={f.requirements}
                  placeholder="• Bachelor's degree or final-year student in CSE/EEE/BBA&#10;• Good understanding of core concepts&#10;• Strong communication skills"
                />
              </Field>
            </div>

            {/* Referral Option */}
            <div className="border-t border-mist/70 pt-5">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-mist p-4 transition hover:border-gold has-[:checked]:border-gold has-[:checked]:bg-gold-wash/60">
                <input
                  type="checkbox"
                  name="referral"
                  defaultChecked={f.referral === "on" || f.referral === "true"}
                  className="mt-0.5 size-4 accent-gold"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
                    <Sparkles size={16} className="text-gold" />
                    I can provide an internal employee referral for top candidates
                  </span>
                  <span className="block text-xs text-ink-soft mt-0.5">
                    Jobs offering referrals get highlighted with a Gold badge and rank higher in student searches.
                  </span>
                </span>
              </label>
            </div>

            {/* Publication Status Selection */}
            <div className="border-t border-mist/70 pt-5">
              <Field label="Publication Status">
                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="PUBLISHED"
                      defaultChecked={f.status !== "DRAFT"}
                      className="accent-ulab"
                    />
                    <span>Publish Immediately (Visible to all students)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="DRAFT"
                      defaultChecked={f.status === "DRAFT"}
                      className="accent-ulab"
                    />
                    <span>Save as Draft (Private to you)</span>
                  </label>
                </div>
              </Field>
            </div>

            <FormError message={state?.error} />

            <div className="flex items-center gap-3 pt-3">
              <Button disabled={pending} className="px-6 py-2.5">
                {pending ? "Saving..." : preview.status === "DRAFT" ? "Save Draft" : "Publish Job Opportunity"}
              </Button>
              <Link
                href={`${base}/jobs`}
                className="rounded-xl border border-mist px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-mist hover:text-ink transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </Card>

        {/* Live Preview Card */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">Student Card Preview</p>
          <motion.div layout>
            <Card className="p-5 shadow-sm border border-mist/80">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone="blue">{preview.type || "Full-time"}</Badge>
                <Badge tone="gray">{preview.category || "Category"}</Badge>
                {preview.referral && (
                  <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <Badge tone="gold">Referral Available</Badge>
                  </motion.span>
                )}
              </div>

              <p className="mt-3 text-lg font-bold leading-snug text-ink">{preview.title || "Job Title"}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-ink-soft">
                <Building size={14} />
                {preview.company || "Company Name"}
              </p>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
                <span className="flex items-center gap-1">
                  <MapPin size={13} />
                  {preview.location || "Location"}
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
