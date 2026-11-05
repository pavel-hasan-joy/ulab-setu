import {
  Bell,
  Send,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { requireAdminPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { Badge, Card, EmptyState, PageHeader, timeAgo } from "@/components/ui";
import { AdminBroadcastForm } from "@/components/admin-broadcast-form";

export default async function AdminNotificationsPage() {
  await requireAdminPermission("notifications:manage");

  const recentNotifications = await db.notification.findMany({
    take: 15,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, role: true } },
      actor: { select: { name: true } },
    },
  });

  return (
    <PageIn>
      <PageHeader
        title="Notifications & Campus Broadcast Center"
        description="Dispatch real-time in-app alerts and notifications to students, alumni, and faculty."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Broadcast Form */}
        <Card className="p-5 lg:col-span-1">
          <div className="border-b border-mist/70 pb-3 dark:border-white/10">
            <h3 className="font-display text-sm font-bold text-ink">Compose Broadcast</h3>
            <p className="text-xs text-ink-soft">Send institutional alert to targeted user groups.</p>
          </div>
          <div className="mt-4">
            <AdminBroadcastForm />
          </div>
        </Card>

        {/* Recent Dispatched Feed */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-mist/70 pb-3 dark:border-white/10">
            <div>
              <h3 className="font-display text-sm font-bold text-ink">Recently Dispatched Notifications</h3>
              <p className="text-xs text-ink-soft">Activity feed of in-app alerts delivered to users.</p>
            </div>
            <Badge tone="blue">Real-time Feed</Badge>
          </div>

          <div className="mt-4 divide-y divide-mist/60 dark:divide-white/5">
            {recentNotifications.length === 0 ? (
              <EmptyState title="No notifications dispatched yet" body="Send a broadcast notification to begin." />
            ) : (
              recentNotifications.map((n) => (
                <div key={n.id} className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 rounded-lg bg-sky p-1.5 text-ulab-deep dark:bg-sky/20">
                        <Bell size={14} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-xs text-ink">{n.title}</p>
                          <Badge tone="gray" className="text-[10px]">
                            {n.type}
                          </Badge>
                          {n.read ? (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Read</span>
                          ) : (
                            <span className="text-[10px] text-ink-soft">Unread</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-ink-soft">{n.body}</p>
                        <p className="mt-1 text-[11px] text-ink-soft">
                          Delivered to: <strong>{n.user.name}</strong> ({n.user.role}) • {timeAgo(n.createdAt)}
                        </p>
                      </div>
                    </div>
                    {n.link && (
                      <a
                        href={n.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ink-soft hover:text-ulab"
                        title="View Link"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </PageIn>
  );
}

