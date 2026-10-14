"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Search, Users, X, Loader2 } from "lucide-react";
import { createGroup } from "@/app/actions/group";
import { Avatar, Button, Input, Textarea, cn } from "./ui";

interface Person {
  id: string;
  name: string;
  role: string;
  subtitle: string;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  basePath: string;
  availablePeople: Person[];
}

export function CreateGroupModal({
  isOpen,
  onClose,
  basePath,
  availablePeople,
}: CreateGroupModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredPeople = availablePeople.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.subtitle.toLowerCase().includes(search.toLowerCase()) ||
    p.role.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a group name");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await createGroup({
      name: name.trim(),
      description: description.trim() || undefined,
      memberIds: selectedIds,
    });

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else if (res.groupId) {
      onClose();
      router.push(`${basePath}?g=${res.groupId}`);
      router.refresh();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-mist bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-mist/70 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-ulab/10 text-ulab">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">Create New Group</h2>
              <p className="text-xs text-ink-soft">
                Connect and chat with peers, faculty, or alumni
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-soft transition hover:bg-mist/50 hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="flex flex-1 flex-col overflow-y-auto p-5">
          {error && (
            <div className="mb-4 rounded-xl border border-rose/30 bg-rose/10 px-3.5 py-2.5 text-xs font-medium text-rose">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Group Name *
              </label>
              <Input
                placeholder="e.g. CSE 311 Study Group, Web Dev Team..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Description / Topic (Optional)
              </label>
              <Textarea
                placeholder="What is this group about? (announcements, project discussion, study questions...)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={250}
              />
            </div>

            {/* Member Selection */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Add Members ({selectedIds.length} selected)
                </label>
              </div>

              {/* Selected Pills */}
              {selectedIds.length > 0 && (
                <div className="mb-2.5 flex flex-wrap gap-1.5 rounded-xl border border-mist/50 bg-paper/60 p-2">
                  {selectedIds.map((id) => {
                    const person = availablePeople.find((p) => p.id === id);
                    if (!person) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-sky px-2.5 py-1 text-xs font-medium text-ulab-deep"
                      >
                        {person.name}
                        <button
                          type="button"
                          onClick={() => toggleSelect(id)}
                          className="hover:text-rose"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Search Bar */}
              <div className="relative mb-2">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
                />
                <input
                  type="text"
                  placeholder="Search students, faculty, or alumni..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-mist bg-paper py-2 pl-9 pr-3 text-xs text-ink placeholder:text-ink-soft/70 focus:border-ulab focus:outline-none focus:ring-2 focus:ring-ulab/15"
                />
              </div>

              {/* People List */}
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-mist/60 bg-paper/40 p-1.5">
                {filteredPeople.length === 0 ? (
                  <p className="py-4 text-center text-xs text-ink-soft">
                    No members found matching &quot;{search}&quot;
                  </p>
                ) : (
                  filteredPeople.map((p) => {
                    const isSelected = selectedIds.includes(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => toggleSelect(p.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition",
                          isSelected ? "bg-sky" : "hover:bg-paper"
                        )}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <Avatar name={p.name} size={30} />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-ink">
                              {p.name}
                            </p>
                            <p className="truncate text-[11px] text-ink-soft">
                              {p.subtitle || p.role}
                            </p>
                          </div>
                        </div>
                        <div
                          className={cn(
                            "grid size-5 shrink-0 place-items-center rounded-md border transition",
                            isSelected
                              ? "border-ulab bg-ulab text-white"
                              : "border-mist text-transparent hover:border-ink-soft"
                          )}
                        >
                          <Check size={12} strokeWidth={3} />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-mist/70 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="py-2 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="py-2 text-xs"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Create Group
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
