import { requireCmsCapability } from "@/lib/cms-auth";
import { getCmsDashboardStats } from "@/app/actions/cms";
import { CmsOverviewClient } from "@/components/cms/cms-overview-client";

export const metadata = {
  title: "CMS Overview — Content Management | ULAB Setu Admin",
};

export default async function CmsOverviewPage() {
  const actor = await requireCmsCapability("cms:overview:view");
  const data = await getCmsDashboardStats();

  return (
    <CmsOverviewClient
      metrics={data.metrics}
      byType={data.byType}
      recentlyUpdated={data.recentlyUpdated}
      pendingApprovalQueue={data.pendingApprovalQueue}
      upcomingScheduled={data.upcomingScheduled}
      recentActivity={data.recentActivity}
      currentActorRole={actor.cmsRole}
    />
  );
}
