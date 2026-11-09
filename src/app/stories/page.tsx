import Link from "next/link";
import { getPublicAlumniStories } from "@/app/actions/cms";
import { SiteHeader, Logo } from "@/components/site-header";
import { Badge, Card } from "@/components/ui";
import { site } from "@/lib/site";
import { Sparkles, ExternalLink, Quote, Building, Briefcase } from "lucide-react";
import Image from "next/image";

export const metadata = {
  title: "Alumni Stories & Testimonials · ULAB Setu",
  description: "Inspiring career journeys and testimonials from University of Liberal Arts Bangladesh graduates.",
};

export const dynamic = "force-dynamic";

export default async function PublicStoriesPage() {
  const stories = await getPublicAlumniStories();

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-paper pb-24">
        {/* Header Hero */}
        <section className="border-b border-mist/70 bg-gradient-to-b from-sky/40 via-surface/80 to-paper py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-4 text-center md:px-6">
            <Badge tone="gold" className="mb-4">Alumni Journeys</Badge>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl">
              Voices of ULAB Alumni
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-ink-soft md:text-lg">
              Read how seniors traversed academic life into technology firms, corporate leadership, and global institutions.
            </p>
          </div>
        </section>

        {/* Stories Grid */}
        <section className="mx-auto max-w-5xl px-4 py-12 md:px-6">
          {stories.length === 0 ? (
            <Card className="py-16 text-center text-ink-soft">
              <Sparkles size={40} className="mx-auto mb-3 text-ink-soft/40" />
              <h3 className="font-display text-lg font-semibold text-ink">No stories published yet</h3>
              <p className="text-sm mt-1">Alumni spotlights will be showcased here.</p>
            </Card>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {stories.map((story) => {
                let meta: any = {};
                if (story.structuredData) {
                  try {
                    meta = JSON.parse(story.structuredData);
                  } catch {}
                }

                return (
                  <Card key={story.id} className="flex flex-col p-6 transition-shadow hover:shadow-lift">
                    <div className="flex items-start gap-4">
                      {story.featuredImage ? (
                        <div className="relative size-16 shrink-0 overflow-hidden rounded-full border border-mist shadow-sm">
                          <Image
                            src={story.featuredImage}
                            alt={meta.alumniName || "Alumni"}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="grid size-16 shrink-0 place-items-center rounded-full bg-gold-wash font-display text-xl font-bold text-gold-ink">
                          {(meta.alumniName || "A")[0]}
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h2 className="font-display text-lg font-bold text-ink">
                            {meta.alumniName || story.title}
                          </h2>
                          {story.priority > 0 && <Badge tone="gold">Featured</Badge>}
                        </div>

                        <p className="text-xs text-ink-soft flex items-center gap-1 mt-0.5">
                          <Briefcase size={12} /> {meta.currentDesignation || "Professional"}
                        </p>
                        <p className="text-xs font-medium text-ulab flex items-center gap-1">
                          <Building size={12} /> {meta.currentCompany} · {meta.graduationBatch || "Alumni"}
                        </p>
                      </div>
                    </div>

                    <div className="relative mt-6 rounded-2xl border border-mist/70 bg-surface/50 p-4">
                      <Quote size={20} className="absolute -top-3 left-4 text-gold/40" />
                      <p className="font-display text-sm font-semibold italic text-ink pt-1">
                        &quot;{story.summary || story.title}&quot;
                      </p>
                    </div>

                    <p className="mt-4 text-xs leading-relaxed text-ink-soft whitespace-pre-line flex-1">
                      {story.body}
                    </p>

                    {meta.linkedinUrl && (
                      <div className="mt-6 border-t border-mist/60 pt-4 flex items-center justify-end text-xs">
                        <a
                          href={meta.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-ulab hover:underline"
                        >
                          <ExternalLink size={13} /> View LinkedIn Profile
                        </a>
                      </div>
                    )}
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

