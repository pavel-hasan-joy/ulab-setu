import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AlumniLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("ALUMNI");
  const [pendingInvites, unreadNotifs, unreadMessages] = await Promise.all([
    db.connection.count({ where: { toId: user.id, status: "PENDING" } }),
    db.notification.count({ where: { userId: user.id, read: false } }),
    db.message.count({
      where: {
        connection: { OR: [{ fromId: user.id }, { toId: user.id }] },
        senderId: { not: user.id },
        isRead: false,
      },
    }),
  ]);

  return (
    <AppShell
      tone="alumni"
      user={{ name: user.name, subtitle: user.company ? `${user.designation ?? ""} at ${user.company}` : "Alumni", image: user.image }}
      nav={[
        { href: "/alumni", label: "Home", icon: "Home" },
        { href: "/alumni/board", label: "Notices", icon: "Megaphone" },
        { href: "/alumni/jobs", label: "My jobs", icon: "Briefcase" },
        { href: "/alumni/tuitions", label: "Tuitions", icon: "BookOpen" },
        { href: "/alumni/people", label: "People", icon: "Users", badge: pendingInvites > 0 ? pendingInvites : undefined },
        { href: "/alumni/messages", label: "Messages", icon: "MessageCircle", badge: unreadMessages > 0 ? unreadMessages : undefined },
        { href: "/alumni/notifications", label: "Alerts", icon: "Bell", badge: unreadNotifs > 0 ? unreadNotifs : undefined },
        { href: "/alumni/profile", label: "Profile", icon: "User" },
        { href: "/alumni/support", label: "Helpdesk", icon: "LifeBuoy" },
        { href: "/alumni/jobs/new", label: "Post job", icon: "PlusCircle" },
      ]}
    >
      {children}
    </AppShell>
  );
}
