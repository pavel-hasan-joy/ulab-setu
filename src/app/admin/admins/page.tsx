import {
  Shield,
  ShieldCheck,
  UserCheck,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { requireAdminPermission, getAdminSubRole, SUB_ROLE_LABELS } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { Avatar, Badge, Card, EmptyState, PageHeader, timeAgo } from "@/components/ui";
import { AdminSubRoleSelector } from "@/components/admin-subrole-selector";

export default async function AdminManagementPage() {
  const { user: currentAdmin } = await requireAdminPermission("admins:manage");

  const admins = await db.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <PageIn>
      <PageHeader
        title="Admin Management & RBAC Permissions"
        description="Configure granular administrative roles: Super Admin, User Admin, Job Moderator, Support Admin, and Analyst."
      />

      {/* Permissions Matrix Information */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { role: "Super Admin", desc: "Full access to all 13 sections and settings.", tone: "gold" as const },
          { role: "User Admin", desc: "User management, Alumni directory, and audit logs.", tone: "blue" as const },
          { role: "Job Moderator", desc: "Job postings, applications review, and report moderation.", tone: "lilac" as const },
          { role: "Support Admin", desc: "Helpdesk tickets, notifications broadcast, and mentorship.", tone: "sage" as const },
          { role: "Analyst", desc: "Read-only access to platform analytics and logs.", tone: "gray" as const },
        ].map((item) => (
          <Card key={item.role} className="p-3.5">
            <Badge tone={item.tone} className="text-xs font-bold">
              {item.role}
            </Badge>
            <p className="mt-2 text-[11px] leading-tight text-ink-soft">{item.desc}</p>
          </Card>
        ))}
      </div>

      {/* Admins Table */}
      <Card className="overflow-hidden p-0 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-mist/80 bg-paper/60 text-ink-soft uppercase tracking-wider text-[10px] dark:border-white/10 dark:bg-white/5">
              <tr>
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Institutional Email</th>
                <th className="py-3 px-4">Administrative Sub-Role</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4 text-right">Assign Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist/60 dark:divide-white/5">
              {admins.map((adm) => {
                const subRole = getAdminSubRole(adm);
                const roleMeta = SUB_ROLE_LABELS[subRole];

                return (
                  <tr key={adm.id} className="transition hover:bg-paper/40 dark:hover:bg-white/5">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={adm.name} size={32} src={adm.image} />
                        <div>
                          <p className="font-bold text-ink">{adm.name}</p>
                          <p className="text-[11px] text-ink-soft">{adm.department || "Administration"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-ink">{adm.email}</td>
                    <td className="py-3.5 px-4">
                      <Badge tone={roleMeta.tone}>{roleMeta.label}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-ink-soft">
                      {adm.lastLoginAt ? timeAgo(adm.lastLoginAt) : "Never logged in"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <AdminSubRoleSelector
                        adminId={adm.id}
                        currentTitle={adm.designation || "Super Admin"}
                        isSelf={adm.id === currentAdmin.id}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </PageIn>
  );
}
