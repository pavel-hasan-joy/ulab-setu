import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("TEACHER");
  return (
    <AppShell
      tone="teacher"
      user={{ name: user.name, subtitle: user.designation ? `${user.designation}, ${user.department ?? ""}` : "Teacher" }}
      nav={[
        { href: "/teacher", label: "Home", icon: "Home" },
        { href: "/teacher/board", label: "Notices", icon: "Megaphone" },
        { href: "/teacher/jobs", label: "My jobs", icon: "Briefcase" },
        { href: "/teacher/messages", label: "Messages", icon: "MessageCircle" },
        { href: "/teacher/people", label: "People", icon: "Users" },
        { href: "/teacher/profile", label: "Profile", icon: "User" },
        { href: "/teacher/jobs/new", label: "Post job", icon: "PlusCircle" },
      ]}
    >
      {children}
    </AppShell>
  );
}
