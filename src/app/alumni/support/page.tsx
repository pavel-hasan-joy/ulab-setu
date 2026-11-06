import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import { UserSupportView } from "@/components/user-support-view";

export default async function AlumniSupportPage() {
  const user = await requireUser("ALUMNI");

  const rawTickets = await db.supportTicket.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      assignedTo: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, role: true, image: true } },
        },
      },
    },
  });

  const serialized = rawTickets.map((t) => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    subject: t.subject,
    description: t.description,
    category: t.category,
    priority: t.priority,
    status: t.status,
    resolution: t.resolution,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
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
        title="Alumni Helpdesk & Inquiries"
        description="Contact university support regarding recruitment, job postings, verification badges, or technical difficulties."
      />
      <div className="mt-6">
        <UserSupportView
          initialTickets={serialized}
          currentUserId={user.id}
          baseRole="alumni"
        />
      </div>
    </PageIn>
  );
}

