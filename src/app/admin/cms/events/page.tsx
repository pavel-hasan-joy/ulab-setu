import { requireCmsCapability } from "@/lib/cms-auth";
import { CmsModulePlaceholder } from "@/components/cms/cms-module-placeholder";

export const metadata = {
  title: "Events — Content Management | ULAB Setu Admin",
};

export default async function CmsEventsPage() {
  await requireCmsCapability("cms:overview:view");

  return (
    <CmsModulePlaceholder
      title="Campus Events & Seminars"
      moduleKey="events"
      phaseNumber={2}
      phaseTitle="Core Content Modules & Authoring Canvas"
      description="Publish campus workshops, technology symposiums, industry webinars, and alumni networking nights with venue details, RSVP links, and countdown timers."
      modelsSupported={["CmsContent (EVENT)", "CmsRevision", "CmsMedia"]}
      capabilitiesPlanned={["cms:content:create", "cms:content:edit", "cms:content:publish"]}
    />
  );
}

