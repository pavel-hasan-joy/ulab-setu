import Link from "next/link";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { PageIn } from "./motion";
import { Avatar, Card, EmptyState, PageHeader, cn, timeAgo } from "./ui";
import { ChatWindow } from "./chat-window";
import { RequestActions } from "./request-actions";

export async function MessagesView({ user, basePath, selected }: { user: User; basePath: string; selected?: string }) {
  const connections = await db.connection.findMany({
    where: { OR: [{ fromId: user.id }, { toId: user.id }], status: { not: "DECLINED" } },
    include: { from: true, to: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
  const incoming = connections.filter((c) => c.status === "PENDING" && c.toId === user.id);
  const outgoing = connections.filter((c) => c.status === "PENDING" && c.fromId === user.id);
  const active = connections
    .filter((c) => c.status === "ACCEPTED")
    .sort((a, b) => (b.messages[0]?.createdAt ?? b.createdAt).getTime() - (a.messages[0]?.createdAt ?? a.createdAt).getTime());
  const current = active.find((c) => c.id === selected) ?? (selected ? undefined : active[0]);
  const other = (c: (typeof connections)[number]) => (c.fromId === user.id ? c.to : c.from);

  return (
    <PageIn>
      <PageHeader title="Messages" description={user.role === "ALUMNI" ? "Students who want to learn from you. Accept a request to start chatting." : "Your conversations with alumni."} />

      {incoming.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-ink-soft">Requests waiting for you</h2>
          <div className="space-y-3">
            {incoming.map((c) => (
              <Card key={c.id} className="flex flex-wrap items-start gap-4 border-gold/40 p-5">
                <Avatar name={c.from.name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{c.from.name}</p>
                  <p className="text-xs text-ink-soft">{c.from.department}{c.from.batch ? `, admitted ${c.from.batch}` : ""}{c.from.company ? `, ${c.from.company}` : ""}</p>
                  {c.note && <p className="mt-2 rounded-xl bg-paper px-3.5 py-2.5 text-sm text-ink">&ldquo;{c.note}&rdquo;</p>}
                  {c.from.skills && <p className="mt-2 text-xs text-ink-soft">Skills: {c.from.skills}</p>}
                </div>
                <RequestActions connectionId={c.id} />
              </Card>
            ))}
          </div>
        </section>
      )}

      {active.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          body={user.role === "ALUMNI" ? "When a student reaches out and you accept, the conversation shows up here." : "Find an alumnus in your field and send a connection request."}
        />
      ) : (
        <Card className="grid overflow-hidden md:h-[560px] md:grid-cols-[260px_1fr]">
          <ul className={cn("border-mist/70 md:overflow-y-auto md:border-r", current && "hidden md:block")}>
            {active.map((c) => {
              const o = other(c);
              return (
                <li key={c.id}>
                  <Link href={`${basePath}?c=${c.id}`} scroll={false} className={cn("flex items-center gap-3 border-b border-mist/50 px-4 py-3.5 transition", current?.id === c.id ? "bg-sky" : "hover:bg-paper")}>
                    <Avatar name={o.name} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{o.name}</p>
                      <p className="truncate text-xs text-ink-soft">{c.messages[0]?.body ?? "Say hello"}</p>
                    </div>
                    {c.messages[0] && <span className="shrink-0 text-[11px] text-ink-soft">{timeAgo(c.messages[0].createdAt).replace(" ago", "")}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
          {current ? (
            <ChatWindow key={current.id} connectionId={current.id} backHref={basePath} other={{ name: other(current).name, subtitle: other(current).company ? `${other(current).designation} at ${other(current).company}` : other(current).department ?? "" }} />
          ) : (
            <div className="hidden place-items-center text-sm text-ink-soft md:grid">Choose a conversation</div>
          )}
        </Card>
      )}

      {outgoing.length > 0 && (
        <p className="mt-6 text-sm text-ink-soft">
          Waiting for a reply from {outgoing.map((c) => c.to.name).join(", ")}.
        </p>
      )}
    </PageIn>
  );
}
