import Link from "next/link";
import { Search } from "lucide-react";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { departments } from "@/lib/site";
import { PageIn } from "./motion";
import { Tabs } from "./tabs";
import { Button, EmptyState, Input, PageHeader, Select } from "./ui";
import { PeopleDirectoryClient, type PendingInvitation } from "./people-directory-client";
import type { ConnectionState } from "./connect-button";

type Params = { tab?: string; q?: string; department?: string };

/** Everyone on Setu, split into alumni, teachers, and students. With LinkedIn-style Connect actions. */
export async function PeopleDirectory({
  viewer,
  basePath,
  messagesHref,
  params,
}: {
  viewer: User;
  basePath: string;
  messagesHref: string;
  params: Params;
}) {
  const tab =
    params.tab === "students"
      ? "students"
      : params.tab === "teachers"
      ? "teachers"
      : params.tab === "invitations"
      ? "invitations"
      : "alumni";
  const role = tab === "students" ? "STUDENT" : tab === "teachers" ? "TEACHER" : "ALUMNI";
  const q = params.q?.trim() ?? "";
  const department = params.department || undefined;

  const [people, connections, counts, rawInvitations] = await Promise.all([
    tab === "invitations"
      ? Promise.resolve([])
      : db.user.findMany({
          where: {
            id: { not: viewer.id },
            role,
            status: "APPROVED",
            ...(department && { department }),
            ...(q && {
              OR: [
                { name: { contains: q } },
                { company: { contains: q } },
                { designation: { contains: q } },
                { skills: { contains: q } },
              ],
            }),
          },
          orderBy: tab === "alumni" ? { graduationYear: "desc" } : { name: "asc" },
        }),
    db.connection.findMany({
      where: { OR: [{ fromId: viewer.id }, { toId: viewer.id }] },
      select: { id: true, fromId: true, toId: true, status: true },
    }),
    db.user.groupBy({ by: ["role"], where: { status: "APPROVED", id: { not: viewer.id } }, _count: true }),
    db.connection.findMany({
      where: { toId: viewer.id, status: "PENDING" },
      include: { from: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Compute Connection states
  const connectionMap: Record<string, { state: ConnectionState; connectionId?: string }> = {};
  for (const c of connections) {
    const otherId = c.fromId === viewer.id ? c.toId : c.fromId;
    if (c.status === "ACCEPTED") {
      connectionMap[otherId] = { state: "connected", connectionId: c.id };
    } else if (c.status === "PENDING") {
      if (c.fromId === viewer.id) {
        connectionMap[otherId] = { state: "sent_pending", connectionId: c.id };
      } else {
        connectionMap[otherId] = { state: "received_pending", connectionId: c.id };
      }
    }
  }

  const pendingInvitations: PendingInvitation[] = rawInvitations.map((inv) => {
    const { passwordHash, ...safeFrom } = inv.from;
    return {
      id: inv.id,
      from: safeFrom,
      note: inv.note,
      createdAt: inv.createdAt,
    };
  });

  const count = (role: string) => counts.find((c) => c.role === role)?._count ?? 0;
  const link = (t: string) => `${basePath}?tab=${t}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
  const invitationsCount = pendingInvitations.length;

  return (
    <PageIn>
      <PageHeader
        title="People"
        description="ULAB students, teachers and verified alumni on Setu. Connect and message anyone in the university network."
      />

      <Tabs
        active={tab}
        tabs={[
          { id: "alumni", label: "Alumni", href: link("alumni"), count: count("ALUMNI") },
          { id: "teachers", label: "Teachers", href: link("teachers"), count: count("TEACHER") },
          { id: "students", label: "Students", href: link("students"), count: count("STUDENT") },
          {
            id: "invitations",
            label: "Invitations",
            href: link("invitations"),
            count: invitationsCount,
          },
        ]}
      />

      {tab !== "invitations" && (
        <form className="mb-6 mt-5 flex flex-col gap-3 sm:flex-row">
          <input type="hidden" name="tab" value={tab} />
          <div className="relative flex-1">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
            <Input
              name="q"
              defaultValue={q}
              placeholder={
                tab === "alumni"
                  ? "Name, company, role or skill"
                  : tab === "teachers"
                  ? "Name, designation or subject"
                  : "Name or skill"
              }
              className="pl-10"
            />
          </div>
          <Select
            name="department"
            options={departments}
            placeholder="All departments"
            defaultValue={department ?? ""}
            className="sm:w-64"
          />
          <Button variant="soft">Search</Button>
        </form>
      )}

      {tab !== "invitations" && people.length === 0 ? (
        <EmptyState
          title="Nobody matches that search"
          body="Try a shorter keyword or clear the department filter."
          action={
            <Link href={`${basePath}?tab=${tab}`} className="text-sm font-semibold text-ulab hover:underline">
              Clear search
            </Link>
          }
        />
      ) : (
        <PeopleDirectoryClient
          people={people.map(({ passwordHash, ...safe }) => safe)}
          connectionMap={connectionMap}
          invitations={pendingInvitations}
          messagesHref={messagesHref}
          tab={tab}
          department={department}
          q={q}
        />
      )}
    </PageIn>
  );
}
