import { requireAdminPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import { AdminTicketsManager } from "@/components/admin-tickets-manager";

export default async function AdminTicketsPage() {
  await requireAdminPermission("tickets:manage");

  const [rawTickets, availableAdmins] = await Promise.all([
    db.supportTicket.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, department: true },
        },
        assignedTo: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, role: true } },
          },
        },
      },
    }),
    db.user.findMany({
      where: { role: "ADMIN", status: "APPROVED" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serialized = rawTickets.map((t) => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    subject: t.subject,
    description: t.description,
    category: t.category,
    priority: t.priority,
    status: t.status,
    resolution: t.resolution,
    internalNotes: t.internalNotes,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    user: t.user,
    assignedTo: t.assignedTo,
    messages: t.messages.map((m) => ({
      id: m.id,
      body: m.body,
      isInternal: m.isInternal,
      createdAt: m.createdAt.toISOString(),
      author: m.author,
    })),
  }));

  return (
    <PageIn>
      <PageHeader
        title="Support & Customer Helpdesk"
        description="Review tickets, assign staff agents, reply to students and alumni, and manage issue resolutions."
      />
      <div className="mt-6">
        <AdminTicketsManager
          initialTickets={serialized}
          availableAdmins={availableAdmins}
        />
      </div>
    </PageIn>
  );
}
