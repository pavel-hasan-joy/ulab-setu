import { requireCmsCapability } from "@/lib/cms-auth";
import { CmsModulePlaceholder } from "@/components/cms/cms-module-placeholder";

export const metadata = {
  title: "Alumni Stories — Content Management | ULAB Setu Admin",
};

export default async function CmsStoriesPage() {
  await requireCmsCapability("cms:overview:view");

  return (
    <CmsModulePlaceholder
      title="Alumni Success Stories & Spotlights"
      moduleKey="stories"
      phaseNumber={2}
      phaseTitle="Core Content Modules & Authoring Canvas"
      description="Feature inspiring professional journeys of ULAB alumni in multinationals, startups, and academia to motivate current students and showcase university impact."
      modelsSupported={["CmsContent (ALUMNI_STORY)", "CmsMedia", "CmsRevision"]}
      capabilitiesPlanned={["cms:content:create", "cms:content:edit", "cms:content:publish"]}
    />
  );
}
