"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Briefcase,
  FileText,
  AlertTriangle,
  Compass,
  LifeBuoy,
  Bell,
  BarChart3,
  Shield,
  Settings,
  History,
  Menu,
  X,
  Search,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { ThemeToggle } from "./theme";
import { Avatar, Badge, cn } from "./ui";
import { SUB_ROLE_LABELS, type AdminSubRole, type AdminPermission, ROLE_PERMISSIONS } from "@/lib/admin-permissions";

export type AdminBadgeCounts = {
  pendingReports?: number;
  openTickets?: number;
  pendingMentorship?: number;
  pendingApprovals?: number;
};

type AdminShellProps = {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    subRole: AdminSubRole;
  };
  badgeCounts?: AdminBadgeCounts;
  children: React.ReactNode;
};

const navSections = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:view" as AdminPermission },
    ],
  },
  {
    title: "User & Community",
    items: [
      { href: "/admin/users", label: "User Management", icon: Users, permission: "users:manage" as AdminPermission },
      { href: "/admin/alumni", label: "Alumni Directory", icon: GraduationCap, permission: "alumni:manage" as AdminPermission },
    ],
  },
  {
    title: "Career & Employment",
    items: [
      { href: "/admin/jobs", label: "Job Management", icon: Briefcase, permission: "jobs:manage" as AdminPermission },
      { href: "/admin/applications", label: "Job Applications", icon: FileText, permission: "applications:view" as AdminPermission },
    ],
  },
  {
    title: "Trust, Mentorship & Support",
    items: [
      {
        href: "/admin/reports",
        label: "Messages & Reports",
        icon: AlertTriangle,
        permission: "reports:manage" as AdminPermission,
        badgeKey: "pendingReports" as const,
      },
      {
        href: "/admin/mentorship",
        label: "Mentorship",
        icon: Compass,
        permission: "mentorship:view" as AdminPermission,
        badgeKey: "pendingMentorship" as const,
      },
      {
        href: "/admin/tickets",
        label: "Support Tickets",
        icon: LifeBuoy,
        permission: "tickets:manage" as AdminPermission,
        badgeKey: "openTickets" as const,
      },
      {
        href: "/admin/notifications",
        label: "Notifications",
        icon: Bell,
        permission: "notifications:manage" as AdminPermission,
      },
    ],
  },
  {
    title: "Insights & Governance",
    items: [
      { href: "/admin/analytics", label: "Analytics & Reports", icon: BarChart3, permission: "analytics:view" as AdminPermission },
      { href: "/admin/admins", label: "Admin Management", icon: Shield, permission: "admins:manage" as AdminPermission },
      { href: "/admin/settings", label: "System Settings", icon: Settings, permission: "settings:manage" as AdminPermission },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: History, permission: "audit:view" as AdminPermission },
    ],
  },
];

export function AdminShell({ user, badgeCounts, children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const roleMeta = SUB_ROLE_LABELS[user.subRole] || { label: "Administrator", tone: "blue" };
  const allowedPermissions = ROLE_PERMISSIONS[user.subRole] || [];

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Derived breadcrumbs
  const getBreadcrumbs = () => {
    if (pathname === "/admin") return ["Admin", "Dashboard"];
    const segments = pathname.replace("/admin/", "").split("/");
    const mapped = segments.map((s) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
    return ["Admin", ...mapped];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-[#0c121e] md:grid md:grid-cols-[270px_1fr]">
      {/* =========================================================================
          DESKTOP SIDEBAR
      ========================================================================= */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-mist/80 bg-surface/80 backdrop-blur-md dark:border-white/10 dark:bg-[#0f172a]/80 md:flex">
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-mist/70 px-5 dark:border-white/10">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-ulab-deep to-ulab text-white shadow-soft">
              <ShieldCheck size={20} />
            </div>
            <div>
              <span className="font-display text-base font-bold tracking-tight text-ink">ULAB Setu</span>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-gold-ink">
                Admin Console
              </span>
            </div>
          </Link>
          <ThemeToggle />
        </div>

        {/* Admin Sub-Role Identification */}
        <div className="border-b border-mist/60 px-5 py-3 dark:border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-soft">Privilege Level:</span>
            <Badge tone={roleMeta.tone} className="px-2 py-0.5 text-[11px] font-semibold">
              {roleMeta.label}
            </Badge>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) =>
              allowedPermissions.includes(item.permission)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title}>
                <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-ink-soft/70 dark:text-ink-soft/50">
                  {section.title}
                </h4>
                <div className="mt-1.5 space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive =
                      item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const count = item.badgeKey ? badgeCounts?.[item.badgeKey] : undefined;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                          isActive
                            ? "bg-ulab-deep text-white shadow-sm dark:bg-ulab"
                            : "text-ink-soft hover:bg-paper hover:text-ink dark:hover:bg-white/5"
                        )}
                      >
                        <item.icon
                          size={16}
                          className={cn(
                            "transition-colors",
                            isActive ? "text-white" : "text-ink-soft/80 group-hover:text-ink"
                          )}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                        {typeof count === "number" && count > 0 && (
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-rose/10 text-rose dark:bg-rose/20 dark:text-rose-300"
                            )}
                          >
                            {count}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Admin Account & Sign Out */}
        <div className="border-t border-mist/80 p-3.5 dark:border-white/10">
          <div className="flex items-center gap-3 rounded-2xl border border-mist/60 bg-paper/60 p-2.5 dark:border-white/5 dark:bg-white/5">
            <Avatar name={user.name} size={36} src={user.image} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-ink">{user.name}</p>
              <p className="truncate text-[11px] text-ink-soft">{user.email}</p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                aria-label="Log out"
                title="Log out of Admin Portal"
                className="rounded-xl p-1.5 text-ink-soft transition hover:bg-rose-wash hover:text-rose"
              >
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MAIN CONTAINER WITH HEADER & CONTENT
      ========================================================================= */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-mist/80 bg-paper/90 px-4 backdrop-blur-md dark:border-white/10 dark:bg-[#0c121e]/90 md:px-8">
          {/* Mobile Toggle & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open Admin Menu"
              className="rounded-xl border border-mist/80 p-2 text-ink-soft transition hover:bg-surface md:hidden dark:border-white/10"
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
              {breadcrumbs.map((crumb, idx) => (
                <div key={crumb} className="flex items-center gap-1.5">
                  {idx > 0 && <ChevronRight size={13} className="text-mist" />}
                  <span
                    className={cn(
                      idx === breadcrumbs.length - 1
                        ? "font-bold text-ink"
                        : "hover:text-ink transition"
                    )}
                  >
                    {crumb}
                  </span>
                </div>
              ))}
            </nav>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                type="search"
                placeholder="Quick search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8.5 w-44 rounded-xl border border-mist/80 bg-surface pl-8 pr-3 text-xs text-ink placeholder:text-ink-soft/60 focus:w-60 focus:border-ulab focus:outline-none transition-all dark:border-white/10 dark:bg-white/5"
              />
            </div>

            {/* Notification Badge Shortcut */}
            <Link
              href="/admin/notifications"
              className="relative rounded-xl border border-mist/80 p-2 text-ink-soft transition hover:bg-surface hover:text-ink dark:border-white/10"
              title="System Notifications"
            >
              <Bell size={16} />
              {(badgeCounts?.openTickets || 0) + (badgeCounts?.pendingReports || 0) > 0 && (
                <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-rose animate-pulse" />
              )}
            </Link>

            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            <div className="hidden items-center gap-2 border-l border-mist/70 pl-3 md:flex dark:border-white/10">
              <Avatar name={user.name} size={30} src={user.image} />
              <div className="text-left">
                <p className="text-xs font-semibold leading-tight">{user.name.split(" ")[0]}</p>
                <span className="text-[10px] text-ink-soft">{roleMeta.label}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* =========================================================================
          MOBILE SLIDE-OVER DRAWER
      ========================================================================= */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-ink/50 backdrop-blur-xs"
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="relative z-10 flex h-full w-4/5 max-w-xs flex-col border-r border-mist bg-surface p-4 shadow-lift dark:border-white/10 dark:bg-[#0f172a]"
            >
              <div className="flex items-center justify-between border-b border-mist/70 pb-3 dark:border-white/10">
                <span className="font-display font-bold text-ink">ULAB Admin</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-1.5 text-ink-soft"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="my-2 flex items-center justify-between px-1">
                <span className="text-xs text-ink-soft">Sub-Role:</span>
                <Badge tone={roleMeta.tone}>{roleMeta.label}</Badge>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto py-3 space-y-4">
                {navSections.map((section) => {
                  const visibleItems = section.items.filter((item) =>
                    allowedPermissions.includes(item.permission)
                  );
                  if (visibleItems.length === 0) return null;

                  return (
                    <div key={section.title}>
                      <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-ink-soft/70">
                        {section.title}
                      </p>
                      <div className="mt-1 space-y-0.5">
                        {visibleItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium",
                              pathname === item.href
                                ? "bg-ulab-deep text-white"
                                : "text-ink-soft hover:bg-paper hover:text-ink"
                            )}
                          >
                            <item.icon size={16} />
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-mist/70 pt-3 dark:border-white/10">
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose/30 bg-rose-wash p-2.5 text-xs font-semibold text-rose"
                  >
                    <LogOut size={14} /> Log Out
                  </button>
                </form>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
