import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

// twMerge lets a className passed to a component override its defaults (e.g. a gold Card).
export function cn(...c: (string | false | null | undefined)[]) {
  return twMerge(c.filter(Boolean).join(" "));
}

const buttonStyles = {
  primary:
    "bg-ulab text-white shadow-soft hover:bg-ulab-deep hover:shadow-lift",
  soft: "bg-sky text-ulab-deep hover:bg-mist",
  ghost: "text-ink-soft hover:bg-sky hover:text-ink",
  outline: "border border-mist bg-surface text-ink hover:border-ulab-light hover:text-ulab-deep",
  gold: "bg-gold-wash text-gold-ink hover:bg-gold/25",
};

type Variant = keyof typeof buttonStyles;
const base =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none";

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cn(base, buttonStyles[variant], className)} {...props} />;
}

export function ButtonLink({ variant = "primary", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cn(base, buttonStyles[variant], className)} {...props} />;
}

const fieldBase =
  "w-full rounded-xl border border-mist bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-soft/60 transition focus:border-ulab-light focus:outline-none focus:ring-4 focus:ring-ulab-light/15";

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={cn(fieldBase, props.className)} />;
}
export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea rows={4} {...props} className={cn(fieldBase, "resize-y", props.className)} />;
}
export function Select({ options, placeholder, ...props }: ComponentProps<"select"> & { options: readonly string[]; placeholder?: string }) {
  return (
    <select {...props} className={cn(fieldBase, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%235a6b85%22 stroke-width=%222.5%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[right_14px_center] bg-no-repeat pr-10", props.className)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

const badgeTones = {
  blue: "bg-sky text-ulab-deep",
  gold: "bg-gold-wash text-gold-ink",
  sage: "bg-sage-wash text-sage",
  rose: "bg-rose-wash text-rose",
  gray: "bg-mist/70 text-ink-soft",
  lilac: "bg-lilac-wash text-lilac-ink",
};
export function Badge({ tone = "blue", children, className }: { tone?: keyof typeof badgeTones; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", badgeTones[tone], className)}>{children}</span>;
}

const avatarPalette = ["#dbe9f7", "#fdf0cf", "#dff0e6", "#ece8fb", "#fbe6e4", "#e2f1f6"];
const avatarInk = ["#134f88", "#7a5a06", "#2f6e51", "#5b4fa8", "#9a4a45", "#236a80"];
export function Avatar({ name, size = 40, className }: { name: string; size?: number; className?: string }) {
  const initials = name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const i = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % avatarPalette.length;
  return (
    <span
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-display font-semibold", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        // In dark mode the pastel fades into the surface and the ink lightens (see --avatar-* in globals.css).
        background: `color-mix(in srgb, ${avatarPalette[i]} var(--avatar-bg-mix), var(--color-surface))`,
        color: `color-mix(in srgb, ${avatarInk[i]} var(--avatar-ink-mix), white)`,
      }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-mist/80 bg-surface shadow-soft", className)} {...props} />;
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-rose-wash px-3.5 py-2.5 text-sm text-rose">
      {message}
    </p>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold text-ink md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="dots grid place-items-center rounded-2xl border border-dashed border-mist px-6 py-16 text-center">
      <div className="max-w-sm">
        <p className="font-display text-lg font-semibold text-ink">{title}</p>
        <p className="mt-1.5 text-sm text-ink-soft">{body}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}

export function timeAgo(date: Date | string) {
  const s = (Date.now() - new Date(date).getTime()) / 1000;
  if (s < 60) return "just now";
  const units: [number, string][] = [[31536000, "year"], [2592000, "month"], [604800, "week"], [86400, "day"], [3600, "hour"], [60, "minute"]];
  for (const [u, name] of units) {
    const n = Math.floor(s / u);
    if (n >= 1) return `${n} ${name}${n > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** How a job or notice author is described: alumni by graduating class, teachers by rank. */
export function posterLabel(u: { role: string; graduationYear: string | null; designation: string | null }) {
  return u.role === "TEACHER" ? `${u.designation ?? "Teacher"}, ULAB` : `class of ${u.graduationYear}`;
}
