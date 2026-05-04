import { BookOpen, CodeXml } from "lucide-react";
import { toneToColor, uiColors, useCases } from "./developer-content";
import { DeveloperApiSurface } from "./DeveloperApiSurface";
import { DeveloperCodeExamples } from "./DeveloperCodeExamples";

const { border, panelBackground, mutedText, dimText } = uiColors;

const handleExploreClick = () => {
  document
    .getElementById("api-surface")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
};

export const DeveloperPage = () => (
  <div
    className="min-h-screen"
    style={{ background: uiColors.shellBackground, color: "var(--foreground)" }}
  >
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-10 border-b pb-8" style={{ borderColor: border }}>
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center border"
            style={{
              borderColor: "color-mix(in srgb, var(--primary) 35%, transparent)",
              background: "color-mix(in srgb, var(--primary) 8%, transparent)",
            }}
          >
            <CodeXml className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-mono text-xl font-bold text-foreground">Developer</h1>
            <p className="font-mono text-[10px]" style={{ color: dimText }}>
              <span>NULL://API · </span>
              <span>Public Surface</span>
            </p>
          </div>
        </div>

        <p
          className="max-w-2xl font-mono text-sm leading-relaxed"
          style={{ color: mutedText }}
        >
          Build small integrations with your public data. Interis exposes a
          simple public API for profile data, top picks, recent activity,
          reviews, watchlist, diary entries, and more. Use it for personal
          sites, widgets, automations, and portfolio pages.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExploreClick}
            className="flex items-center gap-1.5 border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors"
            style={{
              borderColor: "color-mix(in srgb, var(--primary) 40%, transparent)",
              color: "var(--primary)",
              background: "color-mix(in srgb, var(--primary) 9%, transparent)",
            }}
          >
            <BookOpen className="h-3 w-3" />
            <span>Explore Public Data</span>
          </button>

          <a
            href="https://docs.interis.gorkemkaryol.dev"
            target="_blank"
            rel="noreferrer"
            className="border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors hover:text-foreground"
            style={{ borderColor: border, color: dimText }}
          >
            Open Full Docs
          </a>
        </div>
      </header>

      <section className="mb-10">
        <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
          / What You Can Do
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {useCases.map((item) => {
            const Icon = item.icon;
            const toneColor = toneToColor[item.tone];
            return (
              <article
                key={item.title}
                className="flex items-start gap-4 border p-4"
                style={{ borderColor: border, background: panelBackground }}
              >
                <div
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border"
                  style={{
                    borderColor: "color-mix(in srgb, var(--border) 86%, transparent)",
                    background: `color-mix(in srgb, ${toneColor} 10%, transparent)`,
                  }}
                >
                  <Icon className="h-4 w-4" style={{ color: toneColor }} />
                </div>
                <div className="min-w-0">
                  <h2 className="mb-1 font-mono text-xs font-semibold text-foreground">
                    {item.title}
                  </h2>
                  <p
                    className="font-mono text-[10px] leading-relaxed"
                    style={{ color: mutedText }}
                  >
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
        <div
          className="flex flex-col items-start gap-5 border p-6 sm:flex-row sm:items-center"
          style={{ borderColor: border, background: panelBackground }}
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center border"
            style={{
              borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
              background: "color-mix(in srgb, var(--accent) 7%, transparent)",
            }}
          >
            <BookOpen className="h-5 w-5" style={{ color: "var(--accent)" }} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="mb-1 font-mono text-sm font-bold text-foreground">Full Docs</h2>
            <p
              className="font-mono text-[10px] leading-relaxed"
              style={{ color: mutedText }}
            >
              The complete API documentation is available at
              docs.interis.gorkemkaryol.dev with endpoint reference, response
              notes, and practical examples.
            </p>
          </div>

          <a
            href="https://docs.interis.gorkemkaryol.dev"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em]"
            style={{
              borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
              color: "color-mix(in srgb, var(--accent) 58%, transparent)",
              background: "color-mix(in srgb, var(--accent) 4%, transparent)",
            }}
          >
            Open Docs
          </a>
        </div>
      </section>
    </div>
  </div>
);
