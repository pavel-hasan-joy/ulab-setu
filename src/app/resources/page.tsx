import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getPublicResources } from "@/app/actions/cms";
import { SiteHeader, Logo } from "@/components/site-header";
import { Badge, Card } from "@/components/ui";
import { site } from "@/lib/site";
import { RESOURCE_CATEGORIES } from "@/lib/cms-phase3-types";
import { BookOpen, Download, FileText, ArrowRight, ExternalLink } from "lucide-react";

export const metadata = {
  title: "Resource Library & Career Guides · ULAB Setu",
  description: "CV templates, interview preparation kits, scholarship guides, and academic resources for ULABians.",
};

export const dynamic = "force-dynamic";

export default async function PublicResourcesPage() {
  const user = await getCurrentUser();
  const resources = await getPublicResources(user?.role);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-paper pb-24">
        {/* Header Hero */}
        <section className="border-b border-mist/70 bg-gradient-to-b from-sky/40 via-surface/80 to-paper py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-4 text-center md:px-6">
            <Badge tone="sage" className="mb-4">Knowledge Base</Badge>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl">
              Career & Academic Resources
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-ink-soft md:text-lg">
              Download official CV templates, interview preparation guides, research toolkits, and academic circulars.
            </p>
          </div>
        </section>

        {/* Resources Grid */}
        <section className="mx-auto max-w-5xl px-4 py-12 md:px-6">
          {resources.length === 0 ? (
            <Card className="py-16 text-center text-ink-soft">
              <BookOpen size={40} className="mx-auto mb-3 text-ink-soft/40" />
              <h3 className="font-display text-lg font-semibold text-ink">No resources available</h3>
              <p className="text-sm mt-1">Resource documents will be added soon.</p>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {resources.map((res) => {
                let meta: any = {};
                if (res.structuredData) {
                  try {
                    meta = JSON.parse(res.structuredData);
                  } catch {}
                }

                return (
                  <Card key={res.id} className="flex flex-col p-6 transition-shadow hover:shadow-lift">
                    <div className="flex items-center justify-between gap-2 border-b border-mist/60 pb-3">
                      <Badge tone="blue">{res.category || "Guide"}</Badge>
                      <span className="flex items-center gap-1 text-xs text-ink-soft font-mono">
                        <FileText size={12} /> {meta.fileType || "PDF"}
                      </span>
                    </div>

                    <h2 className="mt-4 font-display text-lg font-bold text-ink leading-snug">
                      {res.title}
                    </h2>

                    <p className="mt-2 text-xs leading-relaxed text-ink-soft line-clamp-3">
                      {res.summary}
                    </p>

                    <div className="mt-auto border-t border-mist/60 pt-4 flex items-center justify-between gap-2 text-xs">
                      <span className="text-ink-soft">
                        Source: <span className="font-medium text-ink">{meta.authorOrSource || "ULAB"}</span>
                      </span>

                      {meta.fileUrl && (
                        <a
                          href={meta.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-sky px-3 py-1.5 font-semibold text-ulab-deep hover:bg-mist transition-colors"
                        >
                          <Download size={13} /> Download
                        </a>
                      )}
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

