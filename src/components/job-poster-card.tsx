"use client";

import { useState } from "react";
import { User as UserIcon, MessageCircle } from "lucide-react";
import type { User } from "@prisma/client";
import { Avatar, Badge, Button, Card, posterLabel } from "./ui";
import { ProfileModal } from "./profile-modal";
import { MessageButton } from "./message-button";

type SafeUser = Omit<User, "passwordHash">;

export function JobPosterCard({
  poster,
  messagesHref = "/student/messages",
}: {
  poster: SafeUser;
  messagesHref?: string;
}) {
  const [showProfile, setShowProfile] = useState(false);
  const isPrivate = Boolean(poster.isPrivate);

  return (
    <>
      <Card className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Posted by</p>

        {/* Clickable poster info */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowProfile(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setShowProfile(true);
            }
          }}
          className="mt-3 flex items-center gap-3.5 rounded-xl p-2 -m-2 transition hover:bg-paper cursor-pointer group"
          title="Click to view full profile"
          aria-label={`View ${poster.name}'s profile`}
        >
          <Avatar
            name={poster.name}
            src={poster.image}
            size={46}
            className="ring-2 ring-mist group-hover:ring-ulab transition shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-sm text-ink group-hover:text-ulab transition truncate">
                {poster.name}
              </p>
              {isPrivate ? (
                <Badge tone="gray" className="text-[10px] py-0 px-1.5 shrink-0">
                  🔒 Private
                </Badge>
              ) : (
                <Badge tone="sage" className="text-[10px] py-0 px-1.5 shrink-0">
                  🌐 Public
                </Badge>
              )}
            </div>
            <p className="text-xs text-ink-soft truncate">
              {poster.department ? `${poster.department}, ` : ""}
              {posterLabel(poster as User)}
            </p>
            {poster.company && (
              <p className="text-[11px] font-medium text-ink-soft/90 truncate">
                {poster.designation ? `${poster.designation} at ` : ""}
                {poster.company}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowProfile(true)}
            className="w-full justify-center gap-1.5 py-2 text-xs font-semibold hover:border-ulab hover:text-ulab"
          >
            <UserIcon size={14} /> View Full Profile
          </Button>

          <MessageButton
            toId={poster.id}
            messagesHref={messagesHref}
            hasChat={false}
          />
        </div>
      </Card>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          person={poster}
          onClose={() => setShowProfile(false)}
          messagesHref={messagesHref}
        />
      )}
    </>
  );
}
