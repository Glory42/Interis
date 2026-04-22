import { useEffect, useState } from "react";
import { BookOpen, Check, ChevronRight, CodeXml, Copy } from "lucide-react";
import {
  codeExamples,
  publicSurface,
  toneToColor,
  uiColors,
  useCases,
} from "./developer-content";

const {
  border,
  rowBorder,
  shellBackground,
  panelBackground,
  mutedText,
  dimText,
} = uiColors;

export const DeveloperPage = () => {
  const [activeExampleIndex, setActiveExampleIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeExample = codeExamples[activeExampleIndex] ?? codeExamples[0];

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timeoutId = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const handleExploreClick = () => {
    document
      .getElementById("api-surface")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCopyCode = async () => {
    if (!navigator.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(activeExample.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: shellBackground, color: "var(--foreground)" }}
    >
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-10 border-b pb-8" style={{ borderColor: border }}>
          <div className="mb-4 flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center border"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--primary) 35%, transparent)",
                background:
                  "color-mix(in srgb, var(--primary) 8%, transparent)",
              }}
            >
              <CodeXml className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-mono text-xl font-bold text-foreground">
                Developer
              </h1>
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
                borderColor:
                  "color-mix(in srgb, var(--primary) 40%, transparent)",
                color: "var(--primary)",
                background:
                  "color-mix(in srgb, var(--primary) 9%, transparent)",
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
                      borderColor:
                        "color-mix(in srgb, var(--border) 86%, transparent)",
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

        <section id="api-surface" className="mb-10">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            / Public API Surface
          </p>
          <p className="mb-5 font-mono text-[10px]" style={{ color: dimText }}>
            Response size depends on user data. Empty collections return
            <code
              className="mx-1 px-1"
              style={{
                color: "var(--module-cinema)",
                background:
                  "color-mix(in srgb, var(--foreground) 6%, transparent)",
              }}
            >
              []
            </code>
            .
          </p>

          <div
            className="overflow-hidden border"
            style={{ borderColor: border }}
          >
            <div
              className="grid grid-cols-[1fr_auto] gap-0 border-b px-4 py-2 sm:grid-cols-[auto_1fr]"
              style={{ borderColor: border, background: panelBackground }}
            >
              <span
                className="font-mono text-[9px] uppercase tracking-[0.18em]"
                style={{ color: dimText }}
              >
                / Endpoint
              </span>
              <span
                className="hidden font-mono text-[9px] uppercase tracking-[0.18em] sm:block"
                style={{ color: dimText }}
              >
                / Description
              </span>
            </div>

            {publicSurface.map((endpoint, index) => (
              <div
                key={endpoint.path}
                className="group flex flex-col gap-1 border-b px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-6"
                style={{
                  borderColor: rowBorder,
                  background:
                    index % 2
                      ? "color-mix(in srgb, var(--primary) 4%, transparent)"
                      : "transparent",
                }}
              >
                <div className="flex min-w-0 shrink-0 items-center gap-2 sm:w-80">
                  <ChevronRight
                    className="h-3 w-3 shrink-0"
                    style={{ color: "var(--module-cinema)" }}
                  />
                  <code
                    className="truncate font-mono text-[10px]"
                    style={{ color: "var(--primary)" }}
                  >
                    {endpoint.path}
                  </code>
                </div>
                <p
                  className="flex-1 font-mono text-[10px] leading-relaxed"
                  style={{ color: mutedText }}
                >
                  {endpoint.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            / Mini Examples
          </p>
          <div className="border" style={{ borderColor: border }}>
            <div
              className="no-scrollbar flex overflow-x-auto border-b"
              style={{ borderColor: border, background: panelBackground }}
            >
              {codeExamples.map((example, index) => {
                const isActive = index === activeExampleIndex;

                return (
                  <button
                    key={example.title}
                    type="button"
                    onClick={() => {
                      setActiveExampleIndex(index);
                      setCopied(false);
                    }}
                    className="shrink-0 whitespace-nowrap border-b-2 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] transition-all"
                    style={{
                      borderBottomColor: isActive
                        ? "var(--primary)"
                        : "transparent",
                      color: isActive ? "var(--primary)" : dimText,
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <CodeXml className="h-3 w-3 shrink-0" />
                      <span>{example.title}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              className="px-5 py-4"
              style={{
                background: "color-mix(in srgb, var(--background) 68%, black)",
              }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em]"
                    style={{
                      borderColor:
                        "color-mix(in srgb, var(--primary) 25%, transparent)",
                      color: "var(--primary)",
                      background:
                        "color-mix(in srgb, var(--primary) 6%, transparent)",
                    }}
                  >
                    {activeExample.language}
                  </span>
                  <span
                    className="truncate font-mono text-[9px]"
                    style={{ color: dimText }}
                  >
                    {activeExample.title}
                  </span>
                </div>

                <button
                  type="button"
                  aria-label="Copy code"
                  onClick={handleCopyCode}
                  className="flex shrink-0 items-center gap-1 border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] transition-all"
                  style={{
                    borderColor: border,
                    color: copied ? "var(--module-cinema)" : dimText,
                    background: copied
                      ? "color-mix(in srgb, var(--module-cinema) 8%, transparent)"
                      : "transparent",
                  }}
                >
                  {copied ? (
                    <Check className="h-2.5 w-2.5" />
                  ) : (
                    <Copy className="h-2.5 w-2.5" />
                  )}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>

              <pre
                className="overflow-x-auto font-mono text-[11px] leading-relaxed"
                style={{
                  color:
                    "color-mix(in srgb, var(--foreground) 74%, var(--module-cinema) 26%)",
                  tabSize: 2,
                }}
              >
                <code>{activeExample.code}</code>
              </pre>
            </div>
          </div>
        </section>

        <section>
          <div
            className="flex flex-col items-start gap-5 border p-6 sm:flex-row sm:items-center"
            style={{ borderColor: border, background: panelBackground }}
          >
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center border"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--accent) 30%, transparent)",
                background: "color-mix(in srgb, var(--accent) 7%, transparent)",
              }}
            >
              <BookOpen
                className="h-5 w-5"
                style={{ color: "var(--accent)" }}
              />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="mb-1 font-mono text-sm font-bold text-foreground">
                Full Docs
              </h2>
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
                borderColor:
                  "color-mix(in srgb, var(--accent) 25%, transparent)",
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
};
