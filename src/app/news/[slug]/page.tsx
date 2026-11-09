import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SiteHeader, Logo } from "@/components/site-header";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { site } from "@/lib/site";
import { Bell, Calendar, ArrowLeft, FileText, ExternalLink, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface NewsDetailsProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: NewsDetailsProps) {
  const { slug } = await params;
  const item = await db.cmsContent.findUnique({
    where: { slug },
    select: { title: true, summary: true, featuredImage: true },
  });

  if (!item) return { title: "Notice Not Found · ULAB Setu" };

  return {
    title: `${item.title} · ULAB Setu Official Notice`,
    description: item.summary || `${item.title} - Official university announcement.`,
    openGraph: {
      title: item.title,
      description: item.summary || undefined,
      images: item.featuredImage ? [{ url: item.featuredImage }] : undefined,
    },
  };
}

export default async function NewsDetailsPage({ params }: NewsDetailsProps) {
  const { slug } = await params;
  const user = await getCurrentUser();

  const item = await db.cmsContent.findUnique({
    where: { slug },
    include: {
      author: { select: { name: true, designation: true, role: true } },
    },
  });

  if (!item || item.deletedAt || item.status !== "PUBLISHED") {
    notFound();
  }

  let meta: any = {};
  if (item.structuredData) {
    try {
      meta = JSON.parse(item.structuredData);
    } catch {}
  }

  // Audience restriction check
  const audience = meta.targetAudience || "PUBLIC";
  if (audience !== "PUBLIC") {
    if (!user) {
      notFound();
    }
    if (audience !== "AUTHENTICATED" && user.role !== audience) {
      notFound();
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-paper pb-24">
        <div className="mx-auto max-w-4xl px-4 pt-10 md:px-6">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-ink transition-colors"
          >
            <ArrowLeft size={14} /> Back to Announcements
          </Link>
        </div>

        <article className="mx-auto mt-6 max-w-4xl px-4 md:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="blue">{item.category || "Official Notice"}</Badge>
            {item.priority > 0 && <Badge tone="gold">Pinned Advisory</Badge>}
            <Badge tone="gray">Audience: {audience}</Badge>
          </div>

          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {item.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 border-b border-mist/70 pb-6 text-xs text-ink-soft">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-ulab" />
              <span>
                Published: {new Date(item.publishedAt || item.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            {item.author?.name && (
              <div className="flex items-center gap-1.5">
                <User size={14} className="text-ulab" />
                <span>Authorized by {item.author.name} {item.author.designation ? `(${item.author.designation})` : ""}</span>
              </div>
            )}
          </div>

          {item.featuredImage && (
            <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl border border-mist mt-8 shadow-lift">
              <Image
                src={item.featuredImage}
                alt={item.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {item.summary && (
            <div className="mt-8 rounded-2xl border border-sky/60 bg-sky/20 p-5 text-sm font-medium leading-relaxed text-ink">
              {item.summary}
            </div>
          )}

          <div className="mt-8 prose prose-slate max-w-none text-base leading-relaxed text-ink whitespace-pre-line">
            {item.body}
          </div>

          {/* Action Links & Attachments */}
          {(meta.attachmentUrl || meta.registrationUrl) && (
            <div className="mt-12 flex flex-wrap gap-4 rounded-2xl border border-mist bg-surface/60 p-6">
              {meta.attachmentUrl && (
                <a
                  href={meta.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-ulab px-5 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-ulab-deep transition-all"
                >
                  <FileText size={16} /> Download Official PDF Circular
                </a>
              )}

              {meta.registrationUrl && (
                <a
                  href={meta.registrationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-mist bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:border-ulab transition-all"
                >
                  <ExternalLink size={16} /> Register / Apply Online
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

