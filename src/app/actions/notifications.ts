"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";

export interface UserNotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  link: string | null;
  read: boolean;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    role: string;
    image: string | null;
  } | null;
}

export interface NotificationPreferences {
  notifyEmailMessages: boolean;
  notifyEmailApplications: boolean;
  notifyEmailMentorship: boolean;
  notifyEmailSystem: boolean;
}

/** Fetch current user notifications with unread count and preferences */
export async function getNotifications(limit = 40): Promise<{
  notifications: UserNotificationItem[];
  unreadCount: number;
  preferences: NotificationPreferences;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      notifications: [],
      unreadCount: 0,
      preferences: {
        notifyEmailMessages: true,
        notifyEmailApplications: true,
        notifyEmailMentorship: true,
        notifyEmailSystem: true,
      },
    };
  }

  const [notifications, unreadCount, userData] = await Promise.all([
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            role: true,
            image: true,
          },
        },
      },
    }),
    db.notification.count({
      where: { userId: user.id, read: false },
    }),
    db.user.findUnique({
      where: { id: user.id },
      select: {
        notifyEmailMessages: true,
        notifyEmailApplications: true,
        notifyEmailMentorship: true,
        notifyEmailSystem: true,
      },
    }),
  ]);

  return {
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      link: n.link,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
      actor: n.actor,
    })),
    unreadCount,
    preferences: {
      notifyEmailMessages: userData?.notifyEmailMessages ?? true,
      notifyEmailApplications: userData?.notifyEmailApplications ?? true,
      notifyEmailMentorship: userData?.notifyEmailMentorship ?? true,
      notifyEmailSystem: userData?.notifyEmailSystem ?? true,
    },
  };
}

/** Mark single notification as read */
export async function markNotificationRead(id: string) {
  const user = await requireUser();
  await db.notification.updateMany({
    where: { id, userId: user.id },
    data: { read: true },
  });

  revalidatePath("/student/notifications");
  revalidatePath("/alumni/notifications");
  revalidatePath("/teacher/notifications");
  revalidatePath("/", "layout");
  return { success: true };
}

/** Mark all notifications as read */
export async function markAllNotificationsRead() {
  const user = await requireUser();
  await db.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });

  revalidatePath("/student/notifications");
  revalidatePath("/alumni/notifications");
  revalidatePath("/teacher/notifications");
  revalidatePath("/", "layout");
  return { success: true };
}

/** Delete a notification */
export async function deleteNotification(id: string) {
  const user = await requireUser();
  await db.notification.deleteMany({
    where: { id, userId: user.id },
  });

  revalidatePath("/student/notifications");
  revalidatePath("/alumni/notifications");
  revalidatePath("/teacher/notifications");
  revalidatePath("/", "layout");
  return { success: true };
}

/** Update notification preferences */
export async function updateNotificationPreferences(preferences: Partial<NotificationPreferences>) {
  const user = await requireUser();
  await db.user.update({
    where: { id: user.id },
    data: {
      ...(typeof preferences.notifyEmailMessages === "boolean" && {
        notifyEmailMessages: preferences.notifyEmailMessages,
      }),
      ...(typeof preferences.notifyEmailApplications === "boolean" && {
        notifyEmailApplications: preferences.notifyEmailApplications,
      }),
      ...(typeof preferences.notifyEmailMentorship === "boolean" && {
        notifyEmailMentorship: preferences.notifyEmailMentorship,
      }),
      ...(typeof preferences.notifyEmailSystem === "boolean" && {
        notifyEmailSystem: preferences.notifyEmailSystem,
      }),
    },
  });

  revalidatePath("/student/notifications");
  revalidatePath("/alumni/notifications");
  revalidatePath("/teacher/notifications");
  return { success: true };
}

/** Helper to dispatch in-app notifications and trigger email notifications */
export async function dispatchNotification({
  userId,
  actorId,
  title,
  body,
  type,
  link,
}: {
  userId: string;
  actorId?: string;
  title: string;
  body: string;
  type: "SYSTEM" | "CONNECTION" | "MESSAGE" | "APPLICATION" | "MENTORSHIP" | "TICKET" | "REPORT";
  link?: string;
}) {
  try {
    const target = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        notifyEmailMessages: true,
        notifyEmailApplications: true,
        notifyEmailMentorship: true,
        notifyEmailSystem: true,
      },
    });

    if (!target) return null;

    const notif = await db.notification.create({
      data: {
        userId,
        actorId: actorId || null,
        title,
        body,
        type,
        link: link || null,
      },
    });

    // Check if email dispatch is preferred for this category
    const shouldEmail =
      (type === "MESSAGE" && target.notifyEmailMessages) ||
      (type === "APPLICATION" && target.notifyEmailApplications) ||
      (type === "MENTORSHIP" && target.notifyEmailMentorship) ||
      (type === "SYSTEM" && target.notifyEmailSystem);

    if (shouldEmail && target.email) {
      // In production, integration with Resend / nodemailer / SendGrid
      // For audit & logs:
      console.log(`[Notification Engine] Dispatched email alert to ${target.email}: [${type}] ${title}`);
    }

    return notif;
  } catch (err) {
    console.error("Failed to dispatch notification:", err);
    return null;
  }
}
