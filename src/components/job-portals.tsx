import { ArrowUpRight } from "lucide-react";
import { jobPortals } from "@/lib/site";
import { HoverLift, Stagger, StaggerItem } from "./motion";
import { Card } from "./ui";

/** Links to other job sites. Each opens in a new tab. */
export function JobPortals({ title = "Other job sites", compact = false }: { title?: string; compact?: boolean }) {
  return (
    <section aria-label="Other job sites">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-ink-soft">Browse these directly. Each one opens in a new tab.</p>
      </div>
      <Stagger className={compact ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" : "grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5"}>
        {jobPortals.map((p) => (
          <StaggerItem key={p.name}>
            <HoverLift className="h-full">
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="group block h-full">
                <Card className="flex h-full flex-col p-4 transition-shadow group-hover:shadow-lift">
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid size-9 place-items-center rounded-xl bg-sky font-display text-sm font-bold text-ulab-deep">
                      {p.name.slice(0, 2)}
                    </span>
                    <ArrowUpRight size={16} className="text-ink-soft transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ulab" />
                  </div>
                  <p className="mt-3 font-semibold leading-tight group-hover:text-ulab-deep">{p.name}</p>
                  <p className="mt-1 text-xs leading-snug text-ink-soft">{p.about}</p>
                  <p className="mt-auto pt-3 text-[11px] text-ink-soft/80">{new URL(p.url).hostname.replace(/^www\./, "")}</p>
                </Card>
              </a>
            </HoverLift>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
