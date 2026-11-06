"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Building2,
  ExternalLink,
  Globe,
  GraduationCap,
  Lock,
  MapPin,
  ShieldCheck,
  X,
} from "lucide-react";
import type { User } from "@prisma/client";
import { site } from "@/lib/site";
import { parseSocialLinks, publicContacts, whatsappLink } from "@/lib/contact";
import { ContactLinks } from "./contact-fields";
import { MessageButton } from "./message-button";
import { ConnectButton, type ConnectionState } from "./connect-button";
import { Avatar, Badge, Button } from "./ui";

function getSocialIcon(name: string, size = 13) {
  const n = name.toLowerCase();
  if (n.includes("github")) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
      </svg>
    );
  }
  if (n.includes("linkedin")) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z" />
      </svg>
    );
  }
  if (n.includes("twitter") || n === "x" || n.includes(" x")) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (n.includes("instagram") || n.includes("insta")) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    );
  }
  if (n.includes("facebook") || n === "fb") {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
        <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4a21 21 0 0 0-2.4-.1c-2.4 0-4 1.4-4 4.1v2.1H7.7v3h2.6V21h3.2Z" />
      </svg>
    );
  }
  if (n.includes("youtube") || n.includes("yt")) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  return <Globe size={size} />;
}

type SafePerson = Omit<User, "passwordHash">;

export function ProfileModal({
  person,
  onClose,
  messagesHref,
  connectionState = "none",
  connectionId,
}: {
  person: SafePerson | null;
  onClose: () => void;
  messagesHref: string;
  connectionState?: ConnectionState;
  connectionId?: string | null;
}) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (person) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [person, onClose]);

  if (!person) return null;

  const isPrivate = Boolean(person.isPrivate);
  const contacts = publicContacts(person);
  const hasAnyPublicContact = Boolean(contacts.phone || contacts.whatsapp || contacts.facebook);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-ink/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-mist bg-surface p-6 shadow-lift"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile"
            className="absolute right-5 top-5 rounded-xl p-2 text-ink-soft transition hover:bg-paper hover:text-ink"
          >
            <X size={18} />
          </button>

          {/* Profile Header */}
          <div className="flex items-start gap-4 pr-8">
            <Avatar name={person.name} size={64} src={person.image} className="ring-4 ring-mist/50" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-xl font-bold text-ink">{person.name}</h3>
                {person.status === "APPROVED" && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-sage" title="Verified Member">
                    <ShieldCheck size={14} /> Verified
                  </span>
                )}
              </div>

              {person.role === "ALUMNI" ? (
                <p className="text-sm font-medium text-ink">{person.designation || "Alumnus"}</p>
              ) : person.role === "TEACHER" ? (
                <p className="text-sm font-medium text-ink">
                  {person.designation || "Faculty"}, {site.universityShort}
                </p>
              ) : (
                <p className="inline-flex items-center gap-1 text-sm font-medium text-ink">
                  <GraduationCap size={15} /> Student {person.batch ? `• Admitted ${person.batch}` : ""}
                </p>
              )}

              <p className="text-xs text-ink-soft">{person.department}</p>
            </div>
          </div>

          {/* Badges Bar */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {person.role === "ALUMNI" && (
              <>
                {person.batch && <Badge tone="gray">Batch {person.batch}</Badge>}
                <Badge tone="gold">Class of {person.graduationYear || "Alumni"}</Badge>
                {person.alumniVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 shadow-xs dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                    <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                    Verified via ULAB Email
                  </span>
                ) : (
                  <Badge tone="gray">Unverified Alumni</Badge>
                )}
              </>
            )}
            {person.role === "TEACHER" && <Badge tone="lilac">ULAB Faculty</Badge>}
            {person.role === "STUDENT" && (
              <>
                <Badge tone="blue">ULAB Student</Badge>
                {person.batch && <Badge tone="gray">Batch {person.batch}</Badge>}
              </>
            )}
            {isPrivate ? (
              <Badge tone="gray" className="inline-flex items-center gap-1">
                <Lock size={12} /> Private Account
              </Badge>
            ) : (
              <Badge tone="sage">Public Account</Badge>
            )}
          </div>

          {/* Case 1: Private Account */}
          {isPrivate ? (
            <div className="mt-6 rounded-2xl border border-mist bg-paper/60 p-6 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-paper text-ink-soft shadow-soft">
                <Lock size={22} className="text-ink-soft" />
              </div>
              <h4 className="mt-3 font-display text-base font-bold text-ink">This account is private</h4>
              <p className="mt-1 text-xs text-ink-soft leading-relaxed max-w-sm mx-auto">
                This user has chosen to keep their profile details private. Bio, skills, work history, and contact details are not visible.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <ConnectButton
                  targetUserId={person.id}
                  targetUserName={person.name}
                  initialState={connectionState}
                  connectionId={connectionId}
                />
                <MessageButton
                  toId={person.id}
                  messagesHref={messagesHref}
                  hasChat={connectionState === "connected"}
                />
              </div>
            </div>
          ) : (
            /* Case 2: Public Account */
            <div className="mt-6 space-y-5">
              {/* Company & Location */}
              {(person.company || person.location) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
                  {person.company && (
                    <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                      <Building2 size={13} className="text-ink-soft" /> {person.company}
                    </span>
                  )}
                  {person.location && (
                    <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                      <MapPin size={13} className="text-ink-soft" /> {person.location}
                    </span>
                  )}
                </div>
              )}

              {/* Bio */}
              {person.bio && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-1.5">About</h4>
                  <p className="text-sm leading-relaxed text-ink whitespace-pre-line rounded-xl bg-paper/50 p-3.5 border border-mist/60">
                    {person.bio}
                  </p>
                </div>
              )}

              {/* Skills */}
              {person.skills && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-2">Skills & Expertise</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {person.skills.split(",").map((s) => (
                      <Badge key={s} tone="gray">{s.trim()}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Professional & Social Links */}
              {(() => {
                const customSocials = parseSocialLinks(person.socialLinks);
                if (!person.linkedin && !person.github && customSocials.length === 0) return null;

                return (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-1.5">
                      Social & Professional Links
                    </h4>
                    <div className="flex flex-wrap items-center gap-2">
                      {person.linkedin && (
                        <a
                          href={person.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-mist bg-paper px-2.5 py-1 text-xs font-semibold text-ulab hover:border-ulab transition shadow-2xs"
                        >
                          {getSocialIcon("linkedin", 12)} LinkedIn <ExternalLink size={10} className="opacity-70" />
                        </a>
                      )}
                      {person.github && (
                        <a
                          href={person.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-mist bg-paper px-2.5 py-1 text-xs font-semibold text-ink hover:border-ink transition shadow-2xs"
                        >
                          {getSocialIcon("github", 12)} {person.github.includes("github.com") ? "GitHub" : "Portfolio / Website"} <ExternalLink size={10} className="opacity-70" />
                        </a>
                      )}
                      {customSocials.map((s) => (
                        <a
                          key={s.id}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-mist bg-paper px-2.5 py-1 text-xs font-semibold text-ink hover:border-ink transition shadow-2xs"
                        >
                          {getSocialIcon(s.name)} {s.name} <ExternalLink size={10} className="opacity-70" />
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Contact Information (Respects individual contact privacy) */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-2">Contact Details</h4>
                {hasAnyPublicContact ? (
                  <div className="rounded-xl border border-mist bg-paper/30 p-3">
                    <ContactLinks
                      {...contacts}
                      whatsappHref={contacts.whatsapp ? whatsappLink(contacts.whatsapp) : null}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-ink-soft italic">
                    Contact details are kept private by this member.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mist pt-5">
                <Button variant="outline" onClick={onClose} className="text-xs">
                  Close
                </Button>
                <div className="flex items-center gap-2">
                  <ConnectButton
                    targetUserId={person.id}
                    targetUserName={person.name}
                    initialState={connectionState}
                    connectionId={connectionId}
                  />
                  <MessageButton
                    toId={person.id}
                    messagesHref={messagesHref}
                    hasChat={connectionState === "connected"}
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
