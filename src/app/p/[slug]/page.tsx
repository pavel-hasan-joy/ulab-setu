import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { parseCmsBlocks } from "@/lib/cms-blocks";
import { CmsBlocksRenderer } from "@/components/cms/cms-blocks-renderer";
import { SiteHeader, Logo } from "@/components/site-header";
import { site } from "@/lib/site";
import Image from "next/image";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await db.cmsContent.findUnique({
    where: { slug },
    select: {
      title: true,
      summary: true,
      metaTitle: true,
      metaDescription: true,
      featuredImage: true,
      status: true,
      deletedAt: true,
    },
  });

  if (!page || page.deletedAt || page.status !== "PUBLISHED") {
    return {
      title: "Page Not Found · ULAB Setu",
    };
  }

  const title = page.metaTitle || `${page.title} · ${site.name}`;
  const description = page.metaDescription || page.summary || `${site.name} official informational page.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: page.featuredImage ? [{ url: page.featuredImage }] : undefined,
    },
  };
}

export default async function PublicCmsPage({ params }: PageProps) {
  const { slug } = await params;

  // Query published CMS page only. Drafts or archived content return 404 to public visitors.
  const page = await db.cmsContent.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      summary: true,
      structuredData: true,
      featuredImage: true,
      status: true,
      deletedAt: true,
      publishedAt: true,
      updatedAt: true,
      author: { select: { name: true } },
    },
  });

  if (!page || page.deletedAt || page.status !== "PUBLISHED") {
    notFound();
  }

  const blocks = parseCmsBlocks(page.structuredData);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-paper pb-24">
        {/* Page Hero Header */}
        <section className="relative overflow-hidden border-b border-mist/70 bg-gradient-to-b from-sky/40 via-surface/80 to-paper py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-4 text-center md:px-6">
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl">
              {page.title}
            </h1>
            {page.summary && (
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink-soft md:text-lg">
                {page.summary}
              </p>
            )}

            {page.publishedAt && (
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-soft">
                <span>Published on {new Date(page.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                {page.author?.name && <span>· by {page.author.name}</span>}
              </div>
            )}
          </div>

          {page.featuredImage && (
            <div className="mx-auto mt-10 max-w-4xl px-4 md:px-6">
              <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl border border-mist shadow-lift">
                <Image
                  src={page.featuredImage}
                  alt={page.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          )}
        </section>

        {/* Content Blocks */}
        <section className="mx-auto max-w-4xl px-4 py-12 md:px-6">
          <CmsBlocksRenderer blocks={blocks} />
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

