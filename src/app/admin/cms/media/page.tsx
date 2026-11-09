import { requireCmsCapability } from "@/lib/cms-auth";
import { CmsModulePlaceholder } from "@/components/cms/cms-module-placeholder";

export const metadata = {
  title: "Media Library — Content Management | ULAB Setu Admin",
};

export default async function CmsMediaPage() {
  await requireCmsCapability("cms:overview:view");

  return (
    <CmsModulePlaceholder
      title="Central Media & Asset Library"
      moduleKey="media"
      phaseNumber={3}
      phaseTitle="Homepage Architecture & Media Integration"
      description="Central asset manager supporting high-resolution image uploads, vector logos, PDF brochures, document attachments, alt text accessibility tags, and CDN delivery."
      modelsSupported={["CmsMedia", "CmsContent"]}
      capabilitiesPlanned={["cms:content:create", "cms:content:edit", "cms:content:publish"]}
    />
  );
}
