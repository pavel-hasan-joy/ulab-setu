import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEffectiveCmsRole } from "@/lib/cms-auth";
import { hasCmsCapability } from "@/lib/cms-permissions";
import { db } from "@/lib/db";
import { parseCmsBlocks } from "@/lib/cms-blocks";
import { CmsBlocksRenderer } from "@/components/cms/cms-blocks-renderer";
import { SiteHeader, Logo } from "@/components/site-header";
import { site } from "@/lib/site";
import { AlertCircle, Eye, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Preview Mode · ULAB Setu CMS",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CmsPreviewPage({ params }: PreviewPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const cmsRole = await getEffectiveCmsRole(user.id);
  const canView = hasCmsCapability(cmsRole, "cms:content:view");
  if (!canView) {
    redirect("/admin/cms");
  }

  const { id } = await params;

  const page = await db.cmsContent.findUnique({
    where: { id },
    include: {
      author: { select: { name: true, email: true } },
      lastEditedBy: { select: { name: true, email: true } },
    },
  });

  if (!page || page.deletedAt) {
    notFound();
  }

  const blocks = parseCmsBlocks(page.structuredData);

  return (
    <>
      {/* Top Banner: Preview Mode Notice */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-300 bg-amber-500/15 px-4 py-2.5 backdrop-blur-md dark:border-amber-700/60 dark:bg-amber-950/40">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
          <Eye size={16} className="text-amber-600 dark:text-amber-400" />
          <span>
            CMS Preview Mode — Current Status:{" "}
            <span className="font-bold underline uppercase">{page.status}</span>
          </span>
          <span className="hidden sm:inline text-amber-700/70 dark:text-amber-400/60">
            (Public visitors cannot see this draft)
          </span>
        </div>

        <Link
          href="/admin/cms/pages"
          className="inline-flex items-center gap-1 text-xs font-medium text-amber-900 hover:underline dark:text-amber-200"
        >
          <ArrowLeft size={14} /> Back to Pages
        </Link>
      </div>

      <SiteHeader />

      <main className="min-h-screen bg-paper pb-24">
        {/* Page Header */}
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

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-ink-soft">
              <span>Slug: <code className="font-mono bg-surface px-1.5 py-0.5 rounded border border-mist">/p/{page.slug}</code></span>
              {page.lastEditedBy?.name && <span>· Last edited by {page.lastEditedBy.name}</span>}
            </div>
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

