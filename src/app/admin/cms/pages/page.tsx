import { requireCmsCapability } from "@/lib/cms-auth";
import { CmsModulePlaceholder } from "@/components/cms/cms-module-placeholder";

export const metadata = {
  title: "Pages — Content Management | ULAB Setu Admin",
};

export default async function CmsPagesPage() {
  await requireCmsCapability("cms:overview:view");

  return (
    <CmsModulePlaceholder
      title="Pages & Document Management"
      moduleKey="pages"
      phaseNumber={2}
      phaseTitle="Core Content Modules & Authoring Canvas"
      description="Create, structure, and publish multi-section static pages, departmental profiles, university policies, and accreditation documents."
      modelsSupported={["CmsContent", "CmsRevision", "CmsMedia"]}
      capabilitiesPlanned={["cms:content:create", "cms:content:edit", "cms:content:publish"]}
    />
  );
}
