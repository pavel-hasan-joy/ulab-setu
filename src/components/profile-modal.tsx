"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Building2,
  ExternalLink,
  GraduationCap,
  Lock,
  MapPin,
  ShieldCheck,
  X,
} from "lucide-react";
import type { User } from "@prisma/client";
import { site } from "@/lib/site";
import { publicContacts, whatsappLink } from "@/lib/contact";
import { ContactLinks } from "./contact-fields";
import { MessageButton } from "./message-button";
import { ConnectButton, type ConnectionState } from "./connect-button";
import { Avatar, Badge, Button, Card } from "./ui";

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
              <Badge tone="gold">Class of {person.graduationYear || "Alumni"}</Badge>
            )}
            {person.role === "TEACHER" && <Badge tone="lilac">ULAB Faculty</Badge>}
            {person.role === "STUDENT" && <Badge tone="blue">ULAB Student</Badge>}
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

              {/* LinkedIn */}
              {person.linkedin && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-1.5">Professional Link</h4>
                  <a
                    href={person.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-ulab hover:underline"
                  >
                    View LinkedIn Profile <ExternalLink size={12} />
                  </a>
                </div>
              )}

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
