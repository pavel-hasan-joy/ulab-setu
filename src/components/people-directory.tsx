import Link from "next/link";
import { Search } from "lucide-react";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { departments } from "@/lib/site";
import { PageIn } from "./motion";
import { Tabs } from "./tabs";
import { Button, EmptyState, Input, PageHeader, Select } from "./ui";
import { PeopleDirectoryClient } from "./people-directory-client";

type Params = { tab?: string; q?: string; department?: string };

/** Everyone on Setu, split into alumni and students. Anyone can message anyone. */
export async function PeopleDirectory({ viewer, basePath, messagesHref, params }: { viewer: User; basePath: string; messagesHref: string; params: Params }) {
  const tab = params.tab === "students" ? "students" : params.tab === "teachers" ? "teachers" : "alumni";
  const role = tab === "students" ? "STUDENT" : tab === "teachers" ? "TEACHER" : "ALUMNI";
  const q = params.q?.trim() ?? "";
  const department = params.department || undefined;

  const [people, conversations, counts] = await Promise.all([
    db.user.findMany({
      where: {
        id: { not: viewer.id },
        role,
        status: "APPROVED",
        ...(department && { department }),
        ...(q && { OR: [{ name: { contains: q } }, { company: { contains: q } }, { designation: { contains: q } }, { skills: { contains: q } }] }),
      },
      orderBy: tab === "alumni" ? { graduationYear: "desc" } : { name: "asc" },
    }),
    db.connection.findMany({ where: { OR: [{ fromId: viewer.id }, { toId: viewer.id }] }, select: { fromId: true, toId: true } }),
    db.user.groupBy({ by: ["role"], where: { status: "APPROVED", id: { not: viewer.id } }, _count: true }),
  ]);
  const talkedTo = new Set(conversations.map((c) => (c.fromId === viewer.id ? c.toId : c.fromId)));
  const count = (role: string) => counts.find((c) => c.role === role)?._count ?? 0;
  const link = (t: string) => `${basePath}?tab=${t}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <PageIn>
      <PageHeader title="People" description="ULAB students, teachers and verified alumni on Setu. Press Message to start a conversation with anyone." />
      <Tabs
        active={tab}
        tabs={[
          { id: "alumni", label: "Alumni", href: link("alumni"), count: count("ALUMNI") },
          { id: "teachers", label: "Teachers", href: link("teachers"), count: count("TEACHER") },
          { id: "students", label: "Students", href: link("students"), count: count("STUDENT") },
        ]}
      />
      <form className="mb-6 mt-5 flex flex-col gap-3 sm:flex-row">
        <input type="hidden" name="tab" value={tab} />
        <div className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input name="q" defaultValue={q} placeholder={tab === "alumni" ? "Name, company, role or skill" : tab === "teachers" ? "Name, designation or subject" : "Name or skill"} className="pl-10" />
        </div>
        <Select name="department" options={departments} placeholder="All departments" defaultValue={department ?? ""} className="sm:w-64" />
        <Button variant="soft">Search</Button>
      </form>

      {people.length === 0 ? (
        <EmptyState title="Nobody matches that search" body="Try a shorter keyword or clear the department filter." action={<Link href={`${basePath}?tab=${tab}`} className="text-sm font-semibold text-ulab hover:underline">Clear search</Link>} />
      ) : (
        <PeopleDirectoryClient
          people={people.map(({ passwordHash, ...safe }) => safe)}
          talkedToIds={Array.from(talkedTo)}
          messagesHref={messagesHref}
          tab={tab}
          department={department}
          q={q}
        />
      )}
    </PageIn>
  );
}
