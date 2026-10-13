"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Globe, Lock } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import type { User } from "@prisma/client";
import { updateProfile, deleteOwnAccount } from "@/app/actions/profile";
import { departments, teacherRanks } from "@/lib/site";
import { ContactFields } from "./contact-fields";
import { PageIn } from "./motion";
import { Avatar, Badge, Button, Card, Field, FormError, Input, PageHeader, Select, Textarea } from "./ui";
import { AvatarSelector } from "./avatar-selector";

type SafeUser = Omit<User, "passwordHash" | "createdAt">;

export function ProfileFormClient({ user }: { user: SafeUser }) {
  const [toast, setToast] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = () => {
    setDeleteError(null);
    startDeleteTransition(async () => {
      try {
        await deleteOwnAccount();
      } catch (err: any) {
        if (err?.message === "NEXT_REDIRECT" || err?.digest?.startsWith?.("NEXT_REDIRECT")) {
          throw err;
        }
        setDeleteError(err?.message || "Failed to delete account. Please try again.");
      }
    });
  };
  const [state, action, pending] = useActionState(async (prev: Awaited<ReturnType<typeof updateProfile>>, fd: FormData) => {
    const result = await updateProfile(prev, fd);
    if (result?.fields?.saved) {
      setToast(true);
      setTimeout(() => setToast(false), 2600);
    }
    return result;
  }, undefined);
  const [name, setName] = useState(user.name);
  const [image, setImage] = useState<string | null>(user.image ?? null);
  const [isPrivate, setIsPrivate] = useState(user.isPrivate ?? false);
  const alumni = user.role === "ALUMNI";
  const teacher = user.role === "TEACHER";

  return (
    <PageIn>
      <PageHeader title="Your profile" description={alumni || teacher ? "Students see this before they reach out. A friendly bio gets better questions." : "Alumni and teachers see this when you apply or message them. Keep it short and specific."} />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit p-6 text-center lg:sticky lg:top-8">
          <Avatar name={name || "?"} size={88} src={image} className="mx-auto" />
          <p className="mt-4 font-display text-xl font-semibold">{name}</p>
          <p className="text-sm text-ink-soft">{user.email}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            <Badge tone={alumni ? "gold" : teacher ? "lilac" : "blue"}>{alumni ? `Alumni, ${user.graduationYear}` : teacher ? user.designation ?? "Teacher" : `Student, ${user.batch}`}</Badge>
            <Badge tone={isPrivate ? "gray" : "sage"}>{isPrivate ? "🔒 Private Account" : "🌐 Public Profile"}</Badge>
            {user.status === "PENDING" && <Badge tone="gray">Awaiting verification</Badge>}
          </div>
          {user.studentId && <p className="mt-4 text-xs text-ink-soft">ID {user.studentId}</p>}
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <form key={state?.at} action={action} className="space-y-5">
              <input type="hidden" name="image" value={image ?? ""} />
              <AvatarSelector name={name} currentImage={image} onChange={setImage} />

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

              {/* Account Privacy (Public vs Private) */}
              <fieldset className="space-y-3 rounded-2xl border border-mist p-4">
                <legend className="px-1 text-sm font-semibold text-ink">Account Privacy</legend>
                <p className="-mt-1 text-xs text-ink-soft">
                  Control your account visibility: <b>Public</b> allows students, teachers, and alumni to view your profile details. <b>Private</b> keeps your account hidden and shows &ldquo;This account is private&rdquo; when others click on your card.
                </p>
                <input type="hidden" name="isPrivate" value={isPrivate ? "private" : "public"} />
                <div role="radiogroup" aria-label="Account Privacy Setting" className="grid gap-2 sm:grid-cols-2 pt-1">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={!isPrivate}
                    onClick={() => setIsPrivate(false)}
                    className={`relative flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                      !isPrivate
                        ? "border-sage bg-sage-wash/40 shadow-soft"
                        : "border-mist bg-paper/50 hover:border-mist-deep"
                    }`}
                  >
                    <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg ${!isPrivate ? "bg-sage text-white" : "bg-surface text-ink-soft"}`}>
                      <Globe size={14} />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-ink">Public Account</p>
                      <p className="mt-0.5 text-[11px] text-ink-soft leading-snug">
                        Profile, bio, skills, and public details are visible to the Setu community.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={isPrivate}
                    onClick={() => setIsPrivate(true)}
                    className={`relative flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                      isPrivate
                        ? "border-ink bg-surface shadow-soft ring-2 ring-ink/10"
                        : "border-mist bg-paper/50 hover:border-mist-deep"
                    }`}
                  >
                    <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg ${isPrivate ? "bg-ink text-white" : "bg-surface text-ink-soft"}`}>
                      <Lock size={14} />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-ink">Private Account</p>
                      <p className="mt-0.5 text-[11px] text-ink-soft leading-snug">
                        Hides your profile. Others will see &ldquo;This account is private&rdquo; when clicking your card.
                      </p>
                    </div>
                  </button>
                </div>
              </fieldset>
              <FormError message={state?.error} />
              <Button disabled={pending} className="px-6 py-3">{pending ? "Saving…" : "Save profile"}</Button>
            </form>
          </Card>

          <Card className="border border-rose/30 bg-rose-wash/30 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display text-base font-semibold text-rose">Delete account</h3>
                <p className="mt-1 text-xs text-ink-soft">
                  Permanently delete your account, connections, messages, and profile data. This cannot be undone.
                </p>
              </div>
              <Button
                type="button"
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
                className="shrink-0"
              >
                Delete account
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-mist bg-surface p-6 shadow-lift"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-rose-wash text-xl">⚠️</span>
                <div>
                  <h4 className="font-display text-lg font-semibold text-ink">Delete your account?</h4>
                  <p className="text-xs text-ink-soft">This action is permanent and irreversible.</p>
                </div>
              </div>

              <p className="mt-4 text-sm text-ink-soft leading-relaxed">
                Are you sure you want to delete your account? All your personal profile information, messages, job applications, and connections will be permanently wiped.
              </p>

              {deleteError && (
                <div className="mt-4 rounded-xl border border-rose/30 bg-rose-wash p-3 text-xs font-medium text-rose">
                  {deleteError}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!isDeleting) {
                      setShowDeleteModal(false);
                      setDeleteError(null);
                    }
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  disabled={isDeleting}
                  onClick={handleDelete}
                >
                  {isDeleting ? "Deleting…" : "Yes, delete account"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
