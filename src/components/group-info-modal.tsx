"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Crown,
  Loader2,
  LogOut,
  Plus,
  Search,
  Shield,
  Trash2,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import {
  addGroupMembers,
  deleteGroup,
  leaveGroup,
  removeGroupMember,
} from "@/app/actions/group";
import { Avatar, Button, cn } from "./ui";

interface GroupMemberInfo {
  id: string;
  userId: string;
  name: string;
  role: string; // ADMIN | MEMBER
  userRole: string; // STUDENT | TEACHER | ALUMNI
  subtitle: string;
  joinedAt: string;
}

interface GroupDetails {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  createdById: string;
  createdByName: string;
  isAdmin: boolean;
  members: GroupMemberInfo[];
}

interface Person {
  id: string;
  name: string;
  role: string;
  subtitle: string;
}

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupDetails;
  currentUserId: string;
  basePath: string;
  availablePeople: Person[];
  onRefreshGroup: () => Promise<void>;
}

export function GroupInfoModal({
  isOpen,
  onClose,
  group,
  currentUserId,
  basePath,
  availablePeople,
  onRefreshGroup,
}: GroupInfoModalProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"members" | "add">("members");
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen) return null;

  const existingMemberUserIds = new Set(group.members.map((m) => m.userId));
  const candidatePeople = availablePeople.filter(
    (p) =>
      !existingMemberUserIds.has(p.id) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.subtitle.toLowerCase().includes(search.toLowerCase()) ||
        p.role.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddMembers = async () => {
    if (selectedToAdd.length === 0) return;
    setLoading(true);
    setActionError(null);
    const res = await addGroupMembers(group.id, selectedToAdd);
    setLoading(false);
    if (res.error) {
      setActionError(res.error);
    } else {
      setSelectedToAdd([]);
      setTab("members");
      await onRefreshGroup();
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from this group?`)) return;
    setLoading(true);
    setActionError(null);
    const res = await removeGroupMember(group.id, userId);
    setLoading(false);
    if (res.error) {
      setActionError(res.error);
    } else {
      await onRefreshGroup();
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    setLoading(true);
    setActionError(null);
    const res = await leaveGroup(group.id);
    setLoading(false);
    if (res.error) {
      setActionError(res.error);
    } else {
      onClose();
      router.push(basePath);
      router.refresh();
    }
  };

  const handleDeleteGroup = async () => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this group? All messages and attachments will be deleted."
      )
    )
      return;
    setLoading(true);
    setActionError(null);
    const res = await deleteGroup(group.id);
    setLoading(false);
    if (res.error) {
      setActionError(res.error);
    } else {
      onClose();
      router.push(basePath);
      router.refresh();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-mist bg-surface shadow-2xl">
        {/* Header with Group Summary */}
        <div className="border-b border-mist/70 p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-ulab to-ulab-deep text-lg font-bold text-white shadow-soft">
                {group.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-ink">{group.name}</h2>
                <p className="text-xs text-ink-soft">
                  Group • {group.members.length} members
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-soft hover:bg-mist/50 hover:text-ink"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {group.description && (
            <p className="mt-3 rounded-xl bg-paper/70 p-2.5 text-xs text-ink-soft leading-relaxed">
              {group.description}
            </p>
          )}

          {/* Navigation Tabs */}
          <div className="mt-4 flex gap-2 border-b border-mist/50 pb-2">
            <button
              onClick={() => setTab("members")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                tab === "members"
                  ? "bg-sky text-ulab-deep"
                  : "text-ink-soft hover:bg-paper"
              )}
            >
              <Users size={14} />
              Members ({group.members.length})
            </button>
            <button
              onClick={() => setTab("add")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                tab === "add"
                  ? "bg-sky text-ulab-deep"
                  : "text-ink-soft hover:bg-paper"
              )}
            >
              <Plus size={14} />
              Add Members
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {actionError && (
            <div className="mb-4 rounded-xl border border-rose/30 bg-rose/10 px-3.5 py-2.5 text-xs font-medium text-rose">
              {actionError}
            </div>
          )}

          {tab === "members" ? (
            <div className="space-y-2">
              {group.members.map((m) => {
                const isMe = m.userId === currentUserId;
                const isAdmin = m.role === "ADMIN";
                const isCreator = m.userId === group.createdById;

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-xl border border-mist/50 bg-paper/40 p-2.5 transition hover:bg-paper/80"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={m.name} size={36} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-semibold text-ink">
                            {m.name} {isMe && "(You)"}
                          </p>
                          {isCreator && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold-ink">
                              <Crown size={10} /> Owner
                            </span>
                          )}
                          {isAdmin && !isCreator && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-sky px-1.5 py-0.5 text-[10px] font-bold text-ulab-deep">
                              <Shield size={10} /> Admin
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[11px] text-ink-soft">
                          {m.subtitle || m.userRole}
                        </p>
                      </div>
                    </div>

                    {/* Admin Action: Remove User */}
                    {group.isAdmin && !isMe && !isCreator && (
                      <button
                        onClick={() => handleRemoveMember(m.userId, m.name)}
                        disabled={loading}
                        className="rounded-lg p-1.5 text-ink-soft transition hover:bg-rose/10 hover:text-rose"
                        title="Remove member"
                      >
                        <UserMinus size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
                />
                <input
                  type="text"
                  placeholder="Search to invite..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-mist bg-paper py-2 pl-9 pr-3 text-xs text-ink placeholder:text-ink-soft/70 focus:border-ulab focus:outline-none focus:ring-2 focus:ring-ulab/15"
                />
              </div>

              <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-mist/60 bg-paper/40 p-1.5">
                {candidatePeople.length === 0 ? (
                  <p className="py-6 text-center text-xs text-ink-soft">
                    No new members found to add.
                  </p>
                ) : (
                  candidatePeople.map((p) => {
                    const isSelected = selectedToAdd.includes(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() =>
                          setSelectedToAdd((prev) =>
                            prev.includes(p.id)
                              ? prev.filter((id) => id !== p.id)
                              : [...prev, p.id]
                          )
                        }
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
                        <span
                          className={cn(
                            "rounded-md border px-2 py-0.5 text-[11px] font-medium transition",
                            isSelected
                              ? "border-ulab bg-ulab text-white"
                              : "border-mist text-ink-soft"
                          )}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              <Button
                type="button"
                onClick={handleAddMembers}
                disabled={loading || selectedToAdd.length === 0}
                className="w-full py-2 text-xs"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Adding...
                  </>
                ) : (
                  `Add ${selectedToAdd.length} Member(s)`
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Footer Actions: Leave / Delete */}
        <div className="flex items-center justify-between border-t border-mist/70 bg-paper/30 px-5 py-3.5">
          {group.isAdmin && (
            <Button
              variant="outline"
              onClick={handleDeleteGroup}
              disabled={loading}
              className="text-xs text-rose hover:bg-rose/10 hover:text-rose border-rose/30 py-2"
            >
              <Trash2 size={14} />
              Delete Group
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleLeaveGroup}
              disabled={loading}
              className="text-xs text-ink-soft hover:text-rose py-2"
            >
              <LogOut size={14} />
              Leave Group
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
