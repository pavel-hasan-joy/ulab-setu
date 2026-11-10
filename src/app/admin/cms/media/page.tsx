import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEffectiveCmsRole } from "@/lib/cms-auth";
import { hasCmsCapability } from "@/lib/cms-permissions";
import { getCmsMediaItems } from "@/app/actions/cms";
import { CmsMediaManagerClient } from "@/components/cms/cms-media-manager-client";

export const metadata = {
  title: "Media Library · CMS · ULAB Setu Admin",
};

export default async function CmsMediaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const cmsRole = await getEffectiveCmsRole(user.id);
  const canView = hasCmsCapability(cmsRole, "cms:content:view");
  if (!canView) redirect("/admin/cms");

  const mediaData = await getCmsMediaItems();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <CmsMediaManagerClient
        initialItems={mediaData.items as any}
        totalCount={mediaData.totalCount}
        userRole={cmsRole || "CONTRIBUTOR"}
      />
    </div>
  );
}
