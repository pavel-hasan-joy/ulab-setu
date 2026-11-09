import { z } from "zod";

/**
 * Supported Content Block Types in the ULAB Setu CMS Block Editor.
 */
export const CMS_BLOCK_TYPES = [
  "heading",
  "richText",
  "image",
  "imageWithText",
  "featureCards",
  "cta",
  "faqAccordion",
  "testimonial",
  "eventPreview",
] as const;

export type CmsBlockType = (typeof CMS_BLOCK_TYPES)[number];

export const CMS_BLOCK_TYPE_META: Record<
  CmsBlockType,
  { label: string; description: string; icon: string }
> = {
  heading: {
    label: "Heading",
    description: "Section headline with customizable hierarchy level and alignment.",
    icon: "Heading",
  },
  richText: {
    label: "Rich Text",
    description: "Formatted narrative paragraphs, lists, and formatted copy.",
    icon: "FileText",
  },
  image: {
    label: "Image",
    description: "Featured photography or graphic with caption and aspect ratio.",
    icon: "Image",
  },
  imageWithText: {
    label: "Image with Text",
    description: "Side-by-side narrative layout with illustration and call to action.",
    icon: "LayoutTemplate",
  },
  featureCards: {
    label: "Feature Cards",
    description: "Grid of icon-accented feature highlights and benefits.",
    icon: "Grid",
  },
  cta: {
    label: "Call to Action",
    description: "Prominent conversion banner with primary and secondary action buttons.",
    icon: "Sparkles",
  },
  faqAccordion: {
    label: "FAQ Accordion",
    description: "Expandable questions and answers with accessible toggle behavior.",
    icon: "HelpCircle",
  },
  testimonial: {
    label: "Testimonial / Spotlight",
    description: "Student or alumni quote with avatar, role, and corporate affiliation.",
    icon: "Quote",
  },
  eventPreview: {
    label: "Event Preview",
    description: "Event banner featuring date, venue, description, and registration link.",
    icon: "Calendar",
  },
};

// ==============================================================================
// 1. SCHEMAS FOR EACH CONTENT BLOCK
// ==============================================================================

export const headingBlockSchema = z.object({
  id: z.string(),
  type: z.literal("heading"),
  level: z.enum(["h1", "h2", "h3", "h4", "h5", "h6"]).default("h2"),
  text: z.string().trim().min(1, "Heading text cannot be empty."),
  subtitle: z.string().trim().optional(),
  alignment: z.enum(["left", "center", "right"]).default("left"),
});

export const richTextBlockSchema = z.object({
  id: z.string(),
  type: z.literal("richText"),
  body: z.string().trim().min(1, "Text body cannot be empty."),
  isLead: z.boolean().default(false),
});

export const imageBlockSchema = z.object({
  id: z.string(),
  type: z.literal("image"),
  url: z.string().trim().url("Image URL must be valid."),
  altText: z.string().trim().min(1, "Alt text is required for accessibility."),
  caption: z.string().trim().optional(),
  aspectRatio: z.enum(["wide", "square", "auto"]).default("wide"),
});

export const imageWithTextBlockSchema = z.object({
  id: z.string(),
  type: z.literal("imageWithText"),
  imageUrl: z.string().trim().url("Image URL must be valid."),
  altText: z.string().trim().min(1, "Alt text is required for accessibility."),
  heading: z.string().trim().min(1, "Heading is required."),
  body: z.string().trim().min(1, "Body copy is required."),
  layout: z.enum(["image-left", "image-right"]).default("image-left"),
  ctaText: z.string().trim().optional(),
  ctaLink: z.string().trim().optional(),
});

export const featureCardItemSchema = z.object({
  icon: z.string().default("Sparkles"),
  title: z.string().trim().min(1, "Card title is required."),
  description: z.string().trim().min(1, "Card description is required."),
  badge: z.string().trim().optional(),
});

export const featureCardsBlockSchema = z.object({
  id: z.string(),
  type: z.literal("featureCards"),
  title: z.string().trim().optional(),
  subtitle: z.string().trim().optional(),
  cards: z.array(featureCardItemSchema).min(1, "At least one card is required."),
});

export const ctaBlockSchema = z.object({
  id: z.string(),
  type: z.literal("cta"),
  title: z.string().trim().min(1, "CTA title is required."),
  description: z.string().trim().optional(),
  primaryLabel: z.string().trim().min(1, "Primary button label is required."),
  primaryUrl: z.string().trim().min(1, "Primary button URL is required."),
  secondaryLabel: z.string().trim().optional(),
  secondaryUrl: z.string().trim().optional(),
  tone: z.enum(["navy", "gold", "sky"]).default("navy"),
});

export const faqItemSchema = z.object({
  question: z.string().trim().min(1, "Question cannot be empty."),
  answer: z.string().trim().min(1, "Answer cannot be empty."),
});

export const faqAccordionBlockSchema = z.object({
  id: z.string(),
  type: z.literal("faqAccordion"),
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
  items: z.array(faqItemSchema).min(1, "At least one FAQ item is required."),
});

export const testimonialBlockSchema = z.object({
  id: z.string(),
  type: z.literal("testimonial"),
  quote: z.string().trim().min(1, "Quote text is required."),
  authorName: z.string().trim().min(1, "Author name is required."),
  authorRole: z.string().trim().min(1, "Author role is required."),
  authorCompany: z.string().trim().optional(),
  avatarUrl: z.string().trim().url().optional().or(z.literal("")),
});

export const eventPreviewBlockSchema = z.object({
  id: z.string(),
  type: z.literal("eventPreview"),
  title: z.string().trim().min(1, "Event title is required."),
  eventDate: z.string().trim().min(1, "Event date is required."),
  location: z.string().trim().min(1, "Event location is required."),
  description: z.string().trim().optional(),
  rsvpLink: z.string().trim().optional(),
  badge: z.string().trim().optional(),
});

// Discriminated union of all supported blocks
export const cmsBlockSchema = z.discriminatedUnion("type", [
  headingBlockSchema,
  richTextBlockSchema,
  imageBlockSchema,
  imageWithTextBlockSchema,
  featureCardsBlockSchema,
  ctaBlockSchema,
  faqAccordionBlockSchema,
  testimonialBlockSchema,
  eventPreviewBlockSchema,
]);

export type CmsBlock = z.infer<typeof cmsBlockSchema>;
export type HeadingBlock = z.infer<typeof headingBlockSchema>;
export type RichTextBlock = z.infer<typeof richTextBlockSchema>;
export type ImageBlock = z.infer<typeof imageBlockSchema>;
export type ImageWithTextBlock = z.infer<typeof imageWithTextBlockSchema>;
export type FeatureCardsBlock = z.infer<typeof featureCardsBlockSchema>;
export type CtaBlock = z.infer<typeof ctaBlockSchema>;
export type FaqAccordionBlock = z.infer<typeof faqAccordionBlockSchema>;
export type TestimonialBlock = z.infer<typeof testimonialBlockSchema>;
export type EventPreviewBlock = z.infer<typeof eventPreviewBlockSchema>;

export const cmsBlocksArraySchema = z.array(cmsBlockSchema);

/**
 * Safely parses and validates JSON string into strongly-typed CmsBlock array.
 * If data is corrupted or null, returns an empty array without throwing.
 */
export function parseCmsBlocks(rawJson: string | null | undefined): CmsBlock[] {
  if (!rawJson) return [];

  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) return [];

    const validated = cmsBlocksArraySchema.safeParse(parsed);
    if (validated.success) {
      return validated.data;
    }
    console.warn("CMS Blocks validation warning:", validated.error.issues);
    // Return sanitized partial items where possible
    return parsed.filter((item): item is CmsBlock => {
      const single = cmsBlockSchema.safeParse(item);
      return single.success;
    });
  } catch (err) {
    console.error("Failed to parse CMS blocks JSON:", err);
    return [];
  }
}

