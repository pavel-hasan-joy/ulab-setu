import { requireCmsCapability } from "@/lib/cms-auth";
import { CmsModulePlaceholder } from "@/components/cms/cms-module-placeholder";

export const metadata = {
  title: "Review & Approval — Content Management | ULAB Setu Admin",
};

export default async function CmsReviewPage() {
  await requireCmsCapability("cms:overview:view");

  return (
    <CmsModulePlaceholder
      title="Review & Approval Desk"
      moduleKey="review"
      phaseNumber={4}
      phaseTitle="Editorial Review, Scheduling & Publishing Engine"
      description="Dedicated editorial queue where Content Reviewers evaluate submissions, provide inline feedback, request adjustments, and sign off on content before publication."
      modelsSupported={["CmsReviewFeedback", "CmsContent", "CmsRevision"]}
      capabilitiesPlanned={["cms:content:review", "cms:content:approve"]}
    />
  );
}

