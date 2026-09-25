import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AlumniLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("ALUMNI");
  const pending = await db.connection.count({ where: { toId: user.id, status: "PENDING" } });
  return (
    <AppShell
      tone="alumni"
      user={{ name: user.name, subtitle: user.company ? `${user.designation ?? ""} at ${user.company}` : "Alumni" }}
      nav={[
        { href: "/alumni", label: "Home", icon: "Home" },
        { href: "/alumni/jobs", label: "My jobs", icon: "Briefcase" },
        { href: "/alumni/jobs/new", label: "Post job", icon: "PlusCircle" },
        { href: "/alumni/messages", label: "Messages", icon: "MessageCircle", badge: pending },
        { href: "/alumni/profile", label: "Profile", icon: "User" },
      ]}
    >
      {children}
    </AppShell>
  );
}
