import { requireUser } from "@/lib/auth";
import { getNotifications } from "@/app/actions/notifications";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import { NotificationsClient } from "@/components/notifications-client";

export default async function TeacherNotificationsPage() {
  await requireUser("TEACHER");
  const { notifications, unreadCount, preferences } = await getNotifications();

  return (
    <PageIn>
      <PageHeader
        title="Notification Center"
        description="Review campus announcements, research collaboration requests, and student inquiries."
      />
      <div className="mt-6">
        <NotificationsClient
          initialNotifications={notifications}
          initialUnreadCount={unreadCount}
          initialPreferences={preferences}
          baseRole="teacher"
        />
      </div>
    </PageIn>
  );
}

