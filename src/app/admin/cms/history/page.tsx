import { requireCmsCapability } from "@/lib/cms-auth";
import { db } from "@/lib/db";
import { getCmsArchivedItems } from "@/app/actions/cms";
import { CmsHistoryClient } from "@/components/cms/cms-history-client";

export const metadata = {
  title: "History, Revisions & Archive — Content Management | ULAB Setu Admin",
};

export default async function CmsHistoryPage() {
  const actor = await requireCmsCapability("cms:history:view");

  const [activeItems, archivedItems] = await Promise.all([
    db.cmsContent.findMany({
      where: {
        status: { not: "ARCHIVED" },
        deletedAt: null,
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        author: { select: { id: true, name: true, email: true } },
        lastEditedBy: { select: { id: true, name: true, email: true } },
      },
    }),
    getCmsArchivedItems(),
  ]);

  return (
    <div className="space-y-6">
      <CmsHistoryClient
        activeItems={activeItems as any}
        archivedItems={archivedItems as any}
        currentRole={actor.cmsRole}
      />
    </div>
  );
}
