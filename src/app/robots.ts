import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ulab-setu.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/news", "/news/*", "/events", "/events/*", "/faqs", "/resources", "/stories", "/p/*"],
        disallow: [
          "/admin",
          "/admin/*",
          "/api",
          "/api/*",
          "/student",
          "/student/*",
          "/alumni",
          "/alumni/*",
          "/teacher",
          "/teacher/*",
          "/login",
          "/signup",
          "/forgot-password",
        ],
      },
      // Strictly disallow aggressive scrapers and AI bots
      {
        userAgent: ["GPTBot", "CCBot", "ClaudeBot", "anthropic-ai", "Bytespider", "PerplexityBot", "PetalBot"],
        disallow: ["/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}

