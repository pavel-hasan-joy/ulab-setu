import { Logo } from "@/components/site-header";
import { BridgeHero } from "@/components/bridge-hero";
import { site } from "@/lib/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_0.9fr]">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-sky to-gold-wash/70 lg:flex lg:flex-col lg:justify-center lg:p-12">
        <div className="dots absolute inset-0 opacity-70" />
        <div className="relative">
          <BridgeHero />
          <p className="mx-auto mt-6 max-w-sm text-center font-display text-xl font-medium text-ink">{site.tagline}</p>
        </div>
      </aside>
    </div>
  );
}
