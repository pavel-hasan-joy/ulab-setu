import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import { ButtonLink } from "./ui";
import { ThemeToggle } from "./theme";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <Image src={site.logo} alt={site.universityShort} width={72} height={26} priority className="h-7 w-auto dark:hidden" />
      <Image src={site.logoDark} alt="" width={72} height={26} priority className="hidden h-7 w-auto dark:block" />
      {!compact && (
        <span className="border-l border-mist pl-2.5 font-display text-lg font-semibold text-ink">Setu</span>
      )}
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-mist/60 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Logo />
        <nav className="flex items-center gap-1.5">
          <Link href="/#jobs" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:text-ink sm:block">Jobs</Link>
          <Link href="/#how" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:text-ink sm:block">How it works</Link>
          <ThemeToggle />
          <ButtonLink href="/login" variant="ghost">Log in</ButtonLink>
          <ButtonLink href="/signup">Join</ButtonLink>
        </nav>
      </div>
    </header>
  );
}
