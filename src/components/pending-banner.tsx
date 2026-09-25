import { Hourglass } from "lucide-react";

export function PendingBanner() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold-wash px-5 py-4">
      <Hourglass size={18} className="mt-0.5 shrink-0 text-[#9a7212]" />
      <div className="text-sm">
        <p className="font-semibold text-ink">Your alumni account is being verified</p>
        <p className="mt-0.5 text-ink-soft">The alumni office is checking your student ID. You can fill in your profile now; posting jobs unlocks once you&apos;re verified.</p>
      </div>
    </div>
  );
}
