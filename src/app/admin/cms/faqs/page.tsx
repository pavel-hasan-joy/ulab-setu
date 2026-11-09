import { requireCmsCapability } from "@/lib/cms-auth";
import { CmsModulePlaceholder } from "@/components/cms/cms-module-placeholder";

export const metadata = {
  title: "FAQs — Content Management | ULAB Setu Admin",
};

export default async function CmsFaqsPage() {
  await requireCmsCapability("cms:overview:view");

  return (
    <CmsModulePlaceholder
      title="Frequently Asked Questions (FAQs)"
      moduleKey="faqs"
      phaseNumber={2}
      phaseTitle="Core Content Modules & Authoring Canvas"
      description="Organize answers to frequent questions for students, alumni, and faculty categorized by admissions, career guidance, mentorship, and campus facilities."
      modelsSupported={["CmsContent (FAQ)", "CmsRevision"]}
      capabilitiesPlanned={["cms:content:create", "cms:content:edit", "cms:content:publish"]}
    />
  );
}

