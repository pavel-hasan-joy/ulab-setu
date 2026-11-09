import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ArrowRight,
  ExternalLink,
  Calendar,
  MapPin,
  HelpCircle,
  Quote,
  CheckCircle2,
  ChevronDown,
  Layers,
  GraduationCap,
  Briefcase,
  Users,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { type CmsBlock } from "@/lib/cms-blocks";
import { cn, Badge } from "@/components/ui";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Sparkles,
  GraduationCap,
  Briefcase,
  Users,
  ShieldCheck,
  BookOpen,
  Calendar,
  HelpCircle,
  Layers,
  CheckCircle2,
};

function getBlockIcon(name?: string) {
  if (!name) return Sparkles;
  return ICON_MAP[name] || Sparkles;
}

export function CmsBlocksRenderer({
  blocks,
  className,
}: {
  blocks: CmsBlock[];
  className?: string;
}) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className={cn("space-y-12 md:space-y-16", className)}>
      {blocks.map((block) => (
        <section key={block.id} className="w-full">
          {renderSingleBlock(block)}
        </section>
      ))}
    </div>
  );
}

function renderSingleBlock(block: CmsBlock) {
  switch (block.type) {
    case "heading": {
      const Tag = block.level;
      const alignClass =
        block.alignment === "center"
          ? "text-center"
          : block.alignment === "right"
          ? "text-right"
          : "text-left";

      return (
        <div className={cn("space-y-2", alignClass)}>
          {block.subtitle && (
            <p className="text-xs font-bold uppercase tracking-wider text-gold-ink dark:text-gold-soft">
              {block.subtitle}
            </p>
          )}
          <Tag
            className={cn(
              "font-display font-bold text-ink tracking-tight",
              block.level === "h1" && "text-3xl md:text-5xl",
              block.level === "h2" && "text-2xl md:text-4xl",
              block.level === "h3" && "text-xl md:text-2xl",
              block.level === "h4" && "text-lg md:text-xl",
              block.level === "h5" && "text-base md:text-lg",
              block.level === "h6" && "text-sm md:text-base"
            )}
          >
            {block.text}
          </Tag>
        </div>
      );
    }

    case "richText": {
      return (
        <div
          className={cn(
            "prose prose-slate dark:prose-invert max-w-none text-ink-soft leading-relaxed",
            block.isLead && "text-base md:text-lg font-medium text-ink leading-relaxed"
          )}
        >
          {block.body.split("\n\n").map((para, i) => (
            <p key={i} className="mb-4 last:mb-0">
              {para}
            </p>
          ))}
        </div>
      );
    }

    case "image": {
      return (
        <figure className="overflow-hidden rounded-3xl border border-mist/80 bg-surface shadow-xs dark:border-white/10 dark:bg-white/5">
          <div
            className={cn(
              "relative w-full overflow-hidden bg-mist/40 dark:bg-white/5",
              block.aspectRatio === "wide" && "aspect-16/9",
              block.aspectRatio === "square" && "aspect-square max-w-md mx-auto",
              block.aspectRatio === "auto" && "min-h-[260px] max-h-[500px]"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={block.url}
              alt={block.altText}
              className="size-full object-cover"
              loading="lazy"
            />
          </div>
          {block.caption && (
            <figcaption className="p-3 text-center text-xs text-ink-soft italic border-t border-mist/40 dark:border-white/5">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case "imageWithText": {
      const isImageLeft = block.layout === "image-left";

      return (
        <div
          className={cn(
            "grid grid-cols-1 items-center gap-8 md:grid-cols-2 lg:gap-12",
            !isImageLeft && "md:[&>*:first-child]:order-2"
          )}
        >
          <div className="overflow-hidden rounded-3xl border border-mist/80 bg-surface shadow-soft dark:border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={block.imageUrl}
              alt={block.altText}
              className="size-full max-h-[380px] w-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
              {block.heading}
            </h3>
            <p className="text-sm text-ink-soft leading-relaxed">{block.body}</p>
            {block.ctaText && block.ctaLink && (
              <div className="pt-2">
                <Link
                  href={block.ctaLink}
                  className="inline-flex items-center gap-2 rounded-xl bg-ulab-deep px-5 py-2.5 text-xs font-bold text-white shadow-lift transition hover:bg-ulab"
                >
                  {block.ctaText} <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      );
    }

    case "featureCards": {
      return (
        <div className="space-y-6">
          {(block.title || block.subtitle) && (
            <div className="text-center max-w-2xl mx-auto space-y-1">
              {block.title && (
                <h3 className="font-display text-2xl font-bold text-ink md:text-3xl">
                  {block.title}
                </h3>
              )}
              {block.subtitle && <p className="text-xs text-ink-soft">{block.subtitle}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {block.cards.map((card, idx) => {
              const IconComp = getBlockIcon(card.icon);

              return (
                <div
                  key={idx}
                  className="rounded-3xl border border-mist/80 bg-surface/90 p-5 shadow-xs transition hover:border-ulab/40 hover:shadow-soft dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-ulab/10 text-ulab dark:bg-ulab/20 dark:text-sky-300">
                      <IconComp size={18} />
                    </div>
                    {card.badge && (
                      <Badge tone="blue" className="text-[10px]">
                        {card.badge}
                      </Badge>
                    )}
                  </div>
                  <h4 className="mt-4 font-display text-base font-bold text-ink">{card.title}</h4>
                  <p className="mt-1.5 text-xs text-ink-soft leading-relaxed">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    case "cta": {
      const toneStyles =
        block.tone === "gold"
          ? "bg-gradient-to-br from-gold/20 via-paper to-gold-wash border-gold/40 text-ink"
          : block.tone === "sky"
          ? "bg-gradient-to-br from-sky/40 via-paper to-sky/20 border-sky/40 text-ink"
          : "bg-gradient-to-br from-ulab-deep via-[#0d2a4a] to-ulab text-white border-white/10 shadow-soft";

      return (
        <div className={cn("relative overflow-hidden rounded-3xl border p-8 md:p-12 text-center", toneStyles)}>
          <div className="relative z-10 mx-auto max-w-2xl space-y-3">
            <h3 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              {block.title}
            </h3>
            {block.description && (
              <p
                className={cn(
                  "text-xs md:text-sm leading-relaxed",
                  block.tone === "navy" ? "text-white/80" : "text-ink-soft"
                )}
              >
                {block.description}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link
                href={block.primaryUrl}
                className={cn(
                  "inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-xs font-bold shadow-lift transition",
                  block.tone === "navy"
                    ? "bg-gold text-ulab-deep hover:bg-gold-soft"
                    : "bg-ulab-deep text-white hover:bg-ulab"
                )}
              >
                {block.primaryLabel} <ArrowRight size={14} />
              </Link>
              {block.secondaryLabel && block.secondaryUrl && (
                <Link
                  href={block.secondaryUrl}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-semibold backdrop-blur-md transition border",
                    block.tone === "navy"
                      ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                      : "border-mist/80 bg-surface/80 text-ink hover:bg-surface"
                  )}
                >
                  {block.secondaryLabel}
                </Link>
              )}
            </div>
          </div>
        </div>
      );
    }

    case "faqAccordion": {
      return (
        <div className="space-y-6">
          {(block.title || block.description) && (
            <div className="text-center max-w-2xl mx-auto space-y-1">
              {block.title && (
                <h3 className="font-display text-2xl font-bold text-ink md:text-3xl">
                  {block.title}
                </h3>
              )}
              {block.description && <p className="text-xs text-ink-soft">{block.description}</p>}
            </div>
          )}

          <div className="mx-auto max-w-3xl space-y-3">
            {block.items.map((item, idx) => (
              <details
                key={idx}
                className="group rounded-2xl border border-mist/80 bg-surface/90 p-4 transition-all open:border-ulab/40 open:shadow-xs dark:border-white/10 dark:bg-white/5"
              >
                <summary className="flex cursor-pointer items-center justify-between font-display text-sm font-bold text-ink marker:hidden">
                  <span>{item.question}</span>
                  <ChevronDown
                    size={16}
                    className="text-ink-soft transition-transform group-open:rotate-180 shrink-0 ml-2"
                  />
                </summary>
                <p className="mt-3 text-xs text-ink-soft leading-relaxed border-t border-mist/40 pt-2.5 dark:border-white/5">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      );
    }

    case "testimonial": {
      return (
        <div className="relative overflow-hidden rounded-3xl border border-mist/80 bg-surface/90 p-6 md:p-8 shadow-xs dark:border-white/10 dark:bg-white/5">
          <Quote className="size-8 text-gold/40 dark:text-gold/30 mb-3" />
          <blockquote className="font-display text-base md:text-lg italic text-ink leading-relaxed">
            &ldquo;{block.quote}&rdquo;
          </blockquote>

          <div className="mt-6 flex items-center gap-3 border-t border-mist/50 pt-4 dark:border-white/5">
            {block.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={block.avatarUrl}
                alt={block.authorName}
                className="size-10 rounded-full object-cover border border-mist"
              />
            ) : (
              <div className="size-10 rounded-full bg-gold-wash grid place-items-center font-bold text-gold-ink text-xs">
                {block.authorName.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-bold text-xs text-ink">{block.authorName}</p>
              <p className="text-[11px] text-ink-soft">
                {block.authorRole}
                {block.authorCompany ? `, ${block.authorCompany}` : ""}
              </p>
            </div>
          </div>
        </div>
      );
    }

    case "eventPreview": {
      return (
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-mist/80 bg-surface/90 p-5 shadow-xs transition hover:border-purple-500/40 sm:flex-row sm:items-center dark:border-white/10 dark:bg-white/5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge tone="lilac" className="text-[10px]">
                {block.badge || "Campus Event"}
              </Badge>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                <Calendar size={13} /> {block.eventDate}
              </span>
            </div>
            <h4 className="font-display text-base font-bold text-ink">{block.title}</h4>
            {block.description && (
              <p className="text-xs text-ink-soft line-clamp-2">{block.description}</p>
            )}
            <p className="flex items-center gap-1 text-[11px] text-ink-soft">
              <MapPin size={12} /> {block.location}
            </p>
          </div>

          {block.rsvpLink && (
            <div className="shrink-0">
              <Link
                href={block.rsvpLink}
                target={block.rsvpLink.startsWith("http") ? "_blank" : undefined}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-soft transition hover:bg-purple-700"
              >
                RSVP / Register <ExternalLink size={12} />
              </Link>
            </div>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}

