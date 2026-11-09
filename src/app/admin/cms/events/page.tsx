import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEffectiveCmsRole } from "@/lib/cms-auth";
import { hasCmsCapability } from "@/lib/cms-permissions";
import { getCmsPhase3Items } from "@/app/actions/cms";
import { CmsEventsClient } from "@/components/cms/cms-events-client";

export const metadata = {
  title: "Events Management · CMS · ULAB Setu Admin",
};

export default async function CmsEventsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const cmsRole = await getEffectiveCmsRole(user.id);
  const canView = hasCmsCapability(cmsRole, "cms:content:view");
  if (!canView) redirect("/admin/cms");

  const events = await getCmsPhase3Items({
    contentType: "EVENT",
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <CmsEventsClient initialItems={events as any} userRole={cmsRole || "CONTRIBUTOR"} />
    </div>
  );
}
