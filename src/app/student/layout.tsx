import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("STUDENT");
  return (
    <AppShell
      tone="student"
      user={{ name: user.name, subtitle: `${user.department ?? "Student"}` }}
      nav={[
        { href: "/student", label: "Home", icon: "Home" },
        { href: "/student/jobs", label: "Jobs", icon: "Briefcase" },
        { href: "/student/board", label: "Notices", icon: "Megaphone" },
        { href: "/student/people", label: "People", icon: "Users" },
        { href: "/student/messages", label: "Messages", icon: "MessageCircle" },
        { href: "/student/profile", label: "Profile", icon: "User" },
        { href: "/student/applications", label: "Applications", icon: "FileText" },
      ]}
    >
      {children}
    </AppShell>
  );
}
