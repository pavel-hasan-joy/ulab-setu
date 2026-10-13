"use client";

import { useState } from "react";
import { Building2, GraduationCap, Lock, MapPin, User as UserIcon } from "lucide-react";
import type { User } from "@prisma/client";
import { site } from "@/lib/site";
import { publicContacts, whatsappLink } from "@/lib/contact";
import { ContactLinks } from "./contact-fields";
import { MessageButton } from "./message-button";
import { ProfileModal } from "./profile-modal";
import { HoverLift, Stagger, StaggerItem } from "./motion";
import { Avatar, Badge, Card } from "./ui";

type SafePerson = Omit<User, "passwordHash">;

export function PeopleDirectoryClient({
  people,
  talkedToIds,
  messagesHref,
  tab,
  department,
  q,
}: {
  people: SafePerson[];
  talkedToIds: string[];
  messagesHref: string;
  tab: string;
  department?: string;
  q: string;
}) {
  const [selectedPerson, setSelectedPerson] = useState<SafePerson | null>(null);
  const talkedToSet = new Set(talkedToIds);

  return (
    <>
      <Stagger key={`${tab}-${department ?? ""}-${q}`} className="grid gap-4 md:grid-cols-2">
        {people.map((p) => {
          const isPrivate = Boolean(p.isPrivate);
          const hasChat = talkedToSet.has(p.id);

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
                    <Avatar name={p.name} size={52} className="group-hover:scale-105 transition-transform" />
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
                        <p className="text-sm text-ink">{p.designation || "Alumnus"}</p>
                      ) : p.role === "TEACHER" ? (
                        <p className="text-sm text-ink">
                          {p.designation || "Faculty"}, {site.universityShort}
                        </p>
                      ) : (
                        <p className="inline-flex items-center gap-1 text-sm text-ink">
                          <GraduationCap size={14} /> Student, admitted {p.batch}
                        </p>
                      )}

                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-soft">
                        {p.company && (
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
                      <Badge tone="gold" className="shrink-0">{p.graduationYear}</Badge>
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

                  <div className="mt-auto flex items-center justify-between gap-3 pt-5 border-t border-mist/40">
                    <span className="text-xs text-ink-soft">{p.department}</span>
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedPerson(p)}
                        className="text-xs font-semibold text-ulab hover:underline mr-1"
                      >
                        View Profile
                      </button>
                      <MessageButton
                        toId={p.id}
                        messagesHref={messagesHref}
                        hasChat={hasChat}
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
        hasChat={selectedPerson ? talkedToSet.has(selectedPerson.id) : false}
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
