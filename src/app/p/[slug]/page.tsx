import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { parseCmsBlocks } from "@/lib/cms-blocks";
import { CmsBlocksRenderer } from "@/components/cms/cms-blocks-renderer";
import { SiteHeader, Logo } from "@/components/site-header";
import { site } from "@/lib/site";
import Image from "next/image";
import Link from "next/link";
import { Eye, X } from "lucide-react";

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
      canonicalUrl: true,
      featuredImage: true,
      status: true,
      deletedAt: true,
    },
  });

  if (!page || page.deletedAt || page.status !== "PUBLISHED") {
    return {
      title: "Page Not Found · ULAB Setu",
      robots: { index: false, follow: false },
    };
  }

  const title = page.metaTitle || `${page.title} · ${site.name}`;
  const description = page.metaDescription || page.summary || `${site.name} official informational page.`;

  return {
    title,
    description,
    alternates: {
      canonical: page.canonicalUrl || `https://ulab-setu.vercel.app/p/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://ulab-setu.vercel.app/p/${slug}`,
      siteName: site.name,
      images: page.featuredImage ? [{ url: page.featuredImage }] : undefined,
    },
  };
}

export default async function PublicCmsPage({ params }: PageProps) {
  const { slug } = await params;
  const isDraftPreview = (await draftMode()).isEnabled;

  // Query CMS page. Public visitors only see PUBLISHED; Draft Mode can preview drafts/scheduled.
  const page = await db.cmsContent.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      summary: true,
      body: true,
      structuredData: true,
      featuredImage: true,
      status: true,
      deletedAt: true,
      publishedAt: true,
      updatedAt: true,
      author: { select: { name: true } },
    },
  });

  if (!page || page.deletedAt) {
    notFound();
  }

  if (page.status !== "PUBLISHED" && !isDraftPreview) {
    notFound();
  }

  const blocks = parseCmsBlocks(page.structuredData);

  return (
    <>
      {isDraftPreview && (
        <div className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-300 bg-amber-500/15 px-4 py-2 backdrop-blur-md dark:border-amber-700/60 dark:bg-amber-950/50">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
            <Eye size={14} className="text-amber-600 dark:text-amber-400" />
            <span>Next.js Draft Mode Active — Status: <strong className="uppercase">{page.status}</strong></span>
          </div>
          <Link
            href={`/api/cms/exit-preview?next=/p/${slug}`}
            className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-900 hover:bg-amber-500/30 dark:text-amber-200"
          >
            <X size={12} /> Exit Preview
          </Link>
        </div>
      )}

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

        {/* Content Blocks or Narrative Body */}
        <section className="mx-auto max-w-4xl px-4 py-12 md:px-6">
          {blocks.length > 0 ? (
            <CmsBlocksRenderer blocks={blocks} />
          ) : page.body ? (
            <div className="prose prose-slate dark:prose-invert max-w-none text-ink leading-relaxed whitespace-pre-line">
              {page.body}
            </div>
          ) : (
            <p className="text-center text-sm text-ink-soft italic">No content blocks published yet for this page.</p>
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
