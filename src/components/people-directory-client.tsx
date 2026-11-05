"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Check,
  Clock,
  GraduationCap,
  Lock,
  MapPin,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type { User } from "@prisma/client";
import { site } from "@/lib/site";
import { publicContacts, whatsappLink } from "@/lib/contact";
import { acceptConnectRequest, declineConnectRequest } from "@/app/actions/network";
import { ContactLinks } from "./contact-fields";
import { MessageButton } from "./message-button";
import { ConnectButton, type ConnectionState } from "./connect-button";
import { ProfileModal } from "./profile-modal";
import { HoverLift, Stagger, StaggerItem } from "./motion";
import { Avatar, Badge, Button, Card, EmptyState, timeAgo } from "./ui";

type SafePerson = Omit<User, "passwordHash">;

export type PendingInvitation = {
  id: string;
  from: SafePerson;
  note: string | null;
  createdAt: Date | string;
};

export function PeopleDirectoryClient({
  people,
  connectionMap,
  invitations = [],
  messagesHref,
  tab,
  department,
  q,
}: {
  people: SafePerson[];
  connectionMap: Record<string, { state: ConnectionState; connectionId?: string }>;
  invitations?: PendingInvitation[];
  messagesHref: string;
  tab: string;
  department?: string;
  q: string;
}) {
  const router = useRouter();
  const [selectedPerson, setSelectedPerson] = useState<SafePerson | null>(null);
  const [localInvitations, setLocalInvitations] = useState<PendingInvitation[]>(invitations);

  useEffect(() => {
    setLocalInvitations(invitations);
  }, [invitations]);

  const handleAcceptInvite = async (invitationId: string) => {
    setLocalInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    await acceptConnectRequest(invitationId);
    router.refresh();
  };

  const handleDeclineInvite = async (invitationId: string) => {
    setLocalInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    await declineConnectRequest(invitationId);
    router.refresh();
  };

  // If in Invitations tab
  if (tab === "invitations") {
    if (localInvitations.length === 0) {
      return (
        <EmptyState
          title="No pending invitations"
          body="When alumni, teachers, or students send you connection requests, they'll appear here."
        />
      );
    }

    return (
      <Stagger className="space-y-3">
        {localInvitations.map((inv) => (
          <StaggerItem key={inv.id}>
            <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 shadow-soft">
              <div className="flex items-start gap-4">
                <Avatar name={inv.from.name} size={52} src={inv.from.image} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display text-base font-semibold text-ink">{inv.from.name}</p>
                    <Badge tone={inv.from.role === "ALUMNI" ? "gold" : inv.from.role === "TEACHER" ? "lilac" : "blue"}>
                      {inv.from.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-soft">
                    {inv.from.department} {inv.from.designation ? `• ${inv.from.designation}` : ""}
                  </p>
                  {inv.note && (
                    <p className="mt-2 text-xs italic text-ink rounded-lg bg-paper px-3 py-1.5 border border-mist/50">
                      &ldquo;{inv.note}&rdquo;
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-ink-soft">{timeAgo(inv.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button
                  variant="outline"
                  onClick={() => handleDeclineInvite(inv.id)}
                  className="px-3 py-1.5 text-xs text-ink-soft hover:text-rose"
                >
                  <X size={13} /> Ignore
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleAcceptInvite(inv.id)}
                  className="px-3 py-1.5 text-xs"
                >
                  <Check size={13} /> Accept
                </Button>
              </div>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>
    );
  }

  return (
    <>
      <Stagger key={`${tab}-${department ?? ""}-${q}`} className="grid gap-4 md:grid-cols-2">
        {people.map((p) => {
          const isPrivate = Boolean(p.isPrivate);
          const connInfo = connectionMap[p.id] ?? { state: "none" };

          return (
            <StaggerItem key={p.id}>
              <HoverLift className="h-full">
                <Card
                  onClick={() => setSelectedPerson(p)}
                  className="flex h-full cursor-pointer flex-col p-5 transition-all hover:border-ulab-light/40 hover:shadow-lift group"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedPerson(p);
                    }
                  }}
                  aria-label={`View ${p.name}'s profile`}
                >
                  <div className="flex items-start gap-4">
                    <Avatar
                      name={p.name}
                      size={52}
                      src={p.image}
                      className="group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-display text-lg font-semibold text-ink group-hover:text-ulab transition-colors">
                          {p.name}
                        </p>
                        {isPrivate && (
                          <span title="Private Account" className="text-ink-soft">
                            <Lock size={13} />
                          </span>
                        )}
                      </div>

                      {p.role === "ALUMNI" ? (
                        <div>
                          <p className="text-sm font-medium text-ink">
                            {p.designation || "Alumnus"}
                            {p.company ? ` at ${p.company}` : ""}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-soft">
                            <span className="font-medium text-ink">{p.department}</span>
                            {p.batch && (
                              <>
                                <span>•</span>
                                <span>Batch {p.batch}</span>
                              </>
                            )}
                            {p.graduationYear && (
                              <>
                                <span>•</span>
                                <span>Class of {p.graduationYear}</span>
                              </>
                            )}
                          </div>
                        </div>
                      ) : p.role === "TEACHER" ? (
                        <div>
                          <p className="text-sm font-medium text-ink">
                            {p.designation || "Faculty"}, {site.universityShort}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-soft">{p.department}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="inline-flex items-center gap-1 text-sm font-medium text-ink">
                            <GraduationCap size={14} /> Student {p.batch ? `• Admitted ${p.batch}` : ""}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-soft">{p.department}</p>
                        </div>
                      )}

                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-soft">
                        {p.company && p.role !== "ALUMNI" && (
                          <span className="inline-flex items-center gap-1">
                            <Building2 size={12} />
                            {p.company}
                          </span>
                        )}
                        {p.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={12} />
                            {p.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {p.role === "ALUMNI" && (
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {p.alumniVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 shadow-xs dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                            <ShieldCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
                            Verified via ULAB Email
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-mist bg-paper px-2 py-0.5 text-[11px] font-medium text-ink-soft">
                            Unverified
                          </span>
                        )}
                        {p.graduationYear && (
                          <Badge tone="gold" className="text-[11px]">Class of {p.graduationYear}</Badge>
                        )}
                      </div>
                    )}
                    {p.role === "TEACHER" && (
                      <Badge tone="lilac" className="shrink-0">Faculty</Badge>
                    )}
                    {p.role === "STUDENT" && isPrivate && (
                      <Badge tone="gray" className="shrink-0 text-[10px]">Private</Badge>
                    )}
                  </div>

                  {isPrivate ? (
                    <div className="mt-4 rounded-xl border border-mist/80 bg-paper/50 px-3.5 py-2.5 text-xs text-ink-soft flex items-center gap-2">
                      <Lock size={13} className="text-ink-soft shrink-0" />
                      <span>This account is private. Click to view profile status.</span>
                    </div>
                  ) : (
                    <>
                      {p.bio && (
                        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                          {p.bio}
                        </p>
                      )}
                      {p.skills && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {p.skills
                            .split(",")
                            .slice(0, 4)
                            .map((s) => (
                              <Badge key={s} tone="gray">{s.trim()}</Badge>
                            ))}
                        </div>
                      )}
                      <CardPublicContacts user={p} />
                    </>
                  )}

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-mist/40">
                    <span className="text-xs text-ink-soft">{p.department}</span>
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedPerson(p)}
                        className="px-3 py-1.5 text-xs font-semibold hover:border-ulab hover:text-ulab"
                      >
                        View Profile
                      </Button>
                      <ConnectButton
                        targetUserId={p.id}
                        targetUserName={p.name}
                        initialState={connInfo.state}
                        connectionId={connInfo.connectionId}
                      />
                      <MessageButton
                        toId={p.id}
                        messagesHref={messagesHref}
                        hasChat={connInfo.state === "connected"}
                      />
                    </div>
                  </div>
                </Card>
              </HoverLift>
            </StaggerItem>
          );
        })}
      </Stagger>

      {/* Profile Modal */}
      <ProfileModal
        person={selectedPerson}
        onClose={() => setSelectedPerson(null)}
        messagesHref={messagesHref}
        connectionState={selectedPerson ? connectionMap[selectedPerson.id]?.state ?? "none" : "none"}
        connectionId={selectedPerson ? connectionMap[selectedPerson.id]?.connectionId : null}
      />
    </>
  );
}

function CardPublicContacts({ user }: { user: SafePerson }) {
  const c = publicContacts(user);
  return (
    <div className="mt-3 empty:hidden" onClick={(e) => e.stopPropagation()}>
      <ContactLinks {...c} whatsappHref={c.whatsapp ? whatsappLink(c.whatsapp) : null} />
    </div>
  );
}
