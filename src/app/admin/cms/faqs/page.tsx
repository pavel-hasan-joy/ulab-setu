import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEffectiveCmsRole } from "@/lib/cms-auth";
import { hasCmsCapability } from "@/lib/cms-permissions";
import { getCmsPhase3Items } from "@/app/actions/cms";
import { CmsFaqsClient } from "@/components/cms/cms-faqs-client";

export const metadata = {
  title: "FAQs Management · CMS · ULAB Setu Admin",
};

export default async function CmsFaqsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const cmsRole = await getEffectiveCmsRole(user.id);
  const canView = hasCmsCapability(cmsRole, "cms:content:view");
  if (!canView) redirect("/admin/cms");

  const faqs = await getCmsPhase3Items({
    contentType: "FAQ",
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <CmsFaqsClient initialItems={faqs as any} userRole={cmsRole || "CONTRIBUTOR"} />
    </div>
  );
}
