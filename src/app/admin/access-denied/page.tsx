import Link from "next/link";
import { ShieldAlert, ArrowLeft, LayoutDashboard } from "lucide-react";
import { ButtonLink, Card } from "@/components/ui";

export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams?: Promise<{ denied?: string }>;
}) {
  const params = await searchParams;
  const deniedPermission = params?.denied;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md p-8 text-center shadow-lift">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-wash text-rose">
          <ShieldAlert size={28} />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">Access Restricted</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Your administrative sub-role does not have permission to view or manage this section
          {deniedPermission ? ` (${deniedPermission})` : ""}.
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          If you require access, please contact the institutional Super Admin.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href="/admin" variant="outline" className="gap-2">
            <LayoutDashboard size={15} /> Dashboard
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
