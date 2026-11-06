"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquarePlus, Search, X, Loader2, ArrowRight } from "lucide-react";
import { startConversation } from "@/app/actions/network";
import { Avatar, Badge, Button } from "./ui";

interface Person {
  id: string;
  name: string;
  role: string;
  subtitle: string;
}

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  basePath: string;
  availablePeople: Person[];
}

export function NewChatModal({
  isOpen,
  onClose,
  basePath,
  availablePeople,
}: NewChatModalProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const filteredPeople = availablePeople.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.subtitle.toLowerCase().includes(search.toLowerCase()) ||
    p.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartChat = (personId: string) => {
    setPendingId(personId);
    startTransition(async () => {
      try {
        const connId = await startConversation(personId);
        if (connId) {
          onClose();
          router.push(`${basePath}?c=${connId}`);
        }
      } catch (err) {
        console.error("Failed to start conversation:", err);
      } finally {
        setPendingId(null);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[85vh] w-full max-w-md flex-col rounded-3xl border border-mist bg-surface shadow-lift">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-mist/70 p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-ulab/10 text-ulab">
              <MessageSquarePlus size={18} />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-ink">New Conversation</h3>
              <p className="text-xs text-ink-soft">Message any student, faculty, or alumni</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-ink-soft hover:bg-paper hover:text-ink transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-mist/60 p-3 sm:p-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, department, role..."
              className="w-full rounded-xl border border-mist bg-paper py-2 pl-9 pr-3 text-xs focus:border-ulab focus:outline-hidden"
            />
          </div>
        </div>

        {/* People List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-mist/30">
          {filteredPeople.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-soft">
              No matching members found.
            </div>
          ) : (
            filteredPeople.map((person) => {
              const isOpening = isPending && pendingId === person.id;
              return (
                <button
                  key={person.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleStartChat(person.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl p-2.5 text-left transition hover:bg-paper/80 disabled:opacity-60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={person.name} size={38} className="shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-xs font-bold text-ink">{person.name}</p>
                        <Badge
                          tone={
                            person.role === "TEACHER"
                              ? "lilac"
                              : person.role === "ALUMNI"
                              ? "gold"
                              : "blue"
                          }
                          className="text-[10px] py-0 px-1.5"
                        >
                          {person.role === "TEACHER"
                            ? "Faculty"
                            : person.role === "ALUMNI"
                            ? "Alumni"
                            : "Student"}
                        </Badge>
                      </div>
                      <p className="truncate text-[11px] text-ink-soft">{person.subtitle}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-ulab">
                    {isOpening ? (
                      <Loader2 size={16} className="animate-spin text-ulab" />
                    ) : (
                      <ArrowRight size={14} className="text-ink-soft hover:text-ulab" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-mist/70 p-3 flex justify-end">
          <Button variant="outline" onClick={onClose} className="py-1.5 px-3 text-xs">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
