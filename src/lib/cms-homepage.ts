import { z } from "zod";
import { db } from "@/lib/db";
import { site } from "@/lib/site";

export const homepageContentSchema = z.object({
  // Hero section
  heroBadge: z.string().min(1).max(100),
  heroHeadline: z.string().min(3).max(200),
  heroSubtitle: z.string().min(10).max(500),
  heroStudentCtaText: z.string().min(1).max(50),
  heroStudentCtaLink: z.string().min(1).max(200),
  heroAlumniCtaText: z.string().min(1).max(50),
  heroAlumniCtaLink: z.string().min(1).max(200),
  heroTeacherCtaText: z.string().min(1).max(50),
  heroTeacherCtaLink: z.string().min(1).max(200),

  // Floating Hero Cards
  floatCard1Title: z.string().min(1).max(100),
  floatCard1Body: z.string().min(1).max(150),
  floatCard2Title: z.string().min(1).max(100),
  floatCard2Body: z.string().min(1).max(150),

  // Emotional Quote Section
  quoteText: z.string().min(10).max(600),

  // How it works section
  howTitle: z.string().min(3).max(150),
  howSubtitle: z.string().min(10).max(500),
  step1Title: z.string().min(1).max(100),
  step1Body: z.string().min(5).max(300),
  step2Title: z.string().min(1).max(100),
  step2Body: z.string().min(5).max(300),
  step3Title: z.string().min(1).max(100),
  step3Body: z.string().min(5).max(300),

  // Jobs section teaser
  jobsTitle: z.string().min(3).max(150),
  jobsSubtitle: z.string().min(10).max(300),

  // Bottom CTA
  ctaTitle: z.string().min(3).max(200),
  ctaSubtitle: z.string().min(10).max(400),
  ctaPrimaryText: z.string().min(1).max(50),
  ctaPrimaryLink: z.string().min(1).max(200),
  ctaSecondaryText: z.string().min(1).max(50),
  ctaSecondaryLink: z.string().min(1).max(200),

  // Footer
  footerTagline: z.string().min(5).max(300),
});

export type HomepageContent = z.infer<typeof homepageContentSchema>;

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  heroBadge: `${site.universityShort} · ${site.universityTagline}`,
  heroHeadline: "Your seniors already know the way in.",
  heroSubtitle: `Ask ${site.universityShort} alumni and teachers about their work, apply to jobs they post, and browse fresh openings from across Bangladesh in one place.`,
  heroStudentCtaText: "I'm a current student",
  heroStudentCtaLink: "/signup?role=student",
  heroAlumniCtaText: "I'm an alumnus",
  heroAlumniCtaLink: "/signup?role=alumni",
  heroTeacherCtaText: "I'm a teacher",
  heroTeacherCtaLink: "/signup?role=teacher",

  floatCard1Title: "Tanvir, class of 2018",
  floatCard1Body: "Posted a job with referral",
  floatCard2Title: "Farhana, CSE",
  floatCard2Body: "Applied to Frontend Intern",

  quoteText: `Every ${site.universityShort} graduate once sat where you sit now, wondering how to get that first job. They remember. Most of them are happy to tell you how they did it.`,

  howTitle: "From first message to first offer",
  howSubtitle: `All students, alumni, and faculty connect through verified @${site.studentEmailDomain} accounts, so every member you see here really walked the same campus.`,
  step1Title: "Join with your role",
  step1Body: `Students, alumni, and faculty sign up and connect using their official @${site.studentEmailDomain} email.`,
  step2Title: "Reach out to a senior",
  step2Body: "Find alumni by department, company or batch, and message anyone directly.",
  step3Title: "Apply with a referral",
  step3Body: "Apply to jobs alumni post here. Many come with an offer to refer you internally.",

  jobsTitle: "Posted by alumni this week",
  jobsSubtitle: "Plus live openings from Bdjobs and other Bangladeshi job sites once you sign in.",

  ctaTitle: `Graduated from ${site.universityShort}? Someone here is where you were.`,
  ctaSubtitle: "Post an opening at your company or answer one question a month. It adds up.",
  ctaPrimaryText: "Join as alumni",
  ctaPrimaryLink: "/signup?role=alumni",
  ctaSecondaryText: "Find your mentor",
  ctaSecondaryLink: "/student/mentors",

  footerTagline: `A community project for ${site.university} — ${site.universityTagline}.`,
};

export const HOMEPAGE_CMS_SLUG = "homepage-main";

/**
 * Loads published homepage content from the database.
 * Falls back safely to DEFAULT_HOMEPAGE_CONTENT if none exists or if JSON parsing fails.
 */
export async function getHomepageContent(): Promise<HomepageContent> {
  try {
    const record = await db.cmsContent.findUnique({
      where: { slug: HOMEPAGE_CMS_SLUG },
      select: { status: true, structuredData: true, deletedAt: true },
    });

    if (!record || record.deletedAt || record.status !== "PUBLISHED" || !record.structuredData) {
      return DEFAULT_HOMEPAGE_CONTENT;
    }

    const parsedJson = JSON.parse(record.structuredData);
    const parsed = homepageContentSchema.safeParse(parsedJson);
    if (!parsed.success) {
      console.warn("Homepage CMS structuredData failed validation, using defaults:", parsed.error.issues);
      return DEFAULT_HOMEPAGE_CONTENT;
    }

    return parsed.data;
  } catch (err) {
    console.error("Error loading homepage content from CMS DB:", err);
    return DEFAULT_HOMEPAGE_CONTENT;
  }
}

