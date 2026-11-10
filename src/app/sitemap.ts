import { MetadataRoute } from "next";
import { db } from "@/lib/db";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ulab-setu.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/news`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/events`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/faqs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/resources`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/stories`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  try {
    // Only published, non-deleted CMS items are indexed
    const publishedItems = await db.cmsContent.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
      },
      select: {
        slug: true,
        contentType: true,
        updatedAt: true,
        publishedAt: true,
      },
      take: 200,
    });

    for (const item of publishedItems) {
      const lastModified = item.updatedAt || item.publishedAt || new Date();

      if (item.contentType === "PAGE") {
        routes.push({
          url: `${BASE_URL}/p/${item.slug}`,
          lastModified,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      } else if (item.contentType === "NEWS" || item.contentType === "ANNOUNCEMENT") {
        routes.push({
          url: `${BASE_URL}/news/${item.slug}`,
          lastModified,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      } else if (item.contentType === "EVENT") {
        routes.push({
          url: `${BASE_URL}/events/${item.slug}`,
          lastModified,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
  } catch {
    // Return base routes if database is unreachable during sitemap build
  }

  return routes;
}

