"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { GraduationCap, Briefcase } from "lucide-react";
import { useActionState, useState } from "react";
import { signup } from "@/app/actions/auth";
import { PageIn } from "@/components/motion";
import { Button, Field, FormError, Input, Select, cn } from "@/components/ui";
import { departments, site } from "@/lib/site";

type Role = "STUDENT" | "ALUMNI";

const roles = [
  { id: "STUDENT" as Role, icon: GraduationCap, title: "Current student", body: "Find mentors and jobs" },
  { id: "ALUMNI" as Role, icon: Briefcase, title: "Alumni", body: "Guide juniors, post jobs" },
];

export function SignupForm({ initialRole }: { initialRole: Role }) {
  const [role, setRole] = useState<Role>(initialRole);
  const [state, action, pending] = useActionState(signup, undefined);
  const f = state?.fields ?? {};

  return (
    <PageIn>
      <h1 className="text-3xl font-semibold">Join {site.name}</h1>
      <p className="mt-2 text-ink-soft">Tell us how you&apos;re connected to {site.universityShort}.</p>

      <div className="mt-8 grid grid-cols-2 gap-3" role="radiogroup" aria-label="I am a">
        {roles.map((r) => (
          <button
            key={r.id}
            type="button"
            role="radio"
            aria-checked={role === r.id}
            onClick={() => setRole(r.id)}
            className={cn(
              "relative rounded-2xl border p-4 text-left transition-colors",
              role === r.id ? "border-transparent" : "border-mist bg-surface hover:border-ulab-light/60",
            )}
          >
            {role === r.id && (
              <motion.span
                layoutId="role-highlight"
                className={cn("absolute inset-0 rounded-2xl border-2", r.id === "STUDENT" ? "border-ulab-light bg-sky" : "border-gold bg-gold-wash")}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative block">
              <r.icon size={20} className={r.id === "STUDENT" ? "text-ulab" : "text-[#9a7212]"} />
              <span className="mt-3 block font-semibold text-ink">{r.title}</span>
              <span className="block text-xs text-ink-soft">{r.body}</span>
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
          label={role === "STUDENT" ? `${site.universityShort} email` : "Email"}
          hint={role === "STUDENT" ? `We only accept @${site.studentEmailDomain} addresses for students.` : "Use the email you check most."}
        >
          <Input name="email" type="email" autoComplete="email" required defaultValue={f.email} placeholder={role === "STUDENT" ? `you@${site.studentEmailDomain}` : ""} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Department" className="sm:col-span-2">
            <Select name="department" options={departments} placeholder="Choose department" required defaultValue={f.department} />
          </Field>
          <Field label="Student ID">
            <Input name="studentId" required defaultValue={f.studentId} />
          </Field>
          <AnimatePresence mode="popLayout" initial={false}>
            {role === "STUDENT" ? (
              <motion.div key="batch" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <Field label="Admission year">
                  <Input name="batch" inputMode="numeric" placeholder="2022" required defaultValue={f.batch} />
                </Field>
              </motion.div>
            ) : (
              <motion.div key="grad" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <Field label="Graduation year">
                  <Input name="graduationYear" inputMode="numeric" placeholder="2019" required defaultValue={f.graduationYear} />
                </Field>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence initial={false}>
          {role === "ALUMNI" && (
            <motion.div
              key="work"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid gap-4 pb-1 sm:grid-cols-2">
                <Field label="Current company">
                  <Input name="company" required defaultValue={f.company} />
                </Field>
                <Field label="Job title">
                  <Input name="designation" required defaultValue={f.designation} />
                </Field>
              </div>
              <p className="mt-3 rounded-xl bg-gold-wash px-3.5 py-2.5 text-xs text-[#7a5a06]">
                The alumni office will check your student ID before you can post jobs. This usually takes a day or two.
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
