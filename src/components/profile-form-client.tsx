"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Globe, Lock, Plus, Trash2 } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import type { User } from "@prisma/client";
import { updateProfile, deleteOwnAccount } from "@/app/actions/profile";
import { departments, teacherRanks } from "@/lib/site";
import { normalizeSocialUrl, parseSocialLinks, type SocialLinkItem } from "@/lib/contact";
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
  const [socialLinks, setSocialLinks] = useState<SocialLinkItem[]>(() => {
    return parseSocialLinks((user as any).socialLinks);
  });
  const alumni = user.role === "ALUMNI";
  const teacher = user.role === "TEACHER";

  const handleAddSocialLink = () => {
    setSocialLinks((prev) => [
      ...prev,
      {
        id: `social-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: "",
        url: "",
        handle: "",
      },
    ]);
  };

  const handleRemoveSocialLink = (id: string) => {
    setSocialLinks((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateSocialLink = (id: string, field: "name" | "handle", value: string) => {
    setSocialLinks((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        const raw = field === "handle" ? value : item.handle || item.url;
        const platform = field === "name" ? value : item.name;
        updated.handle = raw;
        updated.url = platform && raw ? normalizeSocialUrl(platform, raw) : raw;
        return updated;
      })
    );
  };

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
                    <Field label="Batch" hint="e.g. Batch 15 or 151"><Input name="batch" defaultValue={user.batch ?? ""} placeholder="e.g. Batch 15" /></Field>
                    <Field label="Graduation year" hint="Year of graduation"><Input name="graduationYear" defaultValue={user.graduationYear ?? ""} placeholder="e.g. 2022" /></Field>
                    <Field label="Current Company"><Input name="company" defaultValue={user.company ?? ""} placeholder="e.g. Google, Brain Station 23" /></Field>
                    <Field label="Current Position / Title"><Input name="designation" defaultValue={user.designation ?? ""} placeholder="e.g. Software Engineer, Team Lead" /></Field>
                  </>
                ) : teacher ? (
                  <>
                    <Field label="Designation / Academic Rank"><Select name="designation" options={teacherRanks} defaultValue={user.designation ?? ""} /></Field>
                    <Field label="Campus / Room Office"><Input name="location" defaultValue={user.location ?? ""} placeholder="e.g. Permanent Campus, Room 402" /></Field>
                  </>
                ) : (
                  <>
                    <Field label="Batch / Admission Year"><Input name="batch" defaultValue={user.batch ?? ""} placeholder="e.g. 211 or Batch 21" /></Field>
                    <Field label="Current Company / Internship"><Input name="company" defaultValue={user.company ?? ""} placeholder="e.g. Tech Corp (Optional)" /></Field>
                    <Field label="Current Role / Position"><Input name="designation" defaultValue={user.designation ?? ""} placeholder="e.g. Intern, Junior Developer (Optional)" /></Field>
                  </>
                )}
                {!teacher && (
                  <Field label="City / Location"><Input name="location" defaultValue={user.location ?? ""} placeholder="Dhaka, Bangladesh" /></Field>
                )}
              </div>
              <Field label="Biography & Professional Experience" hint={alumni ? "What you do, your career journey, and what students or peers can ask you about." : teacher ? "What you teach and research, and how students can work with you." : "Two or three sentences about your studies, interests, and what you're looking for."}>
                <Textarea name="bio" defaultValue={user.bio ?? ""} maxLength={600} rows={4} />
              </Field>
              <Field label="Skills & Expertise" hint="Separate with commas, e.g. Python, Public speaking, React, Financial Analysis">
                <Input name="skills" defaultValue={user.skills ?? ""} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="LinkedIn Profile">
                  <Input name="linkedin" type="text" defaultValue={user.linkedin ?? ""} placeholder="Username or link (e.g. username or https://linkedin.com/in/...)" />
                </Field>
                <Field label="Portfolio or Personal Website">
                  <Input name="github" type="text" defaultValue={user.github ?? ""} placeholder="Personal portfolio, website, or GitHub URL (e.g. https://...)" />
                </Field>
              </div>
              <ContactFields user={user} />

              {/* Global Alumni Network Map & Location Privacy */}
              {alumni && (
                <fieldset className="space-y-4 rounded-2xl border border-mist p-4 sm:p-5">
                  <legend className="px-1 text-sm font-semibold text-ink flex items-center gap-1.5">
                    <Globe size={15} className="text-ulab" /> Global Alumni Map & Location Privacy
                  </legend>
                  <p className="-mt-1 text-xs text-ink-soft">
                    Connect with fellow ULABians worldwide on the global alumni network map. Only approximate city-center coordinates are used — your exact home or workplace address is never stored or exposed.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Current City" hint="e.g. Dhaka, London, Toronto, Sydney, New York">
                      <Input name="city" defaultValue={(user as any).city ?? ""} placeholder="e.g. Dhaka" />
                    </Field>
                    <Field label="Current Country" hint="e.g. Bangladesh, United Kingdom, Canada, Australia">
                      <Input name="country" defaultValue={(user as any).country ?? ""} placeholder="e.g. Bangladesh" />
                    </Field>
                  </div>
                  <Field label="Show my approximate location on the Alumni Map" hint="Default is Hidden. You maintain complete control over who can discover your location.">
                    <select
                      name="mapLocationVisibility"
                      defaultValue={(user as any).mapLocationVisibility ?? "HIDDEN"}
                      className="w-full rounded-xl border border-mist bg-surface px-3.5 py-2.5 text-[15px] text-ink transition focus:border-ulab-light focus:outline-none focus:ring-4 focus:ring-ulab-light/15"
                    >
                      <option value="HIDDEN">🔒 Hidden — Do not show my location on the map</option>
                      <option value="MEMBERS_ONLY">👥 Visible to Verified ULAB Members (Students, Alumni & Faculty)</option>
                      <option value="PUBLIC">🌐 Public — Visible on public homepage map & directory</option>
                    </select>
                  </Field>
                </fieldset>
              )}

              {/* Custom Social Media & Web Profiles */}
              <input type="hidden" name="socialLinks" value={JSON.stringify(socialLinks)} />
              <fieldset className="space-y-3 rounded-2xl border border-mist p-4 sm:p-5">
                <legend className="px-1 text-sm font-semibold text-ink flex items-center gap-1.5">
                  <Globe size={15} className="text-ulab" /> Social Media & Custom Links
                </legend>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="-mt-1 text-xs text-ink-soft">
                    Add your social media handles, coding platforms, or portfolios (e.g. Twitter/X, Instagram, YouTube, LeetCode, Kaggle, etc.).
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddSocialLink}
                    className="inline-flex items-center gap-1.5 self-start sm:self-auto text-xs font-semibold py-1.5 px-3 hover:border-ulab hover:text-ulab"
                  >
                    <Plus size={14} /> Add Social Link
                  </Button>
                </div>

                <datalist id="social-platform-suggestions">
                  <option value="Twitter / X" />
                  <option value="Instagram" />
                  <option value="Facebook" />
                  <option value="YouTube" />
                  <option value="GitHub" />
                  <option value="LinkedIn" />
                  <option value="LeetCode" />
                  <option value="Codeforces" />
                  <option value="Kaggle" />
                  <option value="Discord" />
                  <option value="Telegram" />
                  <option value="Medium" />
                  <option value="Behance" />
                  <option value="Dribbble" />
                  <option value="Portfolio / Website" />
                </datalist>

                {socialLinks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-mist-deep/40 bg-surface/60 py-6 text-center">
                    <p className="text-xs text-ink-soft">No extra social links added yet.</p>
                    <button
                      type="button"
                      onClick={handleAddSocialLink}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-ulab hover:underline"
                    >
                      <Plus size={13} /> Click here to add your first social media link
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {socialLinks.map((item, idx) => {
                      const previewUrl = item.name && (item.handle || item.url) ? normalizeSocialUrl(item.name, item.handle || item.url) : null;
                      return (
                        <div
                          key={item.id}
                          className="group relative flex flex-col gap-2.5 rounded-xl border border-mist bg-paper/30 p-3.5 shadow-2xs transition hover:border-mist-deep"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-mist/60 pb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                              Social Link #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSocialLink(item.id)}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium text-rose hover:bg-rose-wash transition"
                              title="Remove this link"
                            >
                              <Trash2 size={13} /> Remove
                            </button>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            {/* 1st Field: Social Media Name */}
                            <div>
                              <label className="block text-xs font-semibold text-ink mb-1">
                                1. Social Media Name
                              </label>
                              <input
                                type="text"
                                list="social-platform-suggestions"
                                value={item.name}
                                onChange={(e) => handleUpdateSocialLink(item.id, "name", e.target.value)}
                                placeholder="e.g. Twitter, Instagram, LeetCode, YouTube..."
                                className="w-full rounded-xl border border-mist bg-surface px-3 py-2 text-xs font-medium text-ink placeholder:text-ink-soft/70 focus:border-ulab focus:outline-hidden"
                                required
                              />
                            </div>

                            {/* 2nd Field: Link or Username */}
                            <div>
                              <label className="block text-xs font-semibold text-ink mb-1">
                                2. Link or Username
                              </label>
                              <input
                                type="text"
                                value={item.handle || item.url}
                                onChange={(e) => handleUpdateSocialLink(item.id, "handle", e.target.value)}
                                placeholder="e.g. @username or https://..."
                                className="w-full rounded-xl border border-mist bg-surface px-3 py-2 text-xs font-medium text-ink placeholder:text-ink-soft/70 focus:border-ulab focus:outline-hidden"
                                required
                              />
                            </div>
                          </div>

                          {/* Generated URL preview */}
                          {previewUrl && (
                            <div className="flex items-center gap-1.5 text-[11px] text-ink-soft truncate pt-0.5">
                              <span className="font-medium text-sage">Resolved URL:</span>
                              <span className="truncate text-ink-soft/80">{previewUrl}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </fieldset>

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
