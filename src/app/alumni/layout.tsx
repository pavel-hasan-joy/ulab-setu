import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AlumniLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("ALUMNI");
  const [pendingInvites, unreadNotifs, unreadGeneral, unreadMentorship] = await Promise.all([
    db.connection.count({ where: { toId: user.id, status: "PENDING" } }),
    db.notification.count({ where: { userId: user.id, read: false } }),
    db.message.count({
      where: {
        connection: {
          type: "general",
          OR: [{ fromId: user.id }, { toId: user.id }],
        },
        senderId: { not: user.id },
        isRead: false,
      },
    }),
    db.message.count({
      where: {
        connection: {
          type: "mentorship",
          OR: [{ fromId: user.id }, { toId: user.id }],
        },
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
        { href: "/alumni/mentorship", label: "My Mentees", icon: "GraduationCap" },
        { href: "/alumni/mentorship-messages", label: "Mentorship Messages", icon: "MessageSquare", badge: unreadMentorship > 0 ? unreadMentorship : undefined },
        { href: "/alumni/tuitions", label: "Tuitions", icon: "BookOpen" },
        { href: "/alumni/people", label: "People", icon: "Users", badge: pendingInvites > 0 ? pendingInvites : undefined },
        { href: "/alumni/messages", label: "General Messages", icon: "MessageCircle", badge: unreadGeneral > 0 ? unreadGeneral : undefined },
        { href: "/alumni/notifications", label: "Alerts", icon: "Bell", badge: unreadNotifs > 0 ? unreadNotifs : undefined },
        { href: "/alumni/profile", label: "Profile", icon: "User" },
        { href: "/alumni/jobs/new", label: "Post job", icon: "PlusCircle" },
      ]}
    >
      {children}
    </AppShell>
  );
}
