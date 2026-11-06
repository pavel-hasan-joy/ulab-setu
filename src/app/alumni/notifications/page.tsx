import { requireUser } from "@/lib/auth";
import { getNotifications } from "@/app/actions/notifications";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import { NotificationsClient } from "@/components/notifications-client";

export default async function AlumniNotificationsPage() {
  await requireUser("ALUMNI");
  const { notifications, unreadCount, preferences } = await getNotifications();

  return (
    <PageIn>
      <PageHeader
        title="Notification Center"
        description="Track incoming messages from students, new applicant submissions for your job postings, and alumni alerts."
      />
      <div className="mt-6">
        <NotificationsClient
          initialNotifications={notifications}
          initialUnreadCount={unreadCount}
          initialPreferences={preferences}
          baseRole="alumni"
        />
      </div>
    </PageIn>
  );
}

