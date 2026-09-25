"use client";

import { useActionState, useState } from "react";
import { motion } from "motion/react";
import { createJob } from "@/app/actions/jobs";
import { PageIn } from "@/components/motion";
import { Badge, Button, Card, Field, FormError, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { jobCategories, jobTypes } from "@/lib/site";

export function NewJobForm({ company }: { company: string }) {
  const [state, action, pending] = useActionState(createJob, undefined);
  const f = state?.fields ?? {};
  const [preview, setPreview] = useState({ title: f.title ?? "", type: f.type ?? "Full-time", company: f.company ?? company, location: f.location ?? "", referral: f.referral === "on" });

  return (
    <PageIn>
      <PageHeader title="Post a job" description="Students see this in the Alumni jobs tab, with your name on it." />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card className="p-6">
          <form key={state?.at} action={action} className="space-y-5" onChange={(e) => {
            const form = e.currentTarget;
            const get = (n: string) => (form.elements.namedItem(n) as HTMLInputElement | null);
            setPreview({ title: get("title")?.value ?? "", type: get("type")?.value ?? "", company: get("company")?.value ?? "", location: get("location")?.value ?? "", referral: !!get("referral")?.checked });
          }}>
            <Field label="Job title"><Input name="title" required defaultValue={f.title} placeholder="Junior Data Analyst" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company"><Input name="company" required defaultValue={f.company ?? company} /></Field>
              <Field label="Location"><Input name="location" required defaultValue={f.location} placeholder="Dhaka (Hybrid)" /></Field>
              <Field label="Type"><Select name="type" options={jobTypes} defaultValue={f.type ?? "Full-time"} /></Field>
              <Field label="Category"><Select name="category" options={jobCategories} defaultValue={f.category ?? "Software & IT"} /></Field>
              <Field label="Salary" hint="Optional, but students appreciate it."><Input name="salary" defaultValue={f.salary} placeholder="BDT 30,000 / month" /></Field>
              <Field label="Application deadline"><Input name="deadline" type="date" defaultValue={f.deadline} /></Field>
            </div>
            <Field label="About the role"><Textarea name="description" rows={6} required defaultValue={f.description} placeholder="What will they work on? Who will they work with?" /></Field>
            <Field label="Requirements" hint="One per line."><Textarea name="requirements" rows={4} defaultValue={f.requirements} /></Field>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-mist p-4 transition hover:border-gold has-[:checked]:border-gold has-[:checked]:bg-gold-wash/60">
              <input type="checkbox" name="referral" defaultChecked={f.referral === "on"} className="mt-0.5 size-4 accent-[#c9971c]" />
              <span>
                <span className="block text-sm font-semibold">I can refer shortlisted students</span>
                <span className="block text-xs text-ink-soft">Jobs with referrals are shown first and get a gold badge.</span>
              </span>
            </label>
            <FormError message={state?.error} />
            <Button disabled={pending} className="px-6 py-3">{pending ? "Posting…" : "Post job"}</Button>
          </form>
        </Card>

        <div className="lg:sticky lg:top-8 lg:self-start">
          <p className="mb-2 text-xs font-medium text-ink-soft">Preview</p>
          <motion.div layout>
            <Card className="p-5">
              <div className="flex flex-wrap gap-1.5">
                <Badge>{preview.type || "Type"}</Badge>
                {preview.referral && <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}><Badge tone="gold">Referral available</Badge></motion.span>}
              </div>
              <p className="mt-3.5 text-[17px] font-semibold leading-snug">{preview.title || "Job title"}</p>
              <p className="mt-1 text-sm text-ink-soft">{preview.company || "Company"}</p>
              <p className="mt-2 text-xs text-ink-soft">{preview.location || "Location"}</p>
            </Card>
          </motion.div>
        </div>
      </div>
    </PageIn>
  );
}
