import { getPublicFaqs } from "@/app/actions/cms";
import { SiteHeader, Logo } from "@/components/site-header";
import { Badge, Card } from "@/components/ui";
import { site } from "@/lib/site";
import { FAQ_CATEGORIES } from "@/lib/cms-phase3-types";
import { HelpCircle, ChevronDown } from "lucide-react";

export const metadata = {
  title: "Frequently Asked Questions (FAQ) · ULAB Setu",
  description: "Official answers to questions about registration, alumni verification, mentorship, job referrals, and platform features.",
};

export const dynamic = "force-dynamic";

export default async function PublicFaqsPage() {
  const faqs = await getPublicFaqs();

  // Group FAQs by category
  const grouped: Record<string, typeof faqs> = {};
  for (const f of faqs) {
    const cat = f.category || "General Support";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(f);
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-paper pb-24">
        {/* Header Hero */}
        <section className="border-b border-mist/70 bg-gradient-to-b from-sky/40 via-surface/80 to-paper py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-4 text-center md:px-6">
            <Badge tone="blue" className="mb-4">Help & Answers</Badge>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-ink-soft md:text-lg">
              Find quick, clear answers on campus registration, alumni verification, job applications, and security.
            </p>
          </div>
        </section>

        {/* Categorical FAQ Accordions */}
        <section className="mx-auto max-w-4xl px-4 py-12 md:px-6">
          {Object.keys(grouped).length === 0 ? (
            <Card className="py-16 text-center text-ink-soft">
              <HelpCircle size={40} className="mx-auto mb-3 text-ink-soft/40" />
              <h3 className="font-display text-lg font-semibold text-ink">No FAQ items published</h3>
              <p className="text-sm mt-1">Frequently asked questions will appear here shortly.</p>
            </Card>
          ) : (
            <div className="space-y-12">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-mist/70 pb-2">
                    <h2 className="font-display text-xl font-bold text-ink">{category}</h2>
                    <Badge tone="gray">{items.length}</Badge>
                  </div>

                  <div className="space-y-3">
                    {items.map((item) => (
                      <details
                        key={item.id}
                        className="group rounded-2xl border border-mist bg-surface p-5 transition-all duration-200 open:border-ulab/40 open:shadow-lift"
                      >
                        <summary className="flex cursor-pointer items-center justify-between text-base font-semibold text-ink hover:text-ulab list-none">
                          <span>{item.title}</span>
                          <span className="grid size-7 place-items-center rounded-lg bg-sky/50 text-ulab transition-transform duration-200 group-open:rotate-180">
                            <ChevronDown size={16} />
                          </span>
                        </summary>
                        <div className="mt-4 border-t border-mist/60 pt-4 text-sm leading-relaxed text-ink-soft whitespace-pre-line">
                          {item.body}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-mist/70 bg-surface/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-ink-soft md:px-6">
          <Logo />
          <p>
            A community project for <a href={site.universityUrl} className="underline decoration-mist underline-offset-4 hover:text-ulab" target="_blank" rel="noreferrer">{site.university}</a> — {site.universityTagline}.
          </p>
        </div>
      </footer>
    </>
  );
}

