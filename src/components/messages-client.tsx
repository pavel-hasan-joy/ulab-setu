"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Plus, Users, User as UserIcon } from "lucide-react";
import { Avatar, Button, cn, timeAgo } from "./ui";
import { CreateGroupModal } from "./create-group-modal";
import { ChatWindow } from "./chat-window";
import { GroupChatWindow } from "./group-chat-window";

export interface SerializedConnection {
  id: string;
  fromId: string;
  toId: string;
  createdAt: string;
  otherUser: {
    id: string;
    name: string;
    department: string | null;
    designation: string | null;
    company: string | null;
    role: string;
  };
  lastMessage?: {
    body: string;
    createdAt: string;
  };
}

export interface SerializedGroup {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  createdById: string;
  memberCount: number;
  lastMessage?: {
    body: string;
    senderName?: string;
    createdAt: string;
  };
}

export interface AvailablePerson {
  id: string;
  name: string;
  role: string;
  subtitle: string;
}

interface MessagesClientProps {
  currentUserId: string;
  basePath: string;
  connections: SerializedConnection[];
  groups: SerializedGroup[];
  availablePeople: AvailablePerson[];
  selectedConnectionId?: string;
  selectedGroupId?: string;
}

type TabType = "all" | "direct" | "groups";

export function MessagesClient({
  currentUserId,
  basePath,
  connections = [],
  groups = [],
  availablePeople = [],
  selectedConnectionId,
  selectedGroupId,
}: MessagesClientProps) {
  const [tab, setTab] = useState<TabType>("all");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  // Active items
  const activeConnection = (connections || []).find((c) => c.id === selectedConnectionId);
  const activeGroup = (groups || []).find((g) => g.id === selectedGroupId);

  const hasSelection = Boolean(activeConnection || activeGroup);

  const getTime = (dateStr?: string) => {
    if (!dateStr) return 0;
    const t = new Date(dateStr).getTime();
    return isNaN(t) ? 0 : t;
  };

  // Unified items list sorted by last activity
  type ConversationItem =
    | { type: "direct"; data: SerializedConnection; lastTime: number }
    | { type: "group"; data: SerializedGroup; lastTime: number };

  const allItems: ConversationItem[] = [
    ...(connections || []).map((c) => ({
      type: "direct" as const,
      data: c,
      lastTime: getTime(c.lastMessage?.createdAt) || getTime(c.createdAt),
    })),
    ...(groups || []).map((g) => ({
      type: "group" as const,
      data: g,
      lastTime: getTime(g.lastMessage?.createdAt) || getTime(g.createdAt),
    })),
  ].sort((a, b) => b.lastTime - a.lastTime);

  const filteredItems = allItems.filter((item) => {
    if (tab === "direct") return item.type === "direct";
    if (tab === "groups") return item.type === "group";
    return true;
  });

  return (
    <div className="grid overflow-hidden rounded-2xl border border-mist bg-surface shadow-soft md:h-[620px] md:grid-cols-[300px_1fr]">
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col border-mist/70 bg-surface md:border-r",
          hasSelection && "hidden md:flex"
        )}
      >
        {/* Top Actions & Create Group */}
        <div className="border-b border-mist/60 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">Conversations</h3>
            <Button
              onClick={() => setIsCreateGroupOpen(true)}
              variant="soft"
              className="h-8 gap-1.5 px-2.5 text-xs font-semibold text-ulab-deep shadow-none"
            >
              <Plus size={14} />
              New Group
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex rounded-xl bg-paper p-1 text-xs font-medium">
            <button
              onClick={() => setTab("all")}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-center transition",
                tab === "all"
                  ? "bg-surface font-bold text-ink shadow-sm"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              All ({allItems.length})
            </button>
            <button
              onClick={() => setTab("direct")}
              className={cn(
                "flex items-center justify-center gap-1 flex-1 rounded-lg py-1.5 transition",
                tab === "direct"
                  ? "bg-surface font-bold text-ink shadow-sm"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              <UserIcon size={12} />
              Direct ({connections.length})
            </button>
            <button
              onClick={() => setTab("groups")}
              className={cn(
                "flex items-center justify-center gap-1 flex-1 rounded-lg py-1.5 transition",
                tab === "groups"
                  ? "bg-surface font-bold text-ink shadow-sm"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              <Users size={12} />
              Groups ({groups.length})
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-mist/40">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto grid size-10 place-items-center rounded-xl bg-mist/40 text-ink-soft">
                <MessageSquare size={20} />
              </div>
              <p className="mt-3 text-xs font-semibold text-ink">
                No {tab === "groups" ? "groups" : tab === "direct" ? "direct messages" : "conversations"} yet
              </p>
              <p className="mt-1 text-[11px] text-ink-soft">
                {tab === "groups"
                  ? "Create a group to chat with multiple people."
                  : "Start chatting from the People directory."}
              </p>
              {tab === "groups" && (
                <Button
                  onClick={() => setIsCreateGroupOpen(true)}
                  className="mt-3 py-1.5 text-xs"
                >
                  Create Group
                </Button>
              )}
            </div>
          ) : (
            filteredItems.map((item) => {
              if (item.type === "direct") {
                const c = item.data;
                const isSelected = activeConnection?.id === c.id;
                return (
                  <Link
                    key={`conn-${c.id}`}
                    href={`${basePath}?c=${c.id}`}
                    scroll={false}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 transition",
                      isSelected ? "bg-sky" : "hover:bg-paper/80"
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar name={c.otherUser.name} size={40} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate text-xs font-bold text-ink">
                          {c.otherUser.name}
                        </p>
                        {c.lastMessage && (
                          <span className="shrink-0 text-[10px] text-ink-soft">
                            {timeAgo(new Date(c.lastMessage.createdAt)).replace(" ago", "")}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[11px] text-ink-soft">
                        {c.lastMessage?.body || "Start a conversation"}
                      </p>
                    </div>
                  </Link>
                );
              } else {
                const g = item.data;
                const isSelected = activeGroup?.id === g.id;
                return (
                  <Link
                    key={`group-${g.id}`}
                    href={`${basePath}?g=${g.id}`}
                    scroll={false}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 transition",
                      isSelected ? "bg-sky" : "hover:bg-paper/80"
                    )}
                  >
                    <div className="relative shrink-0">
                      <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-tr from-ulab to-ulab-deep text-xs font-bold text-white shadow-soft">
                        {g.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full bg-emerald-600 text-[9px] text-white ring-2 ring-surface">
                        <Users size={9} />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate text-xs font-bold text-ink">
                          {g.name}
                        </p>
                        {g.lastMessage && (
                          <span className="shrink-0 text-[10px] text-ink-soft">
                            {timeAgo(new Date(g.lastMessage.createdAt)).replace(" ago", "")}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[11px] text-ink-soft">
                        {g.lastMessage
                          ? (g.lastMessage.senderName ? `${g.lastMessage.senderName}: ` : "") + g.lastMessage.body
                          : `${g.memberCount} members`}
                      </p>
                    </div>
                  </Link>
                );
              }
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={cn("flex flex-col bg-surface", !hasSelection && "hidden md:flex")}>
        {activeGroup ? (
          <GroupChatWindow
            key={activeGroup.id}
            groupId={activeGroup.id}
            groupName={activeGroup.name}
            memberCount={activeGroup.memberCount}
            backHref={basePath}
            currentUserId={currentUserId}
            availablePeople={availablePeople}
          />
        ) : activeConnection ? (
          <ChatWindow
            key={activeConnection.id}
            connectionId={activeConnection.id}
            backHref={basePath}
            other={{
              name: activeConnection.otherUser.name,
              subtitle: activeConnection.otherUser.company
                ? `${activeConnection.otherUser.designation} at ${activeConnection.otherUser.company}`
                : activeConnection.otherUser.department ?? "",
            }}
          />
        ) : (
          <div className="grid h-full place-items-center p-8 text-center">
            <div className="max-w-sm">
              <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-sky text-ulab">
                <MessageSquare size={24} />
              </div>
              <h4 className="text-base font-bold text-ink">Select a Conversation</h4>
              <p className="mt-1 text-xs text-ink-soft">
                Choose a direct message from the left or create a group to start chatting with students, faculty, and alumni.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Button
                  onClick={() => setIsCreateGroupOpen(true)}
                  className="py-2 text-xs"
                >
                  <Plus size={14} />
                  New Group
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        basePath={basePath}
        availablePeople={availablePeople}
      />
    </div>
  );
}
