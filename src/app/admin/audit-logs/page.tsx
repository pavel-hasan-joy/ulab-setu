import {
  History,
  Shield,
  Search,
  LogIn,
  Activity,
  Calendar,
} from "lucide-react";
import { requireAdminPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { Avatar, Badge, Card, EmptyState, PageHeader, timeAgo } from "@/components/ui";

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  await requireAdminPermission("audit:view");
  const params = await searchParams;
  const tab = params?.tab || "ADMIN";

  const [adminLogs, loginLogs] = await Promise.all([
    tab === "ADMIN" || tab === "ALL"
      ? db.adminAuditLog.findMany({
          take: 50,
          orderBy: { createdAt: "desc" },
          include: { admin: { select: { name: true, email: true, designation: true } } },
        })
      : Promise.resolve([]),
    tab === "LOGINS" || tab === "ALL"
      ? db.loginLog.findMany({
          take: 50,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <PageIn>
      <PageHeader
        title="Security & Activity Audit Logs"
        description="Immutable governance trail tracking administrative modifications, role adjustments, and user login activity."
      />

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <a
          href="/admin/audit-logs?tab=ADMIN"
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
            tab === "ADMIN" ? "bg-ulab text-white shadow-soft" : "border border-mist/80 bg-paper text-ink-soft hover:text-ink dark:border-white/10 dark:bg-white/5"
          }`}
        >
          Administrative Changes ({adminLogs.length})
        </a>
        <a
          href="/admin/audit-logs?tab=LOGINS"
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
            tab === "LOGINS" ? "bg-ulab text-white shadow-soft" : "border border-mist/80 bg-paper text-ink-soft hover:text-ink dark:border-white/10 dark:bg-white/5"
          }`}
        >
          Authentication Logins ({loginLogs.length})
        </a>
      </div>

      {tab === "ADMIN" && (
        <Card className="overflow-hidden p-0 shadow-sm">
          {adminLogs.length === 0 ? (
            <div className="p-8">
              <EmptyState title="No admin actions recorded yet" body="Governance actions will be displayed here." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-mist/80 bg-paper/60 text-ink-soft uppercase tracking-wider text-[10px] dark:border-white/10 dark:bg-white/5">
                  <tr>
                    <th className="py-3 px-4">Administrator</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target Type</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist/60 dark:divide-white/5">
                  {adminLogs.map((log) => (
                    <tr key={log.id} className="transition hover:bg-paper/40 dark:hover:bg-white/5">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-ink">{log.admin.name}</p>
                        <p className="text-[11px] text-ink-soft">{log.admin.email}</p>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-ulab">{log.action}</td>
                      <td className="py-3.5 px-4">
                        <Badge tone="gray">{log.targetType}</Badge>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-ink-soft">
                        {log.details || log.targetId || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right text-ink-soft">{timeAgo(log.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === "LOGINS" && (
        <Card className="overflow-hidden p-0 shadow-sm">
          {loginLogs.length === 0 ? (
            <div className="p-8">
              <EmptyState title="No login activity recorded" body="Member login events will appear here." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-mist/80 bg-paper/60 text-ink-soft uppercase tracking-wider text-[10px] dark:border-white/10 dark:bg-white/5">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4 text-right">Login Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist/60 dark:divide-white/5">
                  {loginLogs.map((log) => (
                    <tr key={log.id} className="transition hover:bg-paper/40 dark:hover:bg-white/5">
                      <td className="py-3 px-4 font-semibold text-ink">{log.name}</td>
                      <td className="py-3 px-4">
                        <Badge tone={log.role === "ADMIN" ? "gold" : log.role === "ALUMNI" ? "sage" : "blue"}>
                          {log.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-ink-soft">{log.email}</td>
                      <td className="py-3 px-4 text-right text-ink-soft">{timeAgo(log.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </PageIn>
  );
}

