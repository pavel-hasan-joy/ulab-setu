import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getPublicEvents } from "@/app/actions/cms";
import { SiteHeader, Logo } from "@/components/site-header";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { site } from "@/lib/site";
import { getDerivedEventState } from "@/lib/cms-phase3-types";
import { Calendar, MapPin, Clock, ArrowRight, ExternalLink } from "lucide-react";
import Image from "next/image";

export const metadata = {
  title: "Campus Events & Fairs · ULAB Setu",
  description: "Career fairs, reunions, tech fests, workshops, and seminars at University of Liberal Arts Bangladesh.",
};

export const dynamic = "force-dynamic";

export default async function PublicEventsPage() {
  const user = await getCurrentUser();
  const events = await getPublicEvents(user?.role);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-paper pb-24">
        {/* Header Hero */}
        <section className="border-b border-mist/70 bg-gradient-to-b from-sky/40 via-surface/80 to-paper py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-4 text-center md:px-6">
            <Badge tone="blue" className="mb-4">Campus Calendar</Badge>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl">
              Upcoming Events & Career Programs
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-ink-soft md:text-lg">
              Explore national hackathons, job fairs, workshops, and alumni networking reunions hosted at ULAB.
            </p>
          </div>
        </section>

        {/* Listings */}
        <section className="mx-auto max-w-5xl px-4 py-12 md:px-6">
          {events.length === 0 ? (
            <Card className="py-16 text-center text-ink-soft">
              <Calendar size={40} className="mx-auto mb-3 text-ink-soft/40" />
              <h3 className="font-display text-lg font-semibold text-ink">No scheduled events right now</h3>
              <p className="text-sm mt-1">Check back soon for upcoming campus fairs and career workshops.</p>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {events.map((event) => {
                let meta: any = {};
                if (event.structuredData) {
                  try {
                    meta = JSON.parse(event.structuredData);
                  } catch {}
                }

                const state = getDerivedEventState(
                  meta.startDate || new Date().toISOString(),
                  meta.endDate || new Date().toISOString(),
                  event.status
                );

                return (
                  <Card key={event.id} className="flex flex-col overflow-hidden p-0 transition-shadow hover:shadow-lift">
                    {event.featuredImage && (
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-mist/30">
                        <Image
                          src={event.featuredImage}
                          alt={event.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-center justify-between gap-2">
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
                      </div>

                      <h2 className="mt-4 font-display text-lg font-bold text-ink leading-snug">
                        <Link href={`/events/${event.slug}`} className="hover:text-ulab hover:underline">
                          {event.title}
                        </Link>
                      </h2>

                      <p className="mt-2 text-xs leading-relaxed text-ink-soft line-clamp-2">
                        {event.summary}
                      </p>

                      <div className="mt-6 space-y-2 border-t border-mist/60 pt-4 text-xs text-ink-soft">
                        <div className="flex items-center gap-1.5 text-ink font-medium">
                          <Calendar size={13} className="text-ulab" />
                          <span>{meta.startDate} {meta.startTime ? `(${meta.startTime})` : ""}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} />
                          <span>{meta.venue || "ULAB Main Campus"}</span>
                        </div>
                      </div>

                      <div className="mt-auto pt-6 flex items-center justify-between border-t border-mist/40 text-xs">
                        <span className="text-ink-soft">By {meta.organizer || "ULAB"}</span>
                        <Link
                          href={`/events/${event.slug}`}
                          className="inline-flex items-center gap-1 font-semibold text-ulab hover:underline"
                        >
                          Details & RSVP <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
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

