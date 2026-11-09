import { requireCmsCapability } from "@/lib/cms-auth";
import { CmsModulePlaceholder } from "@/components/cms/cms-module-placeholder";

export const metadata = {
  title: "Homepage Manager — Content Management | ULAB Setu Admin",
};

export default async function CmsHomepageManagerPage() {
  await requireCmsCapability("cms:overview:view");

  return (
    <CmsModulePlaceholder
      title="Homepage Section Manager"
      moduleKey="homepage"
      phaseNumber={3}
      phaseTitle="Homepage Architecture & Media Integration"
      description="Visually arrange and edit dynamic homepage sections: animated Three.js 3D hero banners, real-time platform telemetry counters, spotlight carousels, and institutional testimonials."
      modelsSupported={["CmsContent (HOMEPAGE_SECTION)", "CmsMedia", "CmsRevision"]}
      capabilitiesPlanned={["cms:content:create", "cms:content:edit", "cms:content:publish"]}
    />
  );
}
