import { requireAdminPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { getSystemSettings } from "@/lib/settings";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import { AdminSystemSettingsView } from "@/components/admin-system-settings-view";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdminPermission("settings:manage");

  const [settingsMap, latestSetting] = await Promise.all([
    getSystemSettings(),
    db.systemSetting.findFirst({
      orderBy: { updatedAt: "desc" },
      include: {
        updatedBy: {
          select: { name: true, email: true },
        },
      },
    }),
  ]);

  return (
    <PageIn>
      <PageHeader
        title="System Settings & Governance Policy"
        description="Configure institutional branding, domain enforcement, privacy controls, role permissions, and security thresholds in real time."
      />

      <div className="mt-6">
        <AdminSystemSettingsView
          initialSettings={settingsMap}
          lastUpdated={latestSetting?.updatedAt ? latestSetting.updatedAt.toISOString() : null}
          updatedByName={latestSetting?.updatedBy?.name ?? null}
        />
      </div>
    </PageIn>
  );
}
