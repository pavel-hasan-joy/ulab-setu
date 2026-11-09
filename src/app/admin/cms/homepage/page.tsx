import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEffectiveCmsRole } from "@/lib/cms-auth";
import { hasCmsCapability } from "@/lib/cms-permissions";
import { getHomepageManagerData } from "@/app/actions/cms";
import { HomepageManagerClient } from "@/components/cms/homepage-manager-client";

export const metadata = {
  title: "Homepage Content Manager · CMS · ULAB Setu Admin",
};

export default async function CmsHomepageManagerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const cmsRole = await getEffectiveCmsRole(user.id);
  const canView = hasCmsCapability(cmsRole, "cms:content:view");
  if (!canView) redirect("/admin/cms");

  const data = await getHomepageManagerData();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <HomepageManagerClient
        initialContent={data.content}
        status={data.status}
        lastUpdated={data.lastUpdated}
        lastEditorName={data.lastEditorName}
      />
    </div>
  );
}
