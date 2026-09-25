import Link from "next/link";
import { CalendarDays, ExternalLink } from "lucide-react";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { postKinds } from "@/lib/site";
import { PageIn, Stagger, StaggerItem } from "./motion";
import { PostComposer } from "./post-composer";
import { DeletePost } from "./delete-post";
import { Avatar, Badge, Card, EmptyState, PageHeader, cn, formatDate, timeAgo } from "./ui";

const kindTone = { Notice: "blue", Event: "lilac", Scholarship: "gold", Research: "sage", Opportunity: "rose" } as const;

/** Everyone reads the board; verified teachers and alumni can post to it. */
export async function BoardView({ viewer, basePath, params }: { viewer: User; basePath: string; params: { kind?: string } }) {
  const kind = postKinds.find((k) => k === params.kind);
  const posts = await db.post.findMany({
    where: kind ? { kind } : {},
    include: { author: true },
    orderBy: { createdAt: "desc" },
  });
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
              kind === k ? "border-ulab bg-ulab text-white" : "border-mist bg-surface text-ink-soft hover:border-ulab-light hover:text-ink",
            )}
          >
            {k ?? "All"}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <EmptyState title="Nothing posted here yet" body={canPost ? "Be the first: share a notice, event or opportunity above." : "Teachers and alumni will post notices, events and scholarships here."} />
      ) : (
        <Stagger className="space-y-4">
          {posts.map((p) => (
            <StaggerItem key={p.id}>
              <Card className="p-5 md:p-6">
                <div className="flex items-start gap-3">
                  <Avatar name={p.author.name} size={42} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="font-semibold">{p.author.name}</p>
                      <Badge tone={p.author.role === "TEACHER" ? "lilac" : "gold"}>
                        {p.author.role === "TEACHER" ? p.author.designation ?? "Teacher" : `Alumni, ${p.author.graduationYear}`}
                      </Badge>
                    </div>
                    <p className="text-xs text-ink-soft">{p.author.department}. {timeAgo(p.createdAt)}</p>
                  </div>
                  {p.authorId === viewer.id && <DeletePost postId={p.id} />}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge tone={kindTone[p.kind as keyof typeof kindTone] ?? "gray"}>{p.kind}</Badge>
                  {p.eventDate && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft"><CalendarDays size={13} /> {formatDate(p.eventDate)}</span>
                  )}
                </div>
                <h2 className="mt-2 text-xl font-semibold">{p.title}</h2>
                <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-soft">{p.body}</p>
                {p.link && (
                  <a href={p.link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ulab hover:underline">
                    Open link <ExternalLink size={14} />
                  </a>
                )}
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </PageIn>
  );
}
