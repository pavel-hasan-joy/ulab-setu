import Link from "next/link";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { postKinds } from "@/lib/site";
import { PageIn } from "./motion";
import { PostComposer } from "./post-composer";
import { PageHeader, cn } from "./ui";
import { BoardFeed, type SerializedPost } from "./board-feed";

/** Everyone reads the board; verified teachers and alumni can post to it. */
export async function BoardView({
  viewer,
  basePath,
  params,
}: {
  viewer: User;
  basePath: string;
  params: { kind?: string; noticeId?: string };
}) {
  const kind = postKinds.find((k) => k === params.kind);
  const rawPosts = await db.post.findMany({
    where: {
      ...(kind ? { kind } : {}),
      deletedAt: null,
    },
    include: {
      author: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedPosts: SerializedPost[] = rawPosts.map((p) => ({
    id: p.id,
    kind: p.kind,
    title: p.title,
    body: p.body,
    link: p.link,
    eventDate: p.eventDate ? p.eventDate.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    authorId: p.authorId,
    author: {
      id: p.author.id,
      name: p.author.name,
      email: p.author.email,
      role: p.author.role,
      status: p.author.status,
      department: p.author.department,
      designation: p.author.designation,
      company: p.author.company,
      batch: p.author.batch,
      graduationYear: p.author.graduationYear,
      location: p.author.location,
      image: p.author.image,
      bio: p.author.bio,
      skills: p.author.skills,
      linkedin: p.author.linkedin,
      github: p.author.github,
      socialLinks: p.author.socialLinks,
      phone: p.author.phone,
      phonePublic: p.author.phonePublic,
      whatsapp: p.author.whatsapp,
      whatsappPublic: p.author.whatsappPublic,
      facebook: p.author.facebook,
      facebookPublic: p.author.facebookPublic,
      isPrivate: p.author.isPrivate,
      alumniVerified: p.author.alumniVerified,
    },
  }));

  const canPost = viewer.role === "TEACHER" || viewer.role === "ALUMNI";

  return (
    <PageIn>
      <PageHeader
        title="Notice board"
        description="Announcements, events, scholarships and research calls from ULAB teachers and alumni."
      />

      {canPost && <PostComposer verified={viewer.status === "APPROVED"} />}

      <div className="mb-6 flex flex-wrap gap-2">
        {[undefined, ...postKinds].map((k) => (
          <Link
            key={k ?? "all"}
            href={k ? `${basePath}?kind=${k}` : basePath}
            scroll={false}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
              kind === k
                ? "border-ulab bg-ulab text-white"
                : "border-mist bg-surface text-ink-soft hover:border-ulab-light hover:text-ink dark:border-white/10 dark:bg-white/5",
            )}
          >
            {k ?? "All"}
          </Link>
        ))}
      </div>

      <BoardFeed
        posts={serializedPosts}
        viewerId={viewer.id}
        viewerRole={viewer.role}
        canPost={canPost}
        basePath={basePath}
        initialNoticeId={params.noticeId}
      />
    </PageIn>
  );
}
