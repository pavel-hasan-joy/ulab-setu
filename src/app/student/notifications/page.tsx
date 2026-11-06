import { requireUser } from "@/lib/auth";
import { getNotifications } from "@/app/actions/notifications";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import { NotificationsClient } from "@/components/notifications-client";

export default async function StudentNotificationsPage() {
  await requireUser("STUDENT");
  const { notifications, unreadCount, preferences } = await getNotifications();

  return (
    <PageIn>
      <PageHeader
        title="Notification Center"
        description="Stay updated with incoming messages, job application status changes, and campus announcements."
      />
      <div className="mt-6">
        <NotificationsClient
          initialNotifications={notifications}
          initialUnreadCount={unreadCount}
          initialPreferences={preferences}
          baseRole="student"
        />
      </div>
    </PageIn>
  );
}

