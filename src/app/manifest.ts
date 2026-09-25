import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: site.name,
    short_name: "Setu",
    description: site.tagline,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f8fc",
    theme_color: "#1d6fb8",
    categories: ["education", "business", "social"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Long-press the home screen icon. Each area redirects to the signed-in person's own version.
    shortcuts: [
      { name: "Jobs", url: "/student/jobs", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Messages", url: "/student/messages", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Notices", url: "/student/board", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
