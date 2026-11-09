import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SiteHeader, Logo } from "@/components/site-header";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { site } from "@/lib/site";
import { getDerivedEventState } from "@/lib/cms-phase3-types";
import { Calendar, MapPin, Clock, ArrowLeft, ExternalLink, Video, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface EventDetailsProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventDetailsProps) {
  const { slug } = await params;
  const event = await db.cmsContent.findUnique({
    where: { slug },
    select: { title: true, summary: true, featuredImage: true },
  });

  if (!event) return { title: "Event Not Found · ULAB Setu" };

  return {
    title: `${event.title} · Campus Events · ULAB Setu`,
    description: event.summary || `${event.title} event details.`,
    openGraph: {
      title: event.title,
      description: event.summary || undefined,
      images: event.featuredImage ? [{ url: event.featuredImage }] : undefined,
    },
  };
}

export default async function EventDetailsPage({ params }: EventDetailsProps) {
  const { slug } = await params;
  const user = await getCurrentUser();

  const event = await db.cmsContent.findUnique({
    where: { slug },
    include: {
      author: { select: { name: true, designation: true } },
    },
  });

  if (!event || event.deletedAt || event.status !== "PUBLISHED") {
    notFound();
  }

  let meta: any = {};
  if (event.structuredData) {
    try {
      meta = JSON.parse(event.structuredData);
    } catch {}
  }

  const audience = meta.targetAudience || "PUBLIC";
  if (audience !== "PUBLIC") {
    if (!user) notFound();
    if (audience !== "AUTHENTICATED" && user.role !== audience) notFound();
  }

  const state = getDerivedEventState(
    meta.startDate || new Date().toISOString(),
    meta.endDate || new Date().toISOString(),
    event.status
  );

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-paper pb-24">
        <div className="mx-auto max-w-4xl px-4 pt-10 md:px-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-ink transition-colors"
          >
            <ArrowLeft size={14} /> Back to Events
          </Link>
        </div>

        <article className="mx-auto mt-6 max-w-4xl px-4 md:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="blue">{event.category || "Event"}</Badge>
            <Badge
              tone={
                state === "UPCOMING"
                  ? "blue"
                  : state === "ONGOING"
                  ? "sage"
                  : "gray"
              }
            >
              {state}
            </Badge>
            <Badge tone="gray">Audience: {audience}</Badge>
          </div>

          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {event.title}
          </h1>

          {/* Quick Schedule Grid */}
          <div className="mt-6 grid gap-4 rounded-2xl border border-mist bg-surface/60 p-6 sm:grid-cols-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Date & Timing</span>
              <p className="mt-1 font-semibold text-ink flex items-center gap-2">
                <Calendar size={16} className="text-ulab" />
                {meta.startDate} to {meta.endDate}
              </p>
              <p className="text-xs text-ink-soft mt-0.5">
                Daily: {meta.startTime || "10:00 AM"} – {meta.endTime || "04:00 PM"} ({meta.timeZone || "Asia/Dhaka"})
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Venue</span>
              <p className="mt-1 font-semibold text-ink flex items-center gap-2">
                <MapPin size={16} className="text-ulab" />
                {meta.venue || "ULAB Main Campus"}
              </p>
              <p className="text-xs text-ink-soft mt-0.5">
                Organized by {meta.organizer || "ULAB Career Services"}
              </p>
            </div>
          </div>

          {event.featuredImage && (
            <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl border border-mist mt-8 shadow-lift">
              <Image
                src={event.featuredImage}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {event.summary && (
            <div className="mt-8 text-lg font-medium leading-relaxed text-ink-soft">
              {event.summary}
            </div>
          )}

          <div className="mt-8 prose prose-slate max-w-none text-base leading-relaxed text-ink whitespace-pre-line border-t border-mist/70 pt-6">
            {event.body}
          </div>

          {/* Registration / Virtual Link CTAs */}
          {(meta.registrationUrl || meta.meetingUrl) && (
            <div className="mt-12 flex flex-wrap gap-4 rounded-2xl border border-mist bg-surface/80 p-6">
              {meta.registrationUrl && (
                <a
                  href={meta.registrationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-ulab px-6 py-3 text-sm font-semibold text-white shadow-soft hover:bg-ulab-deep transition-all"
                >
                  <ExternalLink size={16} /> Register for Event
                </a>
              )}

              {meta.meetingUrl && (
                <a
                  href={meta.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-mist bg-surface px-6 py-3 text-sm font-semibold text-ink hover:border-ulab transition-all"
                >
                  <Video size={16} className="text-rose-500" /> Join Virtual Meeting
                </a>
              )}
            </div>
          )}
        </article>
      </main>

      <footer className="border-t border-mist/70 bg-surface/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-ink-soft md:px-6">
          <Logo />
          <p>
            A community project for <a href={site.universityUrl} className="underline decoration-mist underline-offset-4 hover:text-ulab" target="_blank" rel="noreferrer">{site.university}</a> — {site.universityTagline}.
          </p>
        </div>
      </footer>
    </>
  );
}

