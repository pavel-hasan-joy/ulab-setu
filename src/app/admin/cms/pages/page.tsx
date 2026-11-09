import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEffectiveCmsRole } from "@/lib/cms-auth";
import { hasCmsCapability } from "@/lib/cms-permissions";
import { getCmsPagesList } from "@/app/actions/cms";
import { PagesManagerClient } from "@/components/cms/pages-manager-client";

export const metadata = {
  title: "Pages Management · CMS · ULAB Setu Admin",
};

export default async function CmsPagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const cmsRole = await getEffectiveCmsRole(user.id);
  const canView = hasCmsCapability(cmsRole, "cms:content:view");
  if (!canView) redirect("/admin/cms");

  const pages = await getCmsPagesList();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <PagesManagerClient initialPages={pages as any} userRole={cmsRole || "CONTRIBUTOR"} />
    </div>
  );
}
