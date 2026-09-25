import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export default async function AlumniLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("ALUMNI");
  return (
    <AppShell
      tone="alumni"
      user={{ name: user.name, subtitle: user.company ? `${user.designation ?? ""} at ${user.company}` : "Alumni" }}
      nav={[
        { href: "/alumni", label: "Home", icon: "Home" },
        { href: "/alumni/jobs", label: "My jobs", icon: "Briefcase" },
        { href: "/alumni/people", label: "People", icon: "Users" },
        { href: "/alumni/messages", label: "Messages", icon: "MessageCircle" },
        { href: "/alumni/profile", label: "Profile", icon: "User" },
        { href: "/alumni/jobs/new", label: "Post job", icon: "PlusCircle" },
      ]}
    >
      {children}
    </AppShell>
  );
}
