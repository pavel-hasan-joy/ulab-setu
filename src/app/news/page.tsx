import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getPublicAnnouncements } from "@/app/actions/cms";
import { SiteHeader, Logo } from "@/components/site-header";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { site } from "@/lib/site";
import { Bell, Calendar, ArrowRight, FileText, ExternalLink } from "lucide-react";

export const metadata = {
  title: "Official News & Announcements · ULAB Setu",
  description: "Official notices, scholarships, career opportunities, and circulars from University of Liberal Arts Bangladesh.",
};

export const dynamic = "force-dynamic";

export default async function PublicNewsPage() {
  const user = await getCurrentUser();
  const announcements = await getPublicAnnouncements(user?.role);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-paper pb-24">
        {/* Header Hero */}
        <section className="border-b border-mist/70 bg-gradient-to-b from-sky/40 via-surface/80 to-paper py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-4 text-center md:px-6">
            <Badge tone="blue" className="mb-4">Official Announcements</Badge>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl">
              University Circulars & Campus News
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-ink-soft md:text-lg">
              Official university notices, scholarship announcements, research calls, and campus advisories verified by administration.
            </p>
          </div>
        </section>

        {/* Listings */}
        <section className="mx-auto max-w-5xl px-4 py-12 md:px-6">
          {announcements.length === 0 ? (
            <Card className="py-16 text-center text-ink-soft">
              <Bell size={40} className="mx-auto mb-3 text-ink-soft/40" />
              <h3 className="font-display text-lg font-semibold text-ink">No announcements at this time</h3>
              <p className="text-sm mt-1">Check back shortly for official administrative broadcasts.</p>
            </Card>
          ) : (
            <div className="grid gap-6">
              {announcements.map((item) => {
                let meta: any = {};
                if (item.structuredData) {
                  try {
                    meta = JSON.parse(item.structuredData);
                  } catch {}
                }

                return (
                  <Card key={item.id} className="p-6 transition-shadow hover:shadow-lift">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-mist/60 pb-3">
                      <div className="flex items-center gap-2">
                        <Badge tone="blue">{item.category || "Official Notice"}</Badge>
                        {item.priority > 0 && <Badge tone="gold">Pinned</Badge>}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-ink-soft">
                        <Calendar size={13} />
                        <span>
                          {new Date(item.publishedAt || item.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <h2 className="mt-4 font-display text-xl font-bold text-ink">
                      <Link href={`/news/${item.slug}`} className="hover:text-ulab hover:underline">
                        {item.title}
                      </Link>
                    </h2>

                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                      {item.summary || item.body}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-mist/60 pt-4 text-xs">
                      <span className="text-ink-soft">
                        Published by <span className="font-medium text-ink">{item.author?.name || "ULAB Administration"}</span>
                        {item.author?.designation && ` · ${item.author.designation}`}
                      </span>

                      <div className="flex items-center gap-3">
                        {meta.attachmentUrl && (
                          <a
                            href={meta.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-ulab hover:underline"
                          >
                            <FileText size={14} /> PDF Attachment
                          </a>
                        )}
                        <Link
                          href={`/news/${item.slug}`}
                          className="inline-flex items-center gap-1 font-semibold text-ulab hover:underline"
                        >
                          Read Notice <ArrowRight size={14} />
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

