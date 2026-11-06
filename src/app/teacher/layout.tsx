import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("TEACHER");
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
      tone="teacher"
      user={{ name: user.name, subtitle: user.designation ? `${user.designation}, ${user.department ?? ""}` : "Teacher", image: user.image }}
      nav={[
        { href: "/teacher", label: "Home", icon: "Home" },
        { href: "/teacher/board", label: "Notices", icon: "Megaphone" },
        { href: "/teacher/jobs", label: "My jobs", icon: "Briefcase" },
        { href: "/teacher/mentorship", label: "My Mentees", icon: "GraduationCap" },
        { href: "/teacher/mentorship-messages", label: "Mentorship Messages", icon: "MessageSquare", badge: unreadMentorship > 0 ? unreadMentorship : undefined },
        { href: "/teacher/tuitions", label: "Tuitions", icon: "BookOpen" },
        { href: "/teacher/messages", label: "General Messages", icon: "MessageCircle", badge: unreadGeneral > 0 ? unreadGeneral : undefined },
        { href: "/teacher/notifications", label: "Alerts", icon: "Bell", badge: unreadNotifs > 0 ? unreadNotifs : undefined },
        { href: "/teacher/people", label: "People", icon: "Users", badge: pendingInvites > 0 ? pendingInvites : undefined },
        { href: "/teacher/profile", label: "Profile", icon: "User" },
        { href: "/teacher/support", label: "Helpdesk", icon: "LifeBuoy" },
        { href: "/teacher/jobs/new", label: "Post job", icon: "PlusCircle" },
      ]}
    >
      {children}
    </AppShell>
  );
}
