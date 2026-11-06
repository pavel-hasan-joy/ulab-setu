import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import { UserSupportView } from "@/components/user-support-view";

export default async function StudentSupportPage() {
  const user = await requireUser("STUDENT");

  const rawTickets = await db.supportTicket.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      assignedTo: { select: { id: true, name: true } },
      messages: {
        where: { isInternal: false },
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
    messages: t.messages
      .filter((m) => !m.isInternal)
      .map((m) => ({
        id: m.id,
        body: m.body,
        isInternal: false,
        createdAt: m.createdAt.toISOString(),
        author: m.author,
      })),
  }));

  return (
    <PageIn>
      <PageHeader
        title="Student Helpdesk & Support"
        description="Submit tickets for technical assistance, account recovery, student ID verification, or platform issues."
      />
      <div className="mt-6">
        <UserSupportView
          initialTickets={serialized}
          currentUserId={user.id}
          baseRole="student"
        />
      </div>
    </PageIn>
  );
}

