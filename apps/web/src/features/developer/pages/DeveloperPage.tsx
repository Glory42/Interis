import { BookOpen, CodeXml } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toneToColor, useCases } from "./developer-content";
import { DeveloperApiSurface } from "./DeveloperApiSurface";
import { DeveloperCodeExamples } from "./DeveloperCodeExamples";

const DOCS_URL = "https://docs.interis.gorkemkaryol.dev";

const handleExploreClick = () => {
  document
    .getElementById("api-surface")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
};

export const DeveloperPage = () => (
  <div className="developer-shell min-h-screen">
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <header className="animate-fade-up mb-12 border-b developer-shell-border pb-10">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
            <CodeXml className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Developer
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="primary">Public API</Badge>
              <Badge variant="muted">Read-only</Badge>
            </div>
          </div>
        </div>

        <p className="max-w-2xl text-sm leading-relaxed developer-shell-muted">
          Build small integrations with your public data. Interis exposes a
          simple public API for profile data, top picks, recent activity,
          reviews, watchlist, diary entries, and more. Use it for personal
          sites, widgets, automations, and portfolio pages.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" onClick={handleExploreClick}>
            <BookOpen className="h-3.5 w-3.5" />
            Explore Public Data
          </Button>

          <Button variant="outline" asChild>
            <a href={DOCS_URL} target="_blank" rel="noreferrer">
              Open Full Docs
            </a>
          </Button>
        </div>
      </header>

      <section className="mb-12">
        <h2 className="mb-5 text-lg font-semibold tracking-tight text-foreground">
          What you can do
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {useCases.map((item) => {
            const Icon = item.icon;
            const toneColor = toneToColor[item.tone];
            return (
              <article
                key={item.title}
                className="flex items-start gap-4 rounded-2xl border developer-shell-border developer-shell-panel p-4"
              >
                <div
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/70"
                  style={{ background: `color-mix(in srgb, ${toneColor} 12%, transparent)` }}
                >
                  <Icon className="h-4 w-4" style={{ color: toneColor }} />
                </div>
                <div className="min-w-0">
                  <h3 className="mb-1 text-sm font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed developer-shell-muted">
                    {item.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <DeveloperApiSurface />
      <DeveloperCodeExamples />

      <section>
        <div className="flex flex-col items-start gap-5 rounded-2xl border developer-shell-border developer-shell-panel p-6 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10">
            <BookOpen className="h-5 w-5 text-accent" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="mb-1 text-base font-semibold text-foreground">Full docs</h2>
            <p className="text-sm leading-relaxed developer-shell-muted">
              The complete API documentation is available at{" "}
              <span className="text-foreground">docs.interis.gorkemkaryol.dev</span>{" "}
              with endpoint reference, response notes, and practical examples.
            </p>
          </div>

          <Button variant="outline" asChild className="shrink-0">
            <a href={DOCS_URL} target="_blank" rel="noreferrer">
              Open Docs
            </a>
          </Button>
        </div>
      </section>
    </div>
  </div>
);
