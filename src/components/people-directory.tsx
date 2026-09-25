import Link from "next/link";
import { Building2, GraduationCap, MapPin, Search } from "lucide-react";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { departments } from "@/lib/site";
import { HoverLift, PageIn, Stagger, StaggerItem } from "./motion";
import { MessageButton } from "./message-button";
import { Tabs } from "./tabs";
import { Avatar, Badge, Button, Card, EmptyState, Input, PageHeader, Select } from "./ui";

type Params = { tab?: string; q?: string; department?: string };

/** Everyone on Setu, split into alumni and students. Anyone can message anyone. */
export async function PeopleDirectory({ viewer, basePath, messagesHref, params }: { viewer: User; basePath: string; messagesHref: string; params: Params }) {
  const tab = params.tab === "students" ? "students" : "alumni";
  const q = params.q?.trim() ?? "";
  const department = params.department || undefined;

  const [people, conversations, counts] = await Promise.all([
    db.user.findMany({
      where: {
        id: { not: viewer.id },
        role: tab === "students" ? "STUDENT" : "ALUMNI",
        status: "APPROVED",
        ...(department && { department }),
        ...(q && { OR: [{ name: { contains: q } }, { company: { contains: q } }, { designation: { contains: q } }, { skills: { contains: q } }] }),
      },
      orderBy: tab === "students" ? { createdAt: "desc" } : { graduationYear: "desc" },
    }),
    db.connection.findMany({ where: { OR: [{ fromId: viewer.id }, { toId: viewer.id }] }, select: { fromId: true, toId: true } }),
    db.user.groupBy({ by: ["role"], where: { status: "APPROVED", id: { not: viewer.id } }, _count: true }),
  ]);
  const talkedTo = new Set(conversations.map((c) => (c.fromId === viewer.id ? c.toId : c.fromId)));
  const count = (role: string) => counts.find((c) => c.role === role)?._count ?? 0;
  const link = (t: string) => `${basePath}?tab=${t}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <PageIn>
      <PageHeader title="People" description="Every ULAB student and verified alumnus on Setu. Press Message to start a conversation with anyone." />
      <Tabs
        active={tab}
        tabs={[
          { id: "alumni", label: "Alumni", href: link("alumni"), count: count("ALUMNI") },
          { id: "students", label: "Students", href: link("students"), count: count("STUDENT") },
        ]}
      />
      <form className="mb-6 mt-5 flex flex-col gap-3 sm:flex-row">
        <input type="hidden" name="tab" value={tab} />
        <div className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input name="q" defaultValue={q} placeholder={tab === "alumni" ? "Name, company, role or skill" : "Name or skill"} className="pl-10" />
        </div>
        <Select name="department" options={departments} placeholder="All departments" defaultValue={department ?? ""} className="sm:w-64" />
        <Button variant="soft">Search</Button>
      </form>

      {people.length === 0 ? (
        <EmptyState title="Nobody matches that search" body="Try a shorter keyword or clear the department filter." action={<Link href={`${basePath}?tab=${tab}`} className="text-sm font-semibold text-ulab hover:underline">Clear search</Link>} />
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2">
          {people.map((p) => (
            <StaggerItem key={p.id}>
              <HoverLift className="h-full">
                <Card className="flex h-full flex-col p-5">
                  <div className="flex items-start gap-4">
                    <Avatar name={p.name} size={52} />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-semibold">{p.name}</p>
                      {p.role === "ALUMNI" ? (
                        <p className="text-sm text-ink">{p.designation}</p>
                      ) : (
                        <p className="inline-flex items-center gap-1 text-sm text-ink"><GraduationCap size={14} /> Student, admitted {p.batch}</p>
                      )}
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-soft">
                        {p.company && <span className="inline-flex items-center gap-1"><Building2 size={12} />{p.company}</span>}
                        {p.location && <span className="inline-flex items-center gap-1"><MapPin size={12} />{p.location}</span>}
                      </div>
                    </div>
                    {p.role === "ALUMNI" && <Badge tone="gold" className="shrink-0">{p.graduationYear}</Badge>}
                  </div>
                  {p.bio && <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-ink-soft">{p.bio}</p>}
                  {p.skills && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.skills.split(",").slice(0, 4).map((s) => <Badge key={s} tone="gray">{s.trim()}</Badge>)}
                    </div>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <span className="text-xs text-ink-soft">{p.department}</span>
                    <MessageButton toId={p.id} messagesHref={messagesHref} hasChat={talkedTo.has(p.id)} />
                  </div>
                </Card>
              </HoverLift>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </PageIn>
  );
}
