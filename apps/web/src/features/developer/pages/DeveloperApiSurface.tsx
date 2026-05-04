import { ChevronRight } from "lucide-react";
import { publicSurface, uiColors } from "./developer-content";

const { border, rowBorder, panelBackground, mutedText, dimText } = uiColors;

export const DeveloperApiSurface = () => (
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
          background: "color-mix(in srgb, var(--foreground) 6%, transparent)",
        }}
      >
        []
      </code>
      .
    </p>

    <div className="overflow-hidden border" style={{ borderColor: border }}>
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
);
