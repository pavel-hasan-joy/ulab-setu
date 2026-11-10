import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import { ButtonLink } from "./ui";
import { ThemeToggle } from "./theme";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" title={`${site.name} | ${site.universityShort} — ${site.universityTagline}`}>
      <Image src={site.logo} alt={`${site.universityShort} — ${site.universityTagline}`} width={82} height={28} priority className="h-7 w-auto dark:hidden" />
      <Image src={site.logoDark} alt="" width={82} height={28} priority className="hidden h-7 w-auto dark:block" />
      {!compact && (
        <span className="border-l border-mist pl-2.5 font-display text-lg font-semibold text-ink">Setu</span>
      )}
    </Link>
  );
}

export interface HeaderNavLink {
  id: string;
  label: string;
  href: string;
  openInNewTab?: boolean;
  enabled: boolean;
}

export function SiteHeader({ customNavLinks }: { customNavLinks?: HeaderNavLink[] }) {
  const links = customNavLinks
    ? customNavLinks.filter((l) => l.enabled)
    : [
        { id: "jobs", label: "Jobs", href: "/#jobs", openInNewTab: false, enabled: true },
        { id: "how", label: "How it works", href: "/#how", openInNewTab: false, enabled: true },
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-mist/60 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Logo />
        <nav className="flex items-center gap-1.5">
          {links.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              target={link.openInNewTab ? "_blank" : undefined}
              rel={link.openInNewTab ? "noreferrer" : undefined}
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:text-ink sm:block"
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
          <ButtonLink href="/login" variant="ghost">Log in</ButtonLink>
          <ButtonLink href="/signup">Join</ButtonLink>
        </nav>
      </div>
    </header>
  );
}
