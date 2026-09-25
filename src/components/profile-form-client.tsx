"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { useActionState, useState } from "react";
import type { User } from "@prisma/client";
import { updateProfile } from "@/app/actions/profile";
import { departments, teacherRanks } from "@/lib/site";
import { ContactFields } from "./contact-fields";
import { PageIn } from "./motion";
import { Avatar, Badge, Button, Card, Field, FormError, Input, PageHeader, Select, Textarea } from "./ui";

type SafeUser = Omit<User, "passwordHash" | "createdAt">;

export function ProfileFormClient({ user }: { user: SafeUser }) {
  const [toast, setToast] = useState(false);
  const [state, action, pending] = useActionState(async (prev: Awaited<ReturnType<typeof updateProfile>>, fd: FormData) => {
    const result = await updateProfile(prev, fd);
    if (result?.fields?.saved) {
      setToast(true);
      setTimeout(() => setToast(false), 2600);
    }
    return result;
  }, undefined);
  const [name, setName] = useState(user.name);
  const alumni = user.role === "ALUMNI";
  const teacher = user.role === "TEACHER";


  return (
    <PageIn>
      <PageHeader title="Your profile" description={alumni || teacher ? "Students see this before they reach out. A friendly bio gets better questions." : "Alumni and teachers see this when you apply or message them. Keep it short and specific."} />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit p-6 text-center lg:sticky lg:top-8">
          <Avatar name={name || "?"} size={88} className="mx-auto" />
          <p className="mt-4 font-display text-xl font-semibold">{name}</p>
          <p className="text-sm text-ink-soft">{user.email}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            <Badge tone={alumni ? "gold" : teacher ? "lilac" : "blue"}>{alumni ? `Alumni, ${user.graduationYear}` : teacher ? user.designation ?? "Teacher" : `Student, ${user.batch}`}</Badge>
            {user.status === "PENDING" && <Badge tone="gray">Awaiting verification</Badge>}
          </div>
          {user.studentId && <p className="mt-4 text-xs text-ink-soft">ID {user.studentId}</p>}
        </Card>

        <Card className="p-6">
          <form key={state?.at} action={action} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><Input name="name" defaultValue={user.name} onChange={(e) => setName(e.target.value)} required /></Field>
              <Field label="Department"><Select name="department" options={departments} defaultValue={user.department ?? ""} /></Field>
              {alumni ? (
                <>
                  <Field label="Company"><Input name="company" defaultValue={user.company ?? ""} /></Field>
                  <Field label="Job title"><Input name="designation" defaultValue={user.designation ?? ""} /></Field>
                  <Field label="Graduation year"><Input name="graduationYear" defaultValue={user.graduationYear ?? ""} /></Field>
                </>
              ) : teacher ? (
                <Field label="Designation"><Select name="designation" options={teacherRanks} defaultValue={user.designation ?? ""} /></Field>
              ) : (
                <Field label="Admission year"><Input name="batch" defaultValue={user.batch ?? ""} /></Field>
              )}
              <Field label="City"><Input name="location" defaultValue={user.location ?? ""} placeholder="Dhaka" /></Field>
            </div>
            <Field label="Bio" hint={alumni ? "What you do, and what students can ask you about." : teacher ? "What you teach and research, and how students can work with you." : "Two or three sentences about what you're looking for."}>
              <Textarea name="bio" defaultValue={user.bio ?? ""} maxLength={500} />
            </Field>
            <Field label="Skills" hint="Separate with commas, e.g. Python, Public speaking, Figma">
              <Input name="skills" defaultValue={user.skills ?? ""} />
            </Field>
            <Field label="LinkedIn"><Input name="linkedin" type="url" defaultValue={user.linkedin ?? ""} placeholder="https://linkedin.com/in/…" /></Field>
            <ContactFields user={user} />
            <FormError message={state?.error} />
            <Button disabled={pending} className="px-6 py-3">{pending ? "Saving…" : "Save profile"}</Button>
          </form>
        </Card>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center md:bottom-8" role="status">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12 }}
              className="flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-lift"
            >
              <span className="grid size-5 place-items-center rounded-full bg-sage"><Check size={12} /></span> Profile saved
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageIn>
  );
}
