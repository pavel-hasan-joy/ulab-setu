import { PrismaClient } from "@prisma/client";
import { DEFAULT_HOMEPAGE_CONTENT, HOMEPAGE_CMS_SLUG } from "../src/lib/cms-homepage.ts";
import type { CmsBlock } from "../src/lib/cms-blocks.ts";

const prisma = new PrismaClient();

const SEED_PAGES: Array<{
  title: string;
  slug: string;
  summary: string;
  metaTitle: string;
  metaDescription: string;
  blocks: CmsBlock[];
}> = [
  {
    title: "About ULAB Setu",
    slug: "about",
    summary: "The official alumni and student bridge of University of Liberal Arts Bangladesh.",
    metaTitle: "About ULAB Setu · University of Liberal Arts Bangladesh",
    metaDescription: "Discover how ULAB Setu connects students, alumni, and faculty for mentorship, verified referrals, and career growth.",
    blocks: [
      {
        id: "about-h1",
        type: "heading",
        level: "h1",
        text: "Bridging ULABians Across Generations",
        subtitle: "Connecting students, distinguished alumni, and faculty under one verified roof.",
        alignment: "center",
      },
      {
        id: "about-rt1",
        type: "richText",
        body: `ULAB Setu was created with a clear purpose: to ensure no student from the University of Liberal Arts Bangladesh ever has to navigate their career search in isolation.\n\nEvery graduate who walked the Beribadh or Dhanmondi campuses remembers the questions, uncertainties, and challenges of landing that critical first internship or entry-level job. ULAB Setu converts that shared memory into a powerful, permanent support network.\n\nThrough official institutional domain verification, Setu creates a safe, respectful environment where students can discover alumni working across Bangladesh's premier technology companies, financial institutions, media houses, and international organizations.`,
        isLead: true,
      },
      {
        id: "about-fc1",
        type: "featureCards",
        title: "Key Advantages",
        subtitle: "Why ULABians rely on Setu",
        cards: [
          {
            icon: "ShieldCheck",
            title: "Verified Community",
            description: "100% verified campus emails ensure trust, professional etiquette, and genuine alumni relationships.",
            badge: "Secure",
          },
          {
            icon: "Briefcase",
            title: "Direct Job Referrals",
            description: "Alumni post direct internal openings and fast-track student resumes through HR pipelines.",
            badge: "Referral",
          },
          {
            icon: "MessageSquare",
            title: "Mentorship & Guidance",
            description: "Direct 1-on-1 career dialogues, resume advice, and interview preparation from experienced seniors.",
            badge: "Mentorship",
          },
        ],
      },
      {
        id: "about-cta1",
        type: "cta",
        title: "Ready to connect with your community?",
        description: "Sign in with your @ulab.edu.bd email and reach out to alumni working in your dream domain.",
        primaryLabel: "Join ULAB Setu",
        primaryUrl: "/signup",
        secondaryLabel: "Explore Mentors",
        secondaryUrl: "/student/mentors",
        tone: "navy",
      },
    ],
  },
  {
    title: "How It Works",
    slug: "how-it-works",
    summary: "A step-by-step walkthrough of the ULAB Setu network for students, alumni, and faculty.",
    metaTitle: "How ULAB Setu Works · Step-by-Step Guide",
    metaDescription: "Learn how to sign up, verify your institutional role, request alumni referrals, and post job opportunities.",
    blocks: [
      {
        id: "hiw-h1",
        type: "heading",
        level: "h1",
        text: "How ULAB Setu Works",
        subtitle: "Three clear, simple steps from campus signup to career breakthrough.",
        alignment: "center",
      },
      {
        id: "hiw-fc1",
        type: "featureCards",
        title: "The 3 Steps",
        subtitle: "Simple, clear path to opportunity",
        cards: [
          {
            icon: "Sparkles",
            title: "1. Join with Your Campus Role",
            description: "Sign up using your official @ulab.edu.bd student, alumni, or faculty account. Your profile is automatically categorized and protected.",
          },
          {
            icon: "Search",
            title: "2. Explore Seniors by Domain",
            description: "Search alumni by graduation batch, academic department (CSE, BBA, MSJ, DEH), current company, or technical specializations.",
          },
          {
            icon: "Award",
            title: "3. Apply with Direct Referral",
            description: "Apply to curated opportunities posted directly by alumni working inside top firms with internal referral endorsements.",
          },
        ],
      },
      {
        id: "hiw-faq",
        type: "faqAccordion",
        title: "Frequently Asked Questions About the Workflow",
        items: [
          {
            question: "Who can join ULAB Setu?",
            answer: "All current students, verified alumni, and current or former faculty members possessing official institutional credentials can register.",
          },
          {
            question: "Is there any cost to use Setu?",
            answer: "No. ULAB Setu is a 100% free community project dedicated entirely to advancing the professional development of ULABians.",
          },
          {
            question: "How do internal referrals work?",
            answer: "When alumni post an opening with 'Referral Available' enabled, applicants can request a formal referral after reviewing their profile and resume directly in-app.",
          },
        ],
      },
    ],
  },
  {
    title: "Contact Information",
    slug: "contact",
    summary: "Get in touch with the ULAB Setu administrator team and campus career coordinators.",
    metaTitle: "Contact ULAB Setu Support",
    metaDescription: "Contact the ULAB Setu administration, career services, or report technical difficulties.",
    blocks: [
      {
        id: "cnt-h1",
        type: "heading",
        level: "h1",
        text: "Contact ULAB Setu",
        subtitle: "Have a question, feedback, or need assistance with your campus credentials? We are here to help.",
        alignment: "left",
      },
      {
        id: "cnt-rt1",
        type: "richText",
        body: `Campus Career Services & Inquiries:\nUniversity of Liberal Arts Bangladesh\nMain Campus: Beribadh Road, Mohammadpur, Dhaka-1207\nEmail: career.services@ulab.edu.bd\n\nSetu Technical Support:\nIf you encounter account verification, login, or CMS issues, please email our developer team at setu.support@ulab.edu.bd.`,
        isLead: false,
      },
    ],
  },
  {
    title: "Help Center",
    slug: "help",
    summary: "Assistance, FAQs, and guides for navigating the ULAB Setu platform.",
    metaTitle: "ULAB Setu Help Center",
    metaDescription: "Find answers to common questions about accounts, job applications, alumni verification, and security.",
    blocks: [
      {
        id: "hlp-h1",
        type: "heading",
        level: "h1",
        text: "Help Center & FAQ",
        subtitle: "Quick answers to help you get the most out of ULAB Setu.",
        alignment: "center",
      },
      {
        id: "hlp-faq1",
        type: "faqAccordion",
        title: "Account & Verification",
        items: [
          {
            question: "Why was my alumni registration held for verification?",
            answer: "To safeguard our students from impersonation, all alumni accounts undergo automatic or manual review against ULAB registry graduation records before activation.",
          },
          {
            question: "I graduated years ago and lost my university email. Can I still join?",
            answer: "Yes! You can register and submit your ULAB Student ID along with a scanned graduation certificate or transcript for manual approval by the administrator.",
          },
          {
            question: "How do I change my job preferences or email notifications?",
            answer: "Go to your profile settings to adjust your alert triggers, newsletter preferences, and contact privacy options.",
          },
        ],
      },
    ],
  },
  {
    title: "Privacy Policy",
    slug: "privacy",
    summary: "Our commitment to data privacy, protection, and ethical handling of user information.",
    metaTitle: "Privacy Policy · ULAB Setu",
    metaDescription: "Read the official privacy policy and data governance practices of ULAB Setu.",
    blocks: [
      {
        id: "priv-h1",
        type: "heading",
        level: "h1",
        text: "Privacy Policy",
        subtitle: "Last revised: November 2026",
        alignment: "left",
      },
      {
        id: "priv-rt1",
        type: "richText",
        body: `Your privacy is central to ULAB Setu. This policy clarifies how information is gathered, utilized, and safeguarded across our portal.\n\n1. Information Collected\nWe collect information provided upon signup, including your verified institutional email, student ID, department, graduation year, employment history, and optional resume documents.\n\n2. Use of Information\nYour information is used strictly to authenticate campus membership, facilitate career mentorship, and display your professional profile to other verified members. We never sell or distribute your private contact details to commercial advertisers.\n\n3. Privacy Controls\nYou can choose to hide your personal phone number or email address, permitting communication only via the platform's secure internal messaging channel.`,
        isLead: false,
      },
    ],
  },
  {
    title: "Terms and Conditions",
    slug: "terms",
    summary: "The rules, code of conduct, and terms governing the use of ULAB Setu.",
    metaTitle: "Terms and Conditions · ULAB Setu",
    metaDescription: "Read our community standards, professional conduct terms, and usage guidelines.",
    blocks: [
      {
        id: "terms-h1",
        type: "heading",
        level: "h1",
        text: "Terms and Conditions",
        subtitle: "Last revised: November 2026",
        alignment: "left",
      },
      {
        id: "terms-rt1",
        type: "richText",
        body: `By accessing or using ULAB Setu, you agree to adhere to these Terms and Conditions and maintain high standards of university etiquette.\n\n1. Professional Conduct\nAll members must treat fellow students, alumni, and faculty with mutual respect. Harassment, spam, fraudulent job postings, or abusive behavior will result in permanent account suspension and reporting to campus authorities.\n\n2. Accurate Profiles\nYou agree to provide true, accurate, and current information regarding your student status, graduation batch, and employment credentials.\n\n3. Content Ownership\nJob postings, announcements, and articles submitted through the CMS remain the property of their respective creators while granting Setu a license to display them across university channels.`,
        isLead: false,
      },
    ],
  },
];

async function main() {
  console.log("🌱 Starting CMS Phase 2 Safe Initial Content Population...");

  let author = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, name: true, email: true },
  });

  if (!author) {
    author = await prisma.user.findFirst({
      select: { id: true, name: true, email: true },
    });
  }

  if (!author) {
    console.log("⚠️ No user found in database. Seed pages cannot associate an author. Exiting gracefully.");
    return;
  }

  console.log(`👤 Using author ID: ${author.id} (${author.name || author.email})`);

  for (const page of SEED_PAGES) {
    const existing = await prisma.cmsContent.findUnique({
      where: { slug: page.slug },
    });

    const structuredData = JSON.stringify(page.blocks);

    if (existing) {
      console.log(`ℹ️ Page "${page.title}" (/p/${page.slug}) already exists. Updating copy...`);
      await prisma.cmsContent.update({
        where: { id: existing.id },
        data: {
          title: page.title,
          summary: page.summary,
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
          structuredData,
          status: "PUBLISHED",
          publishedAt: existing.publishedAt || new Date(),
          deletedAt: null,
        },
      });
    } else {
      console.log(`✨ Creating page "${page.title}" (/p/${page.slug})...`);
      const created = await prisma.cmsContent.create({
        data: {
          title: page.title,
          slug: page.slug,
          contentType: "PAGE",
          status: "PUBLISHED",
          summary: page.summary,
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
          structuredData,
          authorId: author.id,
          lastEditedById: author.id,
          publishedById: author.id,
          publishedAt: new Date(),
        },
      });

      await prisma.cmsRevision.create({
        data: {
          contentId: created.id,
          version: 1,
          title: created.title,
          slug: created.slug,
          summary: created.summary,
          structuredData,
          statusAtRevision: "PUBLISHED",
          changeSummary: "Initial Phase 2 informational seed.",
          createdById: author.id,
        },
      });
    }
  }

  const existingHome = await prisma.cmsContent.findUnique({
    where: { slug: HOMEPAGE_CMS_SLUG },
  });

  const homeStructured = JSON.stringify(DEFAULT_HOMEPAGE_CONTENT);

  if (existingHome) {
    console.log(`ℹ️ Homepage content record (${HOMEPAGE_CMS_SLUG}) already exists.`);
  } else {
    console.log(`✨ Creating initial Homepage Content record (${HOMEPAGE_CMS_SLUG})...`);
    const home = await prisma.cmsContent.create({
      data: {
        title: "Homepage Main Content",
        slug: HOMEPAGE_CMS_SLUG,
        contentType: "PAGE",
        status: "PUBLISHED",
        summary: "Live homepage copy, hero content, and promotional sections.",
        structuredData: homeStructured,
        authorId: author.id,
        lastEditedById: author.id,
        publishedById: author.id,
        publishedAt: new Date(),
      },
    });

    await prisma.cmsRevision.create({
      data: {
        contentId: home.id,
        version: 1,
        title: home.title,
        slug: home.slug,
        structuredData: homeStructured,
        statusAtRevision: "PUBLISHED",
        changeSummary: "Initial Phase 2 homepage content setup.",
        createdById: author.id,
      },
    });
  }

  console.log("✅ CMS Phase 2 Safe Initial Content Population completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
