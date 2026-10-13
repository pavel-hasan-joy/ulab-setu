import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("STUDENT");
  const pendingInvites = await db.connection.count({ where: { toId: user.id, status: "PENDING" } });

  return (
    <AppShell
      tone="student"
      user={{ name: user.name, subtitle: `${user.department ?? "Student"}`, image: user.image }}
      nav={[
        { href: "/student", label: "Home", icon: "Home" },
        { href: "/student/classroom", label: "Classroom", icon: "GraduationCap" },
        { href: "/student/jobs", label: "Jobs", icon: "Briefcase" },
        { href: "/student/board", label: "Notices", icon: "Megaphone" },
        { href: "/student/people", label: "People", icon: "Users", badge: pendingInvites > 0 ? pendingInvites : undefined },
        { href: "/student/messages", label: "Messages", icon: "MessageCircle" },
        { href: "/student/profile", label: "Profile", icon: "User" },
        { href: "/student/applications", label: "Applications", icon: "FileText" },
      ]}
    >
      {children}
    </AppShell>
  );
}
