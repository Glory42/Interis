import { useEffect, useState } from "react";
import { Check, CodeXml, Copy } from "lucide-react";
import { codeExamples, uiColors } from "./developer-content";

const { border, panelBackground, dimText } = uiColors;

export const DeveloperCodeExamples = () => {
  const [activeExampleIndex, setActiveExampleIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeExample = codeExamples[activeExampleIndex] ?? codeExamples[0];

  useEffect(() => {
    if (!copied) return;
    const timeoutId = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const handleCopyCode = async () => {
    if (!navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(activeExample.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
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
                  borderBottomColor: isActive ? "var(--primary)" : "transparent",
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
          style={{ background: "color-mix(in srgb, var(--background) 68%, black)" }}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em]"
                style={{
                  borderColor: "color-mix(in srgb, var(--primary) 25%, transparent)",
                  color: "var(--primary)",
                  background: "color-mix(in srgb, var(--primary) 6%, transparent)",
                }}
              >
                {activeExample.language}
              </span>
              <span className="truncate font-mono text-[9px]" style={{ color: dimText }}>
                {activeExample.title}
              </span>
            </div>

            <button
              type="button"
              aria-label="Copy code"
              onClick={() => { void handleCopyCode(); }}
              className="flex shrink-0 items-center gap-1 border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] transition-all"
              style={{
                borderColor: border,
                color: copied ? "var(--module-cinema)" : dimText,
                background: copied
                  ? "color-mix(in srgb, var(--module-cinema) 8%, transparent)"
                  : "transparent",
              }}
            >
              {copied ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <pre
            className="overflow-x-auto font-mono text-[11px] leading-relaxed"
            style={{
              color: "color-mix(in srgb, var(--foreground) 74%, var(--module-cinema) 26%)",
              tabSize: 2,
            }}
          >
            <code>{activeExample.code}</code>
          </pre>
        </div>
      </div>
    </section>
  );
};
