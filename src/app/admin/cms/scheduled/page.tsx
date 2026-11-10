import { requireCmsCapability } from "@/lib/cms-auth";
import { getCmsScheduledItems } from "@/app/actions/cms";
import { CmsScheduledClient } from "@/components/cms/cms-scheduled-client";

export const metadata = {
  title: "Scheduled Content Calendar — Content Management | ULAB Setu Admin",
};

export default async function CmsScheduledPage() {
  const actor = await requireCmsCapability("cms:content:view");
  const items = await getCmsScheduledItems();

  return (
    <div className="space-y-6">
      <CmsScheduledClient initialItems={items as any} currentRole={actor.cmsRole} />
    </div>
  );
}
