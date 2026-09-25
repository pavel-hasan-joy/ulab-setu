import Link from "next/link";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { PageIn } from "./motion";
import { Avatar, ButtonLink, Card, EmptyState, PageHeader, cn, timeAgo } from "./ui";
import { ChatWindow } from "./chat-window";

export async function MessagesView({ user, basePath, selected }: { user: User; basePath: string; selected?: string }) {
  const connections = await db.connection.findMany({
    where: { OR: [{ fromId: user.id }, { toId: user.id }] },
    include: { from: true, to: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
  // Messaging is open: every conversation is active, most recent first.
  const active = connections
    .sort((a, b) => (b.messages[0]?.createdAt ?? b.createdAt).getTime() - (a.messages[0]?.createdAt ?? a.createdAt).getTime());
  const current = active.find((c) => c.id === selected) ?? (selected ? undefined : active[0]);
  const other = (c: (typeof connections)[number]) => (c.fromId === user.id ? c.to : c.from);

  return (
    <PageIn>
      <PageHeader title="Messages" description="Anyone at ULAB Setu can message anyone. Find people on the People page." />

      {active.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          body="Open the People page and press Message on anyone to start a conversation."
          action={<ButtonLink href={basePath.replace("/messages", "/people")}>Find people</ButtonLink>}
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

    </PageIn>
  );
}
