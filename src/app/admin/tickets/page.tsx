import {
  LifeBuoy,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
} from "lucide-react";
import { requireAdminPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { Avatar, Badge, ButtonLink, Card, EmptyState, PageHeader, timeAgo } from "@/components/ui";
import { AdminTicketActions } from "@/components/admin-ticket-actions";

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; priority?: string }>;
}) {
  await requireAdminPermission("tickets:manage");
  const params = await searchParams;
  const statusFilter = params?.status || "OPEN";
  const priorityFilter = params?.priority;

  const tickets = await db.supportTicket.findMany({
    where: {
      ...(statusFilter === "ALL" ? {} : { status: statusFilter }),
      ...(priorityFilter ? { priority: priorityFilter } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, role: true, department: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageIn>
      <PageHeader
        title="Support & Inquiries Helpdesk"
        description="Respond to user inquiries regarding account credentials, student ID verification, or platform access."
      />

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "ALL"].map((st) => (
          <ButtonLink
            key={st}
            href={`/admin/tickets?status=${st}`}
            variant={statusFilter === st ? "primary" : "outline"}
            className="text-xs py-1.5 px-3"
          >
            {st}
          </ButtonLink>
        ))}
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          title="No support tickets"
          body={`No ${statusFilter.toLowerCase()} tickets currently require administrative attention.`}
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card key={t.id} className="p-4 transition hover:shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-ulab/10 p-2 text-ulab">
                    <LifeBuoy size={18} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-ink">{t.ticketNumber}</span>
                      <Badge tone="gray">{t.category}</Badge>
                      <Badge
                        tone={
                          t.priority === "URGENT" || t.priority === "HIGH"
                            ? "rose"
                            : t.priority === "MEDIUM"
                              ? "gold"
                              : "sage"
                        }
                      >
                        {t.priority}
                      </Badge>
                      <Badge tone={t.status === "OPEN" ? "gold" : t.status === "RESOLVED" ? "sage" : "blue"}>
                        {t.status}
                      </Badge>
                    </div>

                    <h3 className="mt-1.5 font-display text-sm font-bold text-ink">{t.subject}</h3>
                    <p className="mt-1 text-xs text-ink-soft">{t.description}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-ink-soft">
                      <span>Submitted by: <strong>{t.user.name}</strong> ({t.user.email})</span>
                      <span>Filed {timeAgo(t.createdAt)}</span>
                      {t.assignedTo && <span>Assigned to: <strong>{t.assignedTo.name}</strong></span>}
                    </div>

                    {t.resolution && (
                      <div className="mt-2.5 rounded-xl border border-mist/80 bg-paper/60 p-2 text-[11px] text-ink-soft dark:border-white/5">
                        <span className="font-semibold text-ink">Resolution: </span>
                        {t.resolution} {t.resolvedAt ? `(${timeAgo(t.resolvedAt)})` : ""}
                      </div>
                    )}
                  </div>
                </div>

                <AdminTicketActions ticketId={t.id} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageIn>
  );
}

