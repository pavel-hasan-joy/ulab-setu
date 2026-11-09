import { requireCmsCapability } from "@/lib/cms-auth";
import { CmsModulePlaceholder } from "@/components/cms/cms-module-placeholder";

export const metadata = {
  title: "News & Announcements — Content Management | ULAB Setu Admin",
};

export default async function CmsNewsPage() {
  await requireCmsCapability("cms:overview:view");

  return (
    <CmsModulePlaceholder
      title="News & Announcements"
      moduleKey="news"
      phaseNumber={2}
      phaseTitle="Core Content Modules & Authoring Canvas"
      description="Manage official university news releases, departmental circulars, emergency advisories, and campus bulletins with priority pinning and target audience filters."
      modelsSupported={["CmsContent (NEWS, ANNOUNCEMENT)", "CmsRevision", "CmsMedia"]}
      capabilitiesPlanned={["cms:content:create", "cms:content:edit", "cms:content:publish"]}
    />
  );
}

