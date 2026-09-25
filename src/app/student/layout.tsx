import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("STUDENT");
  const unread = await db.connection.count({ where: { toId: user.id, status: "PENDING" } });
  return (
    <AppShell
      tone="student"
      user={{ name: user.name, subtitle: `${user.department ?? "Student"}` }}
      nav={[
        { href: "/student", label: "Home", icon: "Home" },
        { href: "/student/jobs", label: "Jobs", icon: "Briefcase" },
        { href: "/student/alumni", label: "Alumni", icon: "Users" },
        { href: "/student/messages", label: "Messages", icon: "MessageCircle", badge: unread },
        { href: "/student/profile", label: "Profile", icon: "User" },
        { href: "/student/applications", label: "Applications", icon: "FileText" },
      ]}
    >
      {children}
    </AppShell>
  );
}
