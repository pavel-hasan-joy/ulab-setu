"use client";

import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useTransition } from "react";
import { startConversation } from "@/app/actions/network";
import { Button } from "./ui";

export function MessageButton({ toId, messagesHref, hasChat }: { toId: string; messagesHref: string; hasChat: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant={hasChat ? "outline" : "soft"}
      className="py-2"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const id = await startConversation(toId);
          if (id) router.push(`${messagesHref}?c=${id}`);
        })
      }
    >
      <MessageCircle size={15} /> {pending ? "Opening…" : "Message"}
    </Button>
  );
}
