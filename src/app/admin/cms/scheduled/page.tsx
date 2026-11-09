import { requireCmsCapability } from "@/lib/cms-auth";
import { CmsModulePlaceholder } from "@/components/cms/cms-module-placeholder";

export const metadata = {
  title: "Scheduled Content — Content Management | ULAB Setu Admin",
};

export default async function CmsScheduledPage() {
  await requireCmsCapability("cms:overview:view");

  return (
    <CmsModulePlaceholder
      title="Scheduled Content Calendar"
      moduleKey="scheduled"
      phaseNumber={4}
      phaseTitle="Editorial Review, Scheduling & Publishing Engine"
      description="Timeline calendar managing upcoming automated publication releases, timed announcements, event registration windows, and embargo expiration."
      modelsSupported={["CmsContent (SCHEDULED)", "CmsRevision"]}
      capabilitiesPlanned={["cms:content:schedule", "cms:content:publish", "cms:content:unpublish"]}
    />
  );
}

