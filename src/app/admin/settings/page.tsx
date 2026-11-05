import {
  Settings,
  ShieldCheck,
  Mail,
  Server,
  Lock,
  Database,
  Globe,
} from "lucide-react";
import { requireAdminPermission } from "@/lib/admin-auth";
import { PageIn } from "@/components/motion";
import { Badge, Card, PageHeader } from "@/components/ui";

export default async function AdminSettingsPage() {
  await requireAdminPermission("settings:manage");

  return (
    <PageIn>
      <PageHeader
        title="System Settings & Infrastructure Policy"
        description="Configuration parameters, institutional domain enforcement, and authentication security policies."
      />

      <div className="space-y-6">
        {/* Domain & Verification Policy Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-mist/70 pb-4 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-ulab/10 p-2 text-ulab">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold text-ink">Institutional Email & Verification Policy</h3>
                <p className="text-xs text-ink-soft">Domain enforcement for user registration and authentication.</p>
              </div>
            </div>
            <Badge tone="sage">Active & Enforced</Badge>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-mist/80 bg-paper/60 p-4 dark:border-white/5 dark:bg-white/5">
              <span className="text-xs text-ink-soft">Authorized Email Domain</span>
              <p className="mt-1 font-mono text-base font-bold text-ink">@ulab.edu.bd</p>
              <p className="mt-1 text-[11px] text-ink-soft">
                All external and personal domains (Gmail, Yahoo, etc.) are strictly rejected.
              </p>
            </div>

            <div className="rounded-2xl border border-mist/80 bg-paper/60 p-4 dark:border-white/5 dark:bg-white/5">
              <span className="text-xs text-ink-soft">Alumni Auto-Verification Policy</span>
              <p className="mt-1 font-mono text-base font-bold text-emerald-700 dark:text-emerald-400">
                Zero-Delay Auto-Approval
              </p>
              <p className="mt-1 text-[11px] text-ink-soft">
                Alumni with verified @ulab.edu.bd emails are automatically verified upon OTP confirmation.
              </p>
            </div>
          </div>
        </Card>

        {/* Security & Cryptography Policy */}
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-mist/70 pb-4 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-sky p-2 text-ulab-deep dark:bg-sky/20">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold text-ink">Authentication & Credential Security</h3>
                <p className="text-xs text-ink-soft">Session cryptography, rate limiting, and access control.</p>
              </div>
            </div>
            <Badge tone="blue">Enterprise Grade</Badge>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-mist/80 bg-paper/60 p-4 dark:border-white/5 dark:bg-white/5">
              <span className="text-xs text-ink-soft">Session Token Format</span>
              <p className="mt-1 font-mono text-sm font-bold text-ink">Stateless JWT (HS256)</p>
              <p className="mt-1 text-[11px] text-ink-soft">HTTP-only cookie with 7-day sliding expiration.</p>
            </div>

            <div className="rounded-2xl border border-mist/80 bg-paper/60 p-4 dark:border-white/5 dark:bg-white/5">
              <span className="text-xs text-ink-soft">Login Rate Limiting</span>
              <p className="mt-1 font-mono text-sm font-bold text-ink">5 Attempts / 15 Mins</p>
              <p className="mt-1 text-[11px] text-ink-soft">Temporary lockout protects against brute-force attacks.</p>
            </div>

            <div className="rounded-2xl border border-mist/80 bg-paper/60 p-4 dark:border-white/5 dark:bg-white/5">
              <span className="text-xs text-ink-soft">Password Hashing</span>
              <p className="mt-1 font-mono text-sm font-bold text-ink">Bcrypt (10 Salt Rounds)</p>
              <p className="mt-1 text-[11px] text-ink-soft">Salted cryptographic one-way password hashing.</p>
            </div>
          </div>
        </Card>

        {/* Infrastructure & Email Delivery Gateway */}
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-mist/70 pb-4 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-50 p-2 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                <Server size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold text-ink">Backend & Database Infrastructure</h3>
                <p className="text-xs text-ink-soft">PostgreSQL runtime and mail server gateways.</p>
              </div>
            </div>
            <Badge tone="lilac">Connected</Badge>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-mist/80 bg-paper/60 p-4 dark:border-white/5 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-ulab" />
                <span className="text-xs font-bold text-ink">PostgreSQL via Prisma ORM 6</span>
              </div>
              <p className="mt-2 text-xs text-ink-soft">
                Relational schema with 20 models, composite indexes, soft-deletion timestamps, and Row-Level Security.
              </p>
            </div>

            <div className="rounded-2xl border border-mist/80 bg-paper/60 p-4 dark:border-white/5 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-gold-ink" />
                <span className="text-xs font-bold text-ink">SMTP / Resend Email Delivery</span>
              </div>
              <p className="mt-2 text-xs text-ink-soft">
                Automated 6-digit OTP delivery for registration and password reset with 10-minute expiry windows.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </PageIn>
  );
}

