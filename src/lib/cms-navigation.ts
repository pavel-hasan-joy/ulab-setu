import { z } from "zod";

export const NAVIGATION_CMS_SLUG = "system-navigation-config";

/**
 * Validates URLs ensuring strict immunity against javascript: or unsafe protocol injections.
 */
export function isSafeNavigationUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();

  // Block dangerous schemes
  if (
    trimmed.toLowerCase().startsWith("javascript:") ||
    trimmed.toLowerCase().startsWith("data:") ||
    trimmed.toLowerCase().startsWith("vbscript:")
  ) {
    return false;
  }

  // Allow relative internal paths
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) {
    return true;
  }

  // Allow approved standard external protocols
  try {
    const parsed = new URL(trimmed);
    return ["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export const navigationLinkSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1, "Label is required.").max(50, "Label too long."),
  href: z.string().trim().refine(isSafeNavigationUrl, {
    message: "Invalid or unsafe URL scheme.",
  }),
  openInNewTab: z.boolean().default(false),
  enabled: z.boolean().default(true),
  order: z.number().int().default(0),
});

export const footerColumnSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1, "Column title is required.").max(60),
  links: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().trim().min(1).max(50),
      href: z.string().trim().refine(isSafeNavigationUrl, { message: "Invalid URL scheme." }),
      openInNewTab: z.boolean().default(false),
    })
  ),
});

export const contactInfoSchema = z.object({
  universityName: z.string().trim().default("University of Liberal Arts Bangladesh"),
  address: z.string().trim().default("Beribadh Road, Mohammadpur, Dhaka - 1207, Bangladesh"),
  email: z.string().trim().email().default("setu@ulab.edu.bd"),
  phone: z.string().trim().default("+880 2 223328001"),
  helpdeskHours: z.string().trim().default("Sunday - Thursday: 9:00 AM - 5:00 PM"),
});

export const socialLinksSchema = z.object({
  facebook: z.string().trim().url().optional().or(z.literal("")),
  linkedin: z.string().trim().url().optional().or(z.literal("")),
  twitter: z.string().trim().url().optional().or(z.literal("")),
  youtube: z.string().trim().url().optional().or(z.literal("")),
});

export const siteNavigationSchema = z.object({
  headerLinks: z.array(navigationLinkSchema),
  footerColumns: z.array(footerColumnSchema),
  contactInfo: contactInfoSchema,
  socialLinks: socialLinksSchema,
});

export type NavigationLink = z.infer<typeof navigationLinkSchema>;
export type FooterColumn = z.infer<typeof footerColumnSchema>;
export type ContactInfo = z.infer<typeof contactInfoSchema>;
export type SocialLinks = z.infer<typeof socialLinksSchema>;
export type SiteNavigationConfig = z.infer<typeof siteNavigationSchema>;

export const DEFAULT_NAVIGATION_CONFIG: SiteNavigationConfig = {
  headerLinks: [
    { id: "nav-jobs", label: "Jobs", href: "/#jobs", openInNewTab: false, enabled: true, order: 0 },
    { id: "nav-how", label: "How it works", href: "/#how", openInNewTab: false, enabled: true, order: 1 },
    { id: "nav-alumni-map", label: "Global Map", href: "/#global-map", openInNewTab: false, enabled: true, order: 2 },
    { id: "nav-news", label: "Announcements", href: "/news", openInNewTab: false, enabled: true, order: 3 },
    { id: "nav-events", label: "Events", href: "/events", openInNewTab: false, enabled: true, order: 4 },
    { id: "nav-faqs", label: "FAQs", href: "/faqs", openInNewTab: false, enabled: true, order: 5 },
    { id: "nav-resources", label: "Resources", href: "/resources", openInNewTab: false, enabled: true, order: 6 },
  ],
  footerColumns: [
    {
      id: "col-about",
      title: "About ULAB Setu",
      links: [
        { id: "l-1", label: "About Us", href: "/p/about-ulab-setu", openInNewTab: false },
        { id: "l-2", label: "How Setu Works", href: "/p/how-it-works", openInNewTab: false },
        { id: "l-map", label: "Global Alumni Map", href: "/#global-map", openInNewTab: false },
        { id: "l-3", label: "Alumni Stories", href: "/stories", openInNewTab: false },
      ],
    },
    {
      id: "col-opportunities",
      title: "Opportunities",
      links: [
        { id: "l-4", label: "Browse Jobs", href: "/#jobs", openInNewTab: false },
        { id: "l-5", label: "Career Resources", href: "/resources", openInNewTab: false },
        { id: "l-6", label: "Campus Events", href: "/events", openInNewTab: false },
      ],
    },
    {
      id: "col-support",
      title: "Help & Support",
      links: [
        { id: "l-7", label: "Help Center & FAQs", href: "/faqs", openInNewTab: false },
        { id: "l-8", label: "Contact Admin", href: "/p/contact-information", openInNewTab: false },
      ],
    },
    {
      id: "col-legal",
      title: "Legal & Policies",
      links: [
        { id: "l-9", label: "Privacy Policy", href: "/p/privacy-policy", openInNewTab: false },
        { id: "l-10", label: "Terms of Service", href: "/p/terms-and-conditions", openInNewTab: false },
      ],
    },
  ],
  contactInfo: {
    universityName: "University of Liberal Arts Bangladesh",
    address: "Beribadh Road, Mohammadpur, Dhaka - 1207, Bangladesh",
    email: "setu@ulab.edu.bd",
    phone: "+880 2 223328001",
    helpdeskHours: "Sunday - Thursday: 9:00 AM - 5:00 PM (Asia/Dhaka)",
  },
  socialLinks: {
    facebook: "https://facebook.com/ULABian",
    linkedin: "https://linkedin.com/school/university-of-liberal-arts-bangladesh",
    twitter: "",
    youtube: "https://youtube.com/@ULABian",
  },
};

