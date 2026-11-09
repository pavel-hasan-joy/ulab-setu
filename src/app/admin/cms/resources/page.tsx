import { requireCmsCapability } from "@/lib/cms-auth";
import { CmsModulePlaceholder } from "@/components/cms/cms-module-placeholder";

export const metadata = {
  title: "Resource Library — Content Management | ULAB Setu Admin",
};

export default async function CmsResourcesPage() {
  await requireCmsCapability("cms:overview:view");

  return (
    <CmsModulePlaceholder
      title="Resource & Document Library"
      moduleKey="resources"
      phaseNumber={2}
      phaseTitle="Core Content Modules & Authoring Canvas"
      description="Host and distribute academic toolkits, course materials, career preparation guides, and institutional forms with access restrictions and download telemetry."
      modelsSupported={["CmsContent (RESOURCE)", "CmsMedia", "CmsRevision"]}
      capabilitiesPlanned={["cms:content:create", "cms:content:edit", "cms:content:publish"]}
    />
  );
}

