"use client";

import { useEffect, useState } from "react";
import { HONEYPOT_FIELD_NAME, FORM_TIMESTAMP_FIELD_NAME } from "@/lib/bot-defense";

interface BotDefenseFieldsProps {
  className?: string;
}

/**
 * Invisible Bot Defense Component
 *
 * Injects:
 * 1. Invisible Honeypot Trap Input (filled only by automated bots)
 * 2. Form Rendering Timestamp (flags sub-second robotic execution)
 * 3. Optional Cloudflare Turnstile Invisible Widget if NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY is set
 */
export function BotDefenseFields({ className }: BotDefenseFieldsProps) {
  const [renderTs, setRenderTs] = useState<number>(0);
  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    setRenderTs(Date.now());
  }, []);

  return (
    <div
      className={className}
      style={{
        display: "none",
        position: "absolute",
        left: "-9999px",
        width: 0,
        height: 0,
        opacity: 0,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      {/* Honeypot trap: Human users cannot see or tab into this. Automated bots autofill it. */}
      <label htmlFor={HONEYPOT_FIELD_NAME}>Do not fill this field</label>
      <input
        type="text"
        id={HONEYPOT_FIELD_NAME}
        name={HONEYPOT_FIELD_NAME}
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />

      {/* Render timestamp trap */}
      <input
        type="hidden"
        name={FORM_TIMESTAMP_FIELD_NAME}
        value={renderTs > 0 ? renderTs.toString() : ""}
      />

      {/* Cloudflare Turnstile Container if configured */}
      {siteKey && (
        <div
          className="cf-turnstile"
          data-sitekey={siteKey}
          data-theme="auto"
          data-size="invisible"
        />
      )}
    </div>
  );
}

