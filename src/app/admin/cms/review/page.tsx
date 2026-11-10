import { requireCmsCapability } from "@/lib/cms-auth";
import { getCmsReviewQueue } from "@/app/actions/cms";
import { CmsReviewClient } from "@/components/cms/cms-review-client";

export const metadata = {
  title: "Review & Approval Desk — Content Management | ULAB Setu Admin",
};

export default async function CmsReviewPage() {
  const actor = await requireCmsCapability("cms:content:view");
  const queue = await getCmsReviewQueue();

  return (
    <div className="space-y-6">
      <CmsReviewClient initialItems={queue as any} currentRole={actor.cmsRole} />
    </div>
  );
}
