import type { Metadata } from "next";
import { Building2, MapPin, Search } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { departments } from "@/lib/site";
import { ConnectButton } from "@/components/connect-button";
import { HoverLift, PageIn, Stagger, StaggerItem } from "@/components/motion";
import { Avatar, Badge, Button, Card, EmptyState, Input, PageHeader, Select } from "@/components/ui";

export const metadata: Metadata = { title: "Alumni" };

export default async function AlumniDirectory({ searchParams }: { searchParams: Promise<{ q?: string; department?: string }> }) {
  const { q = "", department } = await searchParams;
  const user = await requireUser("STUDENT");
  const [alumni, connections] = await Promise.all([
    db.user.findMany({
      where: {
        role: "ALUMNI",
        status: "APPROVED",
        ...(department && { department }),
        ...(q && { OR: [{ name: { contains: q } }, { company: { contains: q } }, { designation: { contains: q } }, { skills: { contains: q } }] }),
      },
      orderBy: { graduationYear: "desc" },
    }),
    db.connection.findMany({ where: { OR: [{ fromId: user.id }, { toId: user.id }] } }),
  ]);
  const connFor = (id: string) => connections.find((c) => c.fromId === id || c.toId === id);

  return (
    <PageIn>
      <PageHeader title="Alumni" description="Every person here graduated from ULAB and was verified by the alumni office. Send a short, specific note when you connect." />
      <form className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input name="q" defaultValue={q} placeholder="Name, company, role or skill" className="pl-10" />
        </div>
        <Select name="department" options={departments} placeholder="All departments" defaultValue={department ?? ""} className="sm:w-64" />
        <Button variant="soft">Search</Button>
      </form>

      {alumni.length === 0 ? (
        <EmptyState title="No alumni match that search" body="Try just a company name or clear the department filter." />
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2">
          {alumni.map((a) => {
            const c = connFor(a.id);
            return (
              <StaggerItem key={a.id}>
                <HoverLift className="h-full">
                  <Card className="flex h-full flex-col p-5">
                    <div className="flex items-start gap-4">
                      <Avatar name={a.name} size={52} />
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-lg font-semibold">{a.name}</p>
                        <p className="text-sm text-ink">{a.designation}</p>
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-soft">
                          {a.company && <span className="inline-flex items-center gap-1"><Building2 size={12} />{a.company}</span>}
                          {a.location && <span className="inline-flex items-center gap-1"><MapPin size={12} />{a.location}</span>}
                        </div>
                      </div>
                      <Badge tone="gold" className="shrink-0">{a.graduationYear}</Badge>
                    </div>
                    {a.bio && <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-ink-soft">{a.bio}</p>}
                    {a.skills && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {a.skills.split(",").slice(0, 4).map((s) => <Badge key={s} tone="gray">{s.trim()}</Badge>)}
                      </div>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                      <span className="text-xs text-ink-soft">{a.department}</span>
                      <div className="shrink-0">
                        <ConnectButton
                          toId={a.id}
                          name={a.name}
                          status={(c?.status as "PENDING" | "ACCEPTED" | "DECLINED") ?? "NONE"}
                          connectionId={c?.id}
                          messagesHref="/student/messages"
                        />
                      </div>
                    </div>
                  </Card>
                </HoverLift>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </PageIn>
  );
}
