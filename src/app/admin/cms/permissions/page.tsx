import { requireCmsCapability } from "@/lib/cms-auth";
import { getCmsUserRolesList } from "@/app/actions/cms";
import { CmsPermissionsClient } from "@/components/cms/cms-permissions-client";

export const metadata = {
  title: "CMS Permissions & Roles | ULAB Setu Admin",
};

export default async function CmsPermissionsPage() {
  const actor = await requireCmsCapability("cms:permissions:manage");
  const assignments = await getCmsUserRolesList();

  return (
    <CmsPermissionsClient
      assignments={assignments}
      currentActorId={actor.id}
      isSuperAdmin={actor.cmsRole === "CMS_ADMIN"}
    />
  );
}
