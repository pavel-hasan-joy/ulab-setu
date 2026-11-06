import { requireAdminPermission } from "@/lib/admin-auth";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import { AdminMentorshipManager } from "@/components/admin-mentorship-manager";
import { adminGetMentorshipDashboardData } from "@/app/actions/mentorship";

export const dynamic = "force-dynamic";

export default async function AdminMentorshipPage() {
  await requireAdminPermission("mentorship:view");

  const data = await adminGetMentorshipDashboardData();

  return (
    <PageIn>
      <PageHeader
        title="Career Mentorship CRM & Administration"
        description="Comprehensive governance for Student-Alumni & Faculty career advisories, active capacity, ratings, reports, audit trail, and real database analytics."
      />
      <div className="mt-6">
        <AdminMentorshipManager data={data} />
      </div>
    </PageIn>
  );
}
