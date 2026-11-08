import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("STUDENT");
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
      tone="student"
      user={{ name: user.name, subtitle: `${user.department ?? "Student"}`, image: user.image }}
      nav={[
        { href: "/student", label: "Home", icon: "Home" },
        { href: "/student/jobs", label: "Jobs", icon: "Briefcase" },
        { href: "/student/mentors", label: "Find a Mentor", icon: "Compass" },
        { href: "/student/my-mentors", label: "My Mentors", icon: "GraduationCap" },
        { href: "/student/mentorship-messages", label: "Mentorship Messages", icon: "MessageSquare", badge: unreadMentorship > 0 ? unreadMentorship : undefined },
        { href: "/student/tuitions", label: "Tuitions", icon: "BookOpen" },
        { href: "/student/board", label: "Notices", icon: "Megaphone" },
        { href: "/student/people", label: "People", icon: "Users", badge: pendingInvites > 0 ? pendingInvites : undefined },
        { href: "/student/messages", label: "General Messages", icon: "MessageCircle", badge: unreadGeneral > 0 ? unreadGeneral : undefined },
        { href: "/student/notifications", label: "Alerts", icon: "Bell", badge: unreadNotifs > 0 ? unreadNotifs : undefined },
        { href: "/student/applications", label: "Applications", icon: "FileText" },
        { href: "/student/profile", label: "Profile", icon: "User" },
      ]}
    >
      {children}
    </AppShell>
  );
}
