"use client";

import { motion } from "motion/react";
import { Globe, Lock, Phone } from "lucide-react";
import { useState } from "react";
import { Input, cn } from "./ui";

function WhatsappIcon({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4a.5.5 0 0 0 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z" />
    </svg>
  );
}

// lucide no longer ships brand logos, so this one is drawn here.
function Facebook({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4a21 21 0 0 0-2.4-.1c-2.4 0-4 1.4-4 4.1v2.1H7.7v3h2.6V21h3.2Z" />
    </svg>
  );
}

const fields = [
  { key: "phone", label: "Phone", icon: <Phone size={16} />, placeholder: "01712345678", type: "tel" },
  { key: "whatsapp", label: "WhatsApp", icon: <WhatsappIcon />, placeholder: "01712345678", type: "tel" },
  { key: "facebook", label: "Facebook", icon: <Facebook size={16} />, placeholder: "facebook.com/your.name or your.name", type: "text" },
] as const;

type Values = { phone: string | null; phonePublic: boolean; whatsapp: string | null; whatsappPublic: boolean; facebook: string | null; facebookPublic: boolean };

/** Contact inputs, each with its own Public / Private switch. */
export function ContactFields({ user }: { user: Values }) {
  const [vis, setVis] = useState({ phone: user.phonePublic, whatsapp: user.whatsappPublic, facebook: user.facebookPublic });
  return (
    <fieldset className="space-y-3 rounded-2xl border border-mist p-4">
      <legend className="px-1 text-sm font-semibold">Contact details</legend>
      <p className="-mt-1 text-xs text-ink-soft">Choose for each one: <b>Public</b> shows it on your card to everyone signed in to Setu, <b>Private</b> keeps it hidden from everyone.</p>
      {fields.map((f) => {
        const isPublic = vis[f.key];
        return (
          <div key={f.key} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="block space-y-1.5">
              <span className="flex items-center gap-1.5 text-sm font-medium text-ink">{f.icon} {f.label}</span>
              <Input name={f.key} type={f.type} defaultValue={(user[f.key] ?? "").replace("https://facebook.com/", "")} placeholder={f.placeholder} />
            </label>
            <input type="hidden" name={`${f.key}Public`} value={isPublic ? "public" : "private"} />
            <div role="radiogroup" aria-label={`Who can see your ${f.label}`} className="relative flex rounded-xl border border-mist bg-paper p-1">
              {[
                { v: false, label: "Private", icon: <Lock size={13} /> },
                { v: true, label: "Public", icon: <Globe size={13} /> },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  role="radio"
                  aria-checked={isPublic === o.v}
                  onClick={() => setVis((s) => ({ ...s, [f.key]: o.v }))}
                  className={cn("relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors", isPublic === o.v ? (o.v ? "text-sage" : "text-ink") : "text-ink-soft")}
                >
                  {isPublic === o.v && (
                    <motion.span layoutId={`vis-${f.key}`} className={cn("absolute inset-0 rounded-lg", o.v ? "bg-sage-wash" : "bg-surface shadow-soft")} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                  )}
                  <span className="relative flex items-center gap-1.5">{o.icon} {o.label}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </fieldset>
  );
}

/** Buttons for someone's public contact details. Renders nothing if they share none. */
export function ContactLinks({ phone, whatsapp, facebook, whatsappHref }: { phone: string | null; whatsapp: string | null; facebook: string | null; whatsappHref: string | null }) {
  if (!phone && !whatsapp && !facebook) return null;
  const btn = "inline-flex items-center gap-1.5 rounded-lg border border-mist px-2.5 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-ulab-light hover:text-ink";
  return (
    <div className="flex flex-wrap gap-2">
      {phone && <a className={btn} href={`tel:${phone}`}><Phone size={13} /> {phone}</a>}
      {whatsapp && whatsappHref && <a className={cn(btn, "hover:border-sage hover:text-sage")} href={whatsappHref} target="_blank" rel="noopener noreferrer"><WhatsappIcon size={13} /> WhatsApp</a>}
      {facebook && <a className={cn(btn, "hover:border-ulab hover:text-ulab")} href={facebook} target="_blank" rel="noopener noreferrer"><Facebook size={13} /> Facebook</a>}
    </div>
  );
}
