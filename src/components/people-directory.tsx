import Link from "next/link";
import { Globe2, Search, Users } from "lucide-react";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { departments } from "@/lib/site";
import { PageIn } from "./motion";
import { Tabs } from "./tabs";
import { Button, EmptyState, Input, PageHeader, Select } from "./ui";
import { PeopleDirectoryClient, type PendingInvitation } from "./people-directory-client";
import type { ConnectionState } from "./connect-button";
import { getVerifiedAlumniMapPayload } from "@/app/actions/alumni-map";
import { AlumniMapView } from "./alumni-map/alumni-map-view";

type Params = {
  tab?: string;
  q?: string;
  department?: string;
  gradYear?: string;
  batch?: string;
  view?: string;
};

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
  const gradYear = params.gradYear?.trim() || undefined;
  const batch = params.batch?.trim() || undefined;

  const [people, connections, counts, rawInvitations] = await Promise.all([
    tab === "invitations"
      ? Promise.resolve([])
      : db.user.findMany({
          where: {
            id: { not: viewer.id },
            role,
            status: "APPROVED",
            isDemo: false,
            ...(department && { department }),
            ...(gradYear && { graduationYear: gradYear }),
            ...(batch && { batch: { contains: batch, mode: "insensitive" } }),
            ...(q && {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { company: { contains: q, mode: "insensitive" } },
                { designation: { contains: q, mode: "insensitive" } },
                { skills: { contains: q, mode: "insensitive" } },
                { batch: { contains: q, mode: "insensitive" } },
                { graduationYear: { contains: q, mode: "insensitive" } },
                { department: { contains: q, mode: "insensitive" } },
              ],
            }),
          },
          orderBy: tab === "alumni" ? { graduationYear: "desc" } : { name: "asc" },
        }),
    db.connection.findMany({
      where: {
        type: "general",
        OR: [{ fromId: viewer.id }, { toId: viewer.id }],
      },
      select: { id: true, fromId: true, toId: true, status: true },
    }),
    db.user.groupBy({ by: ["role"], where: { status: "APPROVED", id: { not: viewer.id }, isDemo: false }, _count: true }),
    db.connection.findMany({
      where: {
        type: "general",
        toId: viewer.id,
        status: "PENDING",
      },
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
  const link = (t: string) => {
    const qParams: string[] = [`tab=${t}`];
    if (q) qParams.push(`q=${encodeURIComponent(q)}`);
    if (department) qParams.push(`department=${encodeURIComponent(department)}`);
    if (gradYear && t === "alumni") qParams.push(`gradYear=${encodeURIComponent(gradYear)}`);
    return `${basePath}?${qParams.join("&")}`;
  };
  const invitationsCount = pendingInvitations.length;
  const currentView = params.view === "map" && tab === "alumni" ? "map" : "list";

  const mapData =
    currentView === "map"
      ? await getVerifiedAlumniMapPayload({
          q,
          department,
          graduationYear: gradYear,
        })
      : null;

  const viewLink = (v: "list" | "map") => {
    const qParams: string[] = [`tab=${tab}`];
    if (v === "map") qParams.push("view=map");
    if (q) qParams.push(`q=${encodeURIComponent(q)}`);
    if (department) qParams.push(`department=${encodeURIComponent(department)}`);
    if (gradYear && tab === "alumni") qParams.push(`gradYear=${encodeURIComponent(gradYear)}`);
    return `${basePath}?${qParams.join("&")}`;
  };

  return (
    <PageIn>
      <PageHeader
        title="People"
        description="ULAB students, teachers and verified alumni on Setu. Connect and message anyone in the university network."
      />

      {pendingInvitations.length > 0 && tab !== "invitations" && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ulab/30 bg-sky/35 p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ulab text-xs font-bold text-white shadow-xs">
              {pendingInvitations.length}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">
                You have {pendingInvitations.length} pending connection invitation{pendingInvitations.length > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-ink-soft">
                {pendingInvitations[0].from.name}{pendingInvitations.length > 1 ? ` and ${pendingInvitations.length - 1} other` : ""} sent you a connection request.
              </p>
            </div>
          </div>
          <Link
            href={link("invitations")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ulab px-3.5 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-ulab-deep"
          >
            Review Invitations &rarr;
          </Link>
        </div>
      )}

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

      {/* Directory View Switcher (Alumni Tab) */}
      {tab === "alumni" && (
        <div className="mb-6 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-mist bg-paper/70 p-2 sm:px-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink">
            <span className="grid size-6 place-items-center rounded-md bg-sky text-ulab">
              <Globe2 size={13} />
            </span>
            <span>Directory Display Mode:</span>
          </div>

          <div className="inline-flex rounded-xl border border-mist bg-surface p-1 text-xs font-semibold shadow-xs">
            <Link
              href={viewLink("list")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                currentView === "list"
                  ? "bg-ulab text-white shadow-xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Users size={13} />
              <span>List View</span>
            </Link>
            <Link
              href={viewLink("map")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                currentView === "map"
                  ? "bg-ulab text-white shadow-xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Globe2 size={13} />
              <span>Global Map View</span>
            </Link>
          </div>
        </div>
      )}

      {/* Interactive Global Alumni Map View */}
      {tab === "alumni" && currentView === "map" && mapData && (
        <div className="mb-10 animate-in fade-in duration-300">
          <AlumniMapView
            initialItems={mapData.items}
            stats={mapData.stats}
            availableFilters={mapData.availableFilters}
            isPublicMode={false}
            height="620px"
            title="ULABians Around the World"
            subtitle="Explore verified ULAB alumni across global tech, business, and research hubs. Switch between Roadmap and Satellite views."
          />
        </div>
      )}

      {currentView === "list" && tab !== "invitations" && (
        <form className="mb-6 mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input type="hidden" name="tab" value={tab} />
          <div className="relative flex-1">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
            <Input
              name="q"
              defaultValue={q}
              placeholder={
                tab === "alumni"
                  ? "Search by name, company, position, skills, batch, or graduation year..."
                  : tab === "teachers"
                  ? "Search by name, department, designation, or subject..."
                  : "Search students by name, department, batch, or skills..."
              }
              className="pl-10"
            />
          </div>
          <Select
            name="department"
            options={departments}
            placeholder="All departments"
            defaultValue={department ?? ""}
            className="sm:w-56"
          />
          {tab === "alumni" && (
            <Select
              name="gradYear"
              options={[
                "2026", "2025", "2024", "2023", "2022", "2021",
                "2020", "2019", "2018", "2017", "2016", "2015", "2014", "2013"
              ]}
              placeholder="Graduation Year"
              defaultValue={gradYear ?? ""}
              className="sm:w-44"
            />
          )}
          <Button variant="soft" className="shrink-0">Search</Button>
          {(q || department || gradYear || batch) && (
            <Link
              href={`${basePath}?tab=${tab}`}
              className="inline-flex items-center justify-center rounded-xl border border-mist px-3.5 py-2.5 text-xs font-semibold text-ink-soft hover:bg-paper hover:text-ink transition shrink-0"
            >
              Clear
            </Link>
          )}
        </form>
      )}

      {currentView === "list" && (
        <>
          {tab !== "invitations" && people.length === 0 ? (
            <EmptyState
              title="Nobody matches that search"
              body="Try a different keyword or clear the active filters."
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
        </>
      )}
    </PageIn>
  );
}
