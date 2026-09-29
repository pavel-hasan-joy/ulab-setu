import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("ADMIN");
  const pendingCount = await db.user.count({
    where: { role: { in: ["ALUMNI", "TEACHER"] }, status: "PENDING" },
  });

  return (
    <AppShell
      tone="admin"
      user={{ name: user.name, subtitle: "Administrator" }}
      nav={[
        { href: "/admin", label: "Approvals", icon: "ShieldCheck", badge: pendingCount || undefined },
        { href: "/admin/users", label: "Users Directory", icon: "Users" },
        { href: "/admin/jobs", label: "Job Moderation", icon: "Briefcase" },
        { href: "/admin/notices", label: "Notices & Broadcast", icon: "Megaphone" },
        { href: "/admin/analytics", label: "Analytics & Activity", icon: "BarChart3" },
      ]}
    >
      {children}
    </AppShell>
  );
}
