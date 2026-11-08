"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Briefcase, FileText, GraduationCap, Home, LogOut, Megaphone, MessageCircle, MessageSquare, PlusCircle, ShieldCheck, User, Users, BarChart3, BookOpen, Bell, LifeBuoy, Compass,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Logo } from "./site-header";
import { ThemeToggle } from "./theme";
import { Avatar, cn } from "./ui";

const icons = { Home, Briefcase, Users, MessageCircle, MessageSquare, User, FileText, PlusCircle, ShieldCheck, Megaphone, BarChart3, GraduationCap, BookOpen, Bell, LifeBuoy, Compass };
export type NavItem = { href: string; label: string; icon: keyof typeof icons; badge?: number };

export function AppShell({
  nav, user, children, tone,
}: {
  nav: NavItem[];
  user: { name: string; subtitle: string; image?: string | null };
  tone: "student" | "alumni" | "teacher" | "admin";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // The most specific matching link wins, so /alumni/jobs/new doesn't also light up /alumni/jobs.
  const activeHref = nav
    .filter((n) => pathname === n.href || pathname.startsWith(`${n.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const isActive = (href: string) => href === activeHref;
  const profileHref = nav.find((n) => n.icon === "User")?.href;

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[250px_1fr]">
      {/* Sidebar (desktop) */}
      <aside data-sidebar className="sticky top-0 hidden h-dvh max-h-dvh flex-col overflow-hidden border-r border-mist/70 bg-surface/70 px-3 py-4 backdrop-blur md:flex">
        {/* Brand Header */}
        <div className="flex shrink-0 items-center justify-between px-2">
          <Logo />
          <ThemeToggle />
        </div>

        {/* Scrollable Navigation Area */}
        <div className="mt-3 flex flex-1 min-h-0 flex-col overflow-y-auto overscroll-contain pr-1 scrollbar-thin">
          <p className={cn("mx-2 mb-2 w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
            tone === "alumni" ? "bg-gold-wash text-gold-ink" : tone === "admin" || tone === "teacher" ? "bg-lilac-wash text-lilac-ink" : "bg-sky text-ulab-deep")}>
            {tone === "alumni" ? "Alumni space" : tone === "teacher" ? "Teacher space" : tone === "admin" ? "Alumni office" : "Student space"}
          </p>
          <nav className="space-y-1 pb-2">
            {nav.map((item) => {
              const Icon = icons[item.icon];
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} className={cn("relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors", active ? "text-ulab-deep font-semibold" : "text-ink-soft hover:text-ink hover:bg-paper/60")}>
                  {active && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-xl bg-sky" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                  <Icon size={18} className="relative shrink-0" />
                  <span className="relative truncate">{item.label}</span>
                  {!!item.badge && <span className="relative ml-auto shrink-0 rounded-full bg-gold px-1.5 py-0.2 text-[11px] font-semibold text-white">{item.badge}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card Docked at Bottom */}
        <div className="mt-auto shrink-0 border-t border-mist/60 pt-3">
          <div className="flex items-center gap-3 rounded-2xl border border-mist/70 bg-surface p-2.5 shadow-2xs">
            <Avatar name={user.name} size={36} src={user.image} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{user.name}</p>
              <p className="truncate text-[11px] text-ink-soft">{user.subtitle}</p>
            </div>
            <form action={logout}>
              <button className="rounded-lg p-2 text-ink-soft transition hover:bg-rose-wash hover:text-rose" aria-label="Log out"><LogOut size={16} /></button>
            </form>
          </div>
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-mist/70 bg-paper/85 px-4 backdrop-blur md:hidden">
        <Logo />
        <div className="flex items-center">
          <ThemeToggle />
          {profileHref && (
            <Link href={profileHref} aria-label="Your profile" className="p-1.5">
              <Avatar name={user.name} size={30} src={user.image} />
            </Link>
          )}
          <form action={logout}>
            <button className="rounded-lg p-2 text-ink-soft" aria-label="Log out"><LogOut size={18} /></button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-6 md:px-10 md:pb-16 md:pt-10">{children}</main>

      {/* Bottom nav (mobile) */}
      <nav data-bottom-nav style={{ bottom: "calc(env(safe-area-inset-bottom) + 12px)" }} className="fixed inset-x-3 z-40 flex justify-around rounded-2xl border border-mist bg-surface/95 p-1.5 shadow-lift backdrop-blur md:hidden">
        {nav.slice(0, 5).map((item) => {
          const Icon = icons[item.icon];
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} className={cn("relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium", active ? "text-ulab-deep" : "text-ink-soft")}>
              {active && <motion.span layoutId="nav-active-m" className="absolute inset-0 rounded-xl bg-sky" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <Icon size={19} className="relative" />
              <span className="relative">{item.label}</span>
              {!!item.badge && <span className="absolute right-3 top-1 size-2 rounded-full bg-gold" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
