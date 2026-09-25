"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { deletePost } from "@/app/actions/posts";

export function DeletePost({ postId }: { postId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => deletePost(postId))}
      className="rounded-lg p-2 text-ink-soft transition hover:bg-rose-wash hover:text-rose"
      aria-label="Delete post"
    >
      <Trash2 size={16} />
    </button>
  );
}
