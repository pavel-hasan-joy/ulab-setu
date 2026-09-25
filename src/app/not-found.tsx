import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="dots grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="font-display text-7xl font-semibold text-sky">404</p>
        <h1 className="mt-2 text-2xl font-semibold">This page doesn&apos;t exist</h1>
        <p className="mt-2 text-ink-soft">The link may be old, or the job was removed.</p>
        <ButtonLink href="/" className="mt-6">Go to home</ButtonLink>
      </div>
    </div>
  );
}
