import { requireCmsCapability } from "@/lib/cms-auth";
import { getSiteNavigationConfig } from "@/app/actions/cms";
import { CmsNavigationClient } from "@/components/cms/cms-navigation-client";

export const metadata = {
  title: "Navigation & Footer Manager — Content Management | ULAB Setu Admin",
};

export default async function CmsNavigationPage() {
  const actor = await requireCmsCapability("cms:content:view");
  const config = await getSiteNavigationConfig();

  return (
    <div className="space-y-6">
      <CmsNavigationClient initialConfig={config} currentRole={actor.cmsRole} />
    </div>
  );
}

