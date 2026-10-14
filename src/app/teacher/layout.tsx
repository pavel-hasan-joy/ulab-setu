import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("TEACHER");
  const pendingInvites = await db.connection.count({ where: { toId: user.id, status: "PENDING" } });

  return (
    <AppShell
      tone="teacher"
      user={{ name: user.name, subtitle: user.designation ? `${user.designation}, ${user.department ?? ""}` : "Teacher", image: user.image }}
      nav={[
        { href: "/teacher", label: "Home", icon: "Home" },
        { href: "/teacher/board", label: "Notices", icon: "Megaphone" },
        { href: "/teacher/jobs", label: "My jobs", icon: "Briefcase" },
        { href: "/teacher/tuitions", label: "Tuitions", icon: "BookOpen" },
        { href: "/teacher/messages", label: "Messages", icon: "MessageCircle" },
        { href: "/teacher/people", label: "People", icon: "Users", badge: pendingInvites > 0 ? pendingInvites : undefined },
        { href: "/teacher/profile", label: "Profile", icon: "User" },
        { href: "/teacher/jobs/new", label: "Post job", icon: "PlusCircle" },
      ]}
    >
      {children}
    </AppShell>
  );
}
