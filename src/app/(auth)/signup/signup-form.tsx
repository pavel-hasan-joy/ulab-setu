"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Briefcase, GraduationCap, Presentation } from "lucide-react";
import { useActionState, useState } from "react";
import { signup } from "@/app/actions/auth";
import { PageIn } from "@/components/motion";
import { Button, Field, FormError, Input, Select, cn } from "@/components/ui";
import { departments, site, teacherRanks } from "@/lib/site";

export type SignupRole = "STUDENT" | "ALUMNI" | "TEACHER";

const roles = [
  { id: "STUDENT" as SignupRole, icon: GraduationCap, title: "Student", body: "Find mentors and jobs", tone: "border-ulab-light bg-sky", ink: "text-ulab" },
  { id: "ALUMNI" as SignupRole, icon: Briefcase, title: "Alumni", body: "Guide juniors, post jobs", tone: "border-gold bg-gold-wash", ink: "text-gold-ink" },
  { id: "TEACHER" as SignupRole, icon: Presentation, title: "Teacher", body: "Post notices and jobs", tone: "border-[#a99ce8] bg-lilac-wash", ink: "text-lilac-ink" },
];

const slide = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };

export function SignupForm({ initialRole }: { initialRole: SignupRole }) {
  const [role, setRole] = useState<SignupRole>(initialRole);
  const [state, action, pending] = useActionState(signup, undefined);
  const f = state?.fields ?? {};
  const needsUniEmail = role !== "ALUMNI";

  return (
    <PageIn>
      <h1 className="text-3xl font-semibold">Join {site.name}</h1>
      <p className="mt-2 text-ink-soft">Tell us how you&apos;re connected to {site.universityShort}.</p>

      <div className="mt-8 grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="I am a">
        {roles.map((r) => (
          <button
            key={r.id}
            type="button"
            role="radio"
            aria-checked={role === r.id}
            onClick={() => setRole(r.id)}
            className={cn("relative rounded-2xl border p-3.5 text-left transition-colors", role === r.id ? "border-transparent" : "border-mist bg-surface hover:border-ulab-light/60")}
          >
            {role === r.id && (
              <motion.span layoutId="role-highlight" className={cn("absolute inset-0 rounded-2xl border-2", r.tone)} transition={{ type: "spring", stiffness: 380, damping: 30 }} />
            )}
            <span className="relative block">
              <r.icon size={20} className={r.ink} />
              <span className="mt-2.5 block font-semibold text-ink">{r.title}</span>
              <span className="block text-[11px] leading-tight text-ink-soft">{r.body}</span>
            </span>
          </button>
        ))}
      </div>

      <form key={state?.at} action={action} className="mt-6 space-y-4">
        <input type="hidden" name="role" value={role} />
        <Field label="Full name">
          <Input name="name" autoComplete="name" required defaultValue={f.name} />
        </Field>
        <Field
          label={needsUniEmail ? `${site.universityShort} email` : "Email"}
          hint={needsUniEmail ? `Use your @${site.studentEmailDomain} address.` : "Use the email you check most."}
        >
          <Input name="email" type="email" autoComplete="email" required defaultValue={f.email} placeholder={needsUniEmail ? `you@${site.studentEmailDomain}` : ""} />
        </Field>
        <Field label="Department">
          <Select name="department" options={departments} placeholder="Choose department" required defaultValue={f.department} />
        </Field>

        <AnimatePresence mode="popLayout" initial={false}>
          {role === "STUDENT" && (
            <motion.div key="student" {...slide} className="grid gap-4 sm:grid-cols-2">
              <Field label="Student ID"><Input name="studentId" required defaultValue={f.studentId} /></Field>
              <Field label="Admission year"><Input name="batch" inputMode="numeric" placeholder="2022" required defaultValue={f.batch} /></Field>
            </motion.div>
          )}
          {role === "ALUMNI" && (
            <motion.div key="alumni" {...slide} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Student ID"><Input name="studentId" required defaultValue={f.studentId} /></Field>
                <Field label="Graduation year"><Input name="graduationYear" inputMode="numeric" placeholder="2019" required defaultValue={f.graduationYear} /></Field>
                <Field label="Current company"><Input name="company" required defaultValue={f.company} /></Field>
                <Field label="Job title"><Input name="designation" required defaultValue={f.designation} /></Field>
              </div>
              <p className="rounded-xl bg-gold-wash px-3.5 py-2.5 text-xs text-gold-ink">
                The alumni office will check your student ID before you can post jobs. This usually takes a day or two.
              </p>
            </motion.div>
          )}
          {role === "TEACHER" && (
            <motion.div key="teacher" {...slide} className="space-y-4">
              <Field label="Designation">
                <Select name="designation" options={teacherRanks} placeholder="Choose designation" required defaultValue={f.designation} />
              </Field>
              <p className="rounded-xl bg-lilac-wash px-3.5 py-2.5 text-xs text-lilac-ink">
                The alumni office confirms faculty accounts before you can post notices and jobs. You can message students right away.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <Field label="Password" hint="At least 8 characters.">
          <Input name="password" type="password" autoComplete="new-password" required minLength={8} />
        </Field>
        <FormError message={state?.error} />
        <Button className="w-full py-3" disabled={pending}>{pending ? "Creating account…" : "Create account"}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-soft">
        Already joined? <Link href="/login" className="font-semibold text-ulab hover:underline">Log in</Link>
      </p>
    </PageIn>
  );
}
