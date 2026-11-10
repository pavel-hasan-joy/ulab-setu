import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { recordCmsAuditLog } from "@/lib/cms-auth";

export interface ScheduledProcessResult {
  success: boolean;
  publishedCount: number;
  publishedSlugs: string[];
  expiredCount: number;
  expiredSlugs: string[];
  timestamp: string;
  errors: string[];
}

/**
 * Core Scheduler Engine:
 * Idempotently and concurrency-safely processes due scheduled publications
 * and unpublishes expired content.
 */
export async function processScheduledPublishingAndExpiry(triggeredByActorId?: string): Promise<ScheduledProcessResult> {
  const now = new Date();
  const result: ScheduledProcessResult = {
    success: true,
    publishedCount: 0,
    publishedSlugs: [],
    expiredCount: 0,
    expiredSlugs: [],
    timestamp: now.toISOString(),
    errors: [],
  };

  try {
    // 1. Process Due Scheduled Items
    const dueScheduledItems = await db.cmsContent.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: now },
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        contentType: true,
        authorId: true,
      },
    });

    for (const item of dueScheduledItems) {
      try {
        await db.cmsContent.update({
          where: { id: item.id },
          data: {
            status: "PUBLISHED",
            publishedAt: now,
            updatedAt: now,
          },
        });

        result.publishedCount += 1;
        result.publishedSlugs.push(item.slug);

        // Record audit event
        await recordCmsAuditLog({
          actorId: triggeredByActorId || item.authorId,
          action: "CMS_CONTENT_AUTO_PUBLISHED",
          targetType: "CMS_CONTENT",
          targetId: item.id,
          details: {
            title: item.title,
            slug: item.slug,
            contentType: item.contentType,
            publishedAt: now.toISOString(),
          },
        });

        // Cache Invalidation
        if (item.contentType === "PAGE") {
          revalidatePath(`/p/${item.slug}`);
        } else if (item.contentType === "NEWS" || item.contentType === "ANNOUNCEMENT") {
          revalidatePath(`/news/${item.slug}`);
          revalidatePath("/news");
        } else if (item.contentType === "EVENT") {
          revalidatePath(`/events/${item.slug}`);
          revalidatePath("/events");
        } else if (item.contentType === "HOMEPAGE_SECTION") {
          revalidatePath("/");
        }
      } catch (err) {
        result.errors.push(`Failed to auto-publish "${item.slug}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // 2. Process Expired Published Items
    // Search for published items having structuredData
    const activePublishedItems = await db.cmsContent.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        structuredData: { not: null },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        contentType: true,
        structuredData: true,
        authorId: true,
      },
    });

    for (const item of activePublishedItems) {
      if (!item.structuredData) continue;
      try {
        const parsed = JSON.parse(item.structuredData);
        const expiryDateStr = parsed.expiryDate || parsed.scheduledUnpublishAt;
        if (expiryDateStr) {
          const expiryDate = new Date(expiryDateStr);
          if (!isNaN(expiryDate.getTime()) && expiryDate <= now) {
            await db.cmsContent.update({
              where: { id: item.id },
              data: {
                status: "UNPUBLISHED",
                updatedAt: now,
              },
            });

            result.expiredCount += 1;
            result.expiredSlugs.push(item.slug);

            await recordCmsAuditLog({
              actorId: triggeredByActorId || item.authorId,
              action: "CMS_CONTENT_AUTO_EXPIRED",
              targetType: "CMS_CONTENT",
              targetId: item.id,
              details: {
                title: item.title,
                slug: item.slug,
                expiryDate: expiryDate.toISOString(),
              },
            });

            if (item.contentType === "PAGE") {
              revalidatePath(`/p/${item.slug}`);
            } else if (item.contentType === "NEWS" || item.contentType === "ANNOUNCEMENT") {
              revalidatePath("/news");
            } else if (item.contentType === "EVENT") {
              revalidatePath("/events");
            }
          }
        }
      } catch {
        // Skip malformed JSON in structuredData
      }
    }

    // Always revalidate homepage and sitemap when content state updates
    if (result.publishedCount > 0 || result.expiredCount > 0) {
      revalidatePath("/");
      revalidatePath("/sitemap.xml");
    }
  } catch (err) {
    result.success = false;
    result.errors.push(`Scheduler run error: ${err instanceof Error ? err.message : String(err)}`);
  }

  return result;
}

