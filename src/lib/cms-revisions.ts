import { db } from "@/lib/db";
import { type CmsContent } from "@prisma/client";

const MAX_REVISION_RETENTION = 30;

/**
 * Creates an immutable version snapshot of a CMS content item.
 * Enforces bounded retention (pruning oldest revisions beyond MAX_REVISION_RETENTION).
 */
export async function recordContentRevision(params: {
  content: Pick<CmsContent, "id" | "title" | "slug" | "summary" | "body" | "structuredData" | "status">;
  actorId: string;
  changeSummary?: string;
}) {
  const { content, actorId, changeSummary } = params;

  // 1. Determine next version number
  const latestRevision = await db.cmsRevision.findFirst({
    where: { contentId: content.id },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  const nextVersion = (latestRevision?.version ?? 0) + 1;

  // 2. Insert new revision record
  const revision = await db.cmsRevision.create({
    data: {
      contentId: content.id,
      version: nextVersion,
      title: content.title,
      slug: content.slug,
      summary: content.summary,
      body: content.body,
      structuredData: content.structuredData,
      statusAtRevision: content.status,
      changeSummary: changeSummary || `Revision v${nextVersion}`,
      createdById: actorId,
    },
  });

  // 3. Retention policy: Keep the most recent 30 revisions per content item
  const count = await db.cmsRevision.count({ where: { contentId: content.id } });
  if (count > MAX_REVISION_RETENTION) {
    const staleRevisions = await db.cmsRevision.findMany({
      where: { contentId: content.id },
      orderBy: { version: "asc" },
      take: count - MAX_REVISION_RETENTION,
      select: { id: true },
    });
    if (staleRevisions.length > 0) {
      await db.cmsRevision.deleteMany({
        where: { id: { in: staleRevisions.map((r) => r.id) } },
      });
    }
  }

  return revision;
}

