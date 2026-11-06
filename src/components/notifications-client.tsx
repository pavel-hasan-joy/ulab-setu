"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Filter,
  Inbox,
  Mail,
  MessageCircle,
  Briefcase,
  Users,
  Settings2,
  Trash2,
  Check,
  X,
} from "lucide-react";
import {
  markAllNotificationsRead,
  markNotificationRead,
  deleteNotification,
  updateNotificationPreferences,
  type UserNotificationItem,
  type NotificationPreferences,
} from "@/app/actions/notifications";
import { Avatar, Badge, Button, cn, timeAgo } from "./ui";

interface NotificationsClientProps {
  initialNotifications: UserNotificationItem[];
  initialUnreadCount: number;
  initialPreferences: NotificationPreferences;
  baseRole: "student" | "alumni" | "teacher" | "admin";
}

type FilterTab = "ALL" | "UNREAD" | "MESSAGE" | "APPLICATION" | "SYSTEM";

export function NotificationsClient({
  initialNotifications,
  initialUnreadCount,
  initialPreferences,
  baseRole,
}: NotificationsClientProps) {
  const [notifications, setNotifications] = useState<UserNotificationItem[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
  const [filter, setFilter] = useState<FilterTab>("ALL");
  const [prefsModalOpen, setPrefsModalOpen] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(initialPreferences);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSavedMessage, setPrefsSavedMessage] = useState(false);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "UNREAD") return !n.read;
    if (filter === "MESSAGE") return n.type === "MESSAGE";
    if (filter === "APPLICATION") return n.type === "APPLICATION";
    if (filter === "SYSTEM") return n.type === "SYSTEM" || n.type === "CONNECTION" || n.type === "MENTORSHIP";
    return true;
  });

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await markAllNotificationsRead();
  };

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await markNotificationRead(id);
  };

  const handleDelete = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    if (target && !target.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await deleteNotification(id);
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    await updateNotificationPreferences(preferences);
    setSavingPrefs(false);
    setPrefsSavedMessage(true);
    setTimeout(() => {
      setPrefsSavedMessage(false);
      setPrefsModalOpen(false);
    }, 1200);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "MESSAGE":
        return <MessageCircle size={16} className="text-blue-600 dark:text-blue-400" />;
      case "APPLICATION":
        return <Briefcase size={16} className="text-emerald-600 dark:text-emerald-400" />;
      case "CONNECTION":
        return <Users size={16} className="text-purple-600 dark:text-purple-400" />;
      default:
        return <Bell size={16} className="text-gold-ink dark:text-gold" />;
    }
  };

  const getBadgeTone = (type: string): "blue" | "sage" | "lilac" | "gold" | "gray" => {
    switch (type) {
      case "MESSAGE":
        return "blue";
      case "APPLICATION":
        return "sage";
      case "CONNECTION":
        return "lilac";
      case "MENTORSHIP":
        return "gold";
      default:
        return "gray";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Card */}
      <div className="flex flex-col gap-4 rounded-2xl border border-mist bg-surface p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilter("ALL")}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
              filter === "ALL"
                ? "bg-ulab text-white shadow-sm"
                : "bg-paper text-ink-soft hover:text-ink"
            )}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("UNREAD")}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition",
              filter === "UNREAD"
                ? "bg-ulab text-white shadow-sm"
                : "bg-paper text-ink-soft hover:text-ink"
            )}
          >
            Unread
            {unreadCount > 0 && (
              <span className="grid size-4 place-items-center rounded-full bg-rose text-[10px] text-white">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter("MESSAGE")}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
              filter === "MESSAGE"
                ? "bg-ulab text-white shadow-sm"
                : "bg-paper text-ink-soft hover:text-ink"
            )}
          >
            Messages
          </button>
          <button
            onClick={() => setFilter("APPLICATION")}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
              filter === "APPLICATION"
                ? "bg-ulab text-white shadow-sm"
                : "bg-paper text-ink-soft hover:text-ink"
            )}
          >
            Jobs & Applications
          </button>
          <button
            onClick={() => setFilter("SYSTEM")}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
              filter === "SYSTEM"
                ? "bg-ulab text-white shadow-sm"
                : "bg-paper text-ink-soft hover:text-ink"
            )}
          >
            Campus & Network
          </button>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllRead}
              className="py-1.5 px-3 gap-1.5 text-xs font-medium"
            >
              <CheckCheck size={14} />
              Mark all as read
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => setPrefsModalOpen(true)}
            className="py-1.5 px-3 gap-1.5 text-xs text-ink-soft hover:text-ink"
            title="Notification Preferences"
          >
            <Settings2 size={15} />
            Preferences
          </Button>
        </div>
      </div>

      {/* Notifications Feed */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="rounded-2xl border border-mist bg-surface p-12 text-center shadow-soft">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-sky text-ulab-deep dark:bg-sky/20">
              <Inbox size={24} />
            </div>
            <h3 className="mt-4 text-sm font-bold text-ink">
              {filter === "UNREAD" ? "You're completely caught up!" : "No notifications to display"}
            </h3>
            <p className="mt-1 text-xs text-ink-soft">
              {filter === "UNREAD"
                ? "All messages, applications, and updates have been viewed."
                : "New updates will appear here in real-time."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                "group relative flex items-start justify-between gap-4 rounded-2xl border p-4 transition shadow-soft",
                notif.read
                  ? "border-mist/60 bg-surface hover:bg-paper/60"
                  : "border-sky-light/50 bg-sky/30 hover:bg-sky/40 dark:bg-sky/10"
              )}
            >
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                {/* Icon or Actor Avatar */}
                {notif.actor ? (
                  <Avatar name={notif.actor.name} src={notif.actor.image} size={40} className="shrink-0" />
                ) : (
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-paper border border-mist/80">
                    {getNotificationIcon(notif.type)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className={cn("text-sm", notif.read ? "font-semibold text-ink" : "font-bold text-ink")}>
                      {notif.title}
                    </h4>
                    <Badge tone={getBadgeTone(notif.type)} className="text-[10px]">
                      {notif.type}
                    </Badge>
                    {!notif.read && (
                      <span className="size-2 rounded-full bg-ulab ring-4 ring-ulab/20" />
                    )}
                  </div>

                  <p className="mt-1 text-xs text-ink-soft leading-relaxed break-words">
                    {notif.body}
                  </p>

                  <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-soft">
                    <span>{timeAgo(notif.createdAt)}</span>
                    {notif.actor && (
                      <>
                        <span>•</span>
                        <span>
                          From <strong className="font-semibold text-ink">{notif.actor.name}</strong> ({notif.actor.role})
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {notif.link && (
                  <Link
                    href={notif.link}
                    onClick={() => !notif.read && handleMarkRead(notif.id)}
                    className="flex items-center gap-1 rounded-xl bg-ulab/10 px-3 py-1.5 text-xs font-semibold text-ulab-deep transition hover:bg-ulab hover:text-white dark:bg-ulab/20"
                  >
                    View
                    <ExternalLink size={12} />
                  </Link>
                )}
                {!notif.read && (
                  <button
                    onClick={() => handleMarkRead(notif.id)}
                    className="rounded-lg p-2 text-ink-soft transition hover:bg-paper hover:text-ink"
                    title="Mark as read"
                  >
                    <Check size={14} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notif.id)}
                  className="rounded-lg p-2 text-ink-soft transition hover:bg-rose-wash hover:text-rose"
                  title="Delete notification"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notification Preferences Modal */}
      {prefsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-mist bg-surface p-6 shadow-lift">
            <div className="flex items-center justify-between border-b border-mist/70 pb-3">
              <div className="flex items-center gap-2">
                <Settings2 size={18} className="text-ulab-deep" />
                <h3 className="font-display text-base font-bold text-ink">
                  Notification Preferences
                </h3>
              </div>
              <button
                onClick={() => setPrefsModalOpen(false)}
                className="rounded-lg p-1.5 text-ink-soft hover:bg-paper hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 text-xs text-ink-soft">
              Choose which in-app and email alert channels you wish to receive for ULAB Setu activities.
            </p>

            <div className="mt-4 space-y-4 divide-y divide-mist/50">
              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="text-xs font-bold text-ink">Direct Messages</p>
                  <p className="text-[11px] text-ink-soft">
                    Email updates when someone sends you a direct message
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notifyEmailMessages}
                  onChange={(e) =>
                    setPreferences((p) => ({ ...p, notifyEmailMessages: e.target.checked }))
                  }
                  className="size-4 accent-ulab"
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="text-xs font-bold text-ink">Jobs & Applications</p>
                  <p className="text-[11px] text-ink-soft">
                    Alerts for new applicants, shortlist updates, and interview calls
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notifyEmailApplications}
                  onChange={(e) =>
                    setPreferences((p) => ({ ...p, notifyEmailApplications: e.target.checked }))
                  }
                  className="size-4 accent-ulab"
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="text-xs font-bold text-ink">Mentorship Requests</p>
                  <p className="text-[11px] text-ink-soft">
                    Notifications for mentorship invitations, acceptances, and sessions
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notifyEmailMentorship}
                  onChange={(e) =>
                    setPreferences((p) => ({ ...p, notifyEmailMentorship: e.target.checked }))
                  }
                  className="size-4 accent-ulab"
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="text-xs font-bold text-ink">Campus & Announcements</p>
                  <p className="text-[11px] text-ink-soft">
                    Institutional notices, events, and important platform announcements
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notifyEmailSystem}
                  onChange={(e) =>
                    setPreferences((p) => ({ ...p, notifyEmailSystem: e.target.checked }))
                  }
                  className="size-4 accent-ulab"
                />
              </div>
            </div>

            {prefsSavedMessage && (
              <p className="mt-3 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Preferences saved successfully!
              </p>
            )}

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-mist/70 pt-4">
              <Button
                variant="ghost"
                onClick={() => setPrefsModalOpen(false)}
                className="py-1.5 px-3 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePreferences}
                disabled={savingPrefs}
                className="py-1.5 px-3 text-xs font-semibold"
              >
                {savingPrefs ? "Saving..." : "Save Preferences"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
