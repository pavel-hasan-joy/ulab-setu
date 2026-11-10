import { db } from "@/lib/db";

export interface MediaUsageRecord {
  contentId: string;
  title: string;
  slug: string;
  contentType: string;
  fieldUsedIn: string; // e.g. "featuredImage" | "structuredData" | "body"
}

/**
 * Searches across all CMS content models and structured blocks to find
 * where a specific media URL or ID is currently referenced.
 */
export async function getMediaUsages(mediaUrl: string, mediaId: string): Promise<MediaUsageRecord[]> {
  const usages: MediaUsageRecord[] = [];

  // 1. Direct relational attachment in CmsMedia model
  const mediaRecord = await db.cmsMedia.findUnique({
    where: { id: mediaId },
    include: {
      content: { select: { id: true, title: true, slug: true, contentType: true } },
    },
  });

  if (mediaRecord?.content) {
    usages.push({
      contentId: mediaRecord.content.id,
      title: mediaRecord.content.title,
      slug: mediaRecord.content.slug,
      contentType: mediaRecord.content.contentType,
      fieldUsedIn: "relationalAttachment",
    });
  }

  // 2. Search CmsContent records where mediaUrl appears in featuredImage, body, or structuredData
  const matchingContents = await db.cmsContent.findMany({
    where: {
      deletedAt: null,
      OR: [
        { featuredImage: { contains: mediaUrl } },
        { body: { contains: mediaUrl } },
        { structuredData: { contains: mediaUrl } },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      contentType: true,
      featuredImage: true,
      body: true,
      structuredData: true,
    },
  });

  for (const item of matchingContents) {
    // Avoid duplicate entry if already found by relational link
    if (usages.some((u) => u.contentId === item.id)) continue;

    let field = "body";
    if (item.featuredImage?.includes(mediaUrl)) field = "featuredImage";
    else if (item.structuredData?.includes(mediaUrl)) field = "structuredData";

    usages.push({
      contentId: item.id,
      title: item.title,
      slug: item.slug,
      contentType: item.contentType,
      fieldUsedIn: field,
    });
  }

  return usages;
}

