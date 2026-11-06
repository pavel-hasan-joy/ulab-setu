import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("STUDENT");
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
      tone="student"
      user={{ name: user.name, subtitle: `${user.department ?? "Student"}`, image: user.image }}
      nav={[
        { href: "/student", label: "Home", icon: "Home" },
        { href: "/student/jobs", label: "Jobs", icon: "Briefcase" },
        { href: "/student/mentors", label: "Find a Mentor", icon: "Compass" },
        { href: "/student/my-mentors", label: "My Mentors", icon: "GraduationCap" },
        { href: "/student/tuitions", label: "Tuitions", icon: "BookOpen" },
        { href: "/student/board", label: "Notices", icon: "Megaphone" },
        { href: "/student/people", label: "People", icon: "Users", badge: pendingInvites > 0 ? pendingInvites : undefined },
        { href: "/student/messages", label: "Messages", icon: "MessageCircle", badge: unreadMessages > 0 ? unreadMessages : undefined },
        { href: "/student/notifications", label: "Alerts", icon: "Bell", badge: unreadNotifs > 0 ? unreadNotifs : undefined },
        { href: "/student/applications", label: "Applications", icon: "FileText" },
        { href: "/student/profile", label: "Profile", icon: "User" },
        { href: "/student/support", label: "Helpdesk", icon: "LifeBuoy" },
      ]}
    >
      {children}
    </AppShell>
  );
}
