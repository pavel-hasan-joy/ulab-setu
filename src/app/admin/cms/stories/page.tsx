import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEffectiveCmsRole } from "@/lib/cms-auth";
import { hasCmsCapability } from "@/lib/cms-permissions";
import { getCmsPhase3Items } from "@/app/actions/cms";
import { CmsStoriesClient } from "@/components/cms/cms-stories-client";

export const metadata = {
  title: "Alumni Stories · CMS · ULAB Setu Admin",
};

export default async function CmsStoriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const cmsRole = await getEffectiveCmsRole(user.id);
  const canView = hasCmsCapability(cmsRole, "cms:content:view");
  if (!canView) redirect("/admin/cms");

  const stories = await getCmsPhase3Items({
    contentType: "ALUMNI_STORY",
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <CmsStoriesClient initialItems={stories as any} userRole={cmsRole || "CONTRIBUTOR"} />
    </div>
  );
}
