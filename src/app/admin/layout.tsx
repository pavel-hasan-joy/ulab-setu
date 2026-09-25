import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("ADMIN");
  return (
    <AppShell tone="admin" user={{ name: user.name, subtitle: "Administrator" }} nav={[{ href: "/admin", label: "Approvals", icon: "ShieldCheck" }]}>
      {children}
    </AppShell>
  );
}
