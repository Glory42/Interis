import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { highlightExampleCode } from "./code-highlighter";
import { codeExamples } from "./developer-content";

export const DeveloperCodeExamples = () => {
  const [activeExampleIndex, setActiveExampleIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  const activeExample = codeExamples[activeExampleIndex] ?? codeExamples[0];

  useEffect(() => {
    if (!copied) return;
    const timeoutId = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  useEffect(() => {
    let cancelled = false;

    highlightExampleCode(activeExample.code, activeExample.language).then((html) => {
      if (!cancelled) setHighlightedHtml(html);
    });

    return () => {
      cancelled = true;
    };
  }, [activeExample]);

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
    <section className="mb-12">
      <h2 className="mb-5 text-lg font-semibold tracking-tight text-foreground">
        Mini examples
      </h2>
      <div className="overflow-hidden rounded-2xl border developer-shell-border developer-shell-panel">
        <div className="no-scrollbar flex overflow-x-auto border-b border-border/40">
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
                className={cn(
                  "shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-medium transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent developer-shell-muted hover:text-foreground",
                )}
              >
                {example.title}
              </button>
            );
          })}
        </div>

        <div className="px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-primary">
                {activeExample.language}
              </span>
            </div>

            <button
              type="button"
              aria-label="Copy code"
              onClick={() => {
                void handleCopyCode();
              }}
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors",
                copied
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "developer-shell-border developer-shell-muted hover:text-foreground",
              )}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>

          {highlightedHtml ? (
            <div
              className="overflow-hidden rounded-xl text-xs leading-relaxed [&_pre]:m-0 [&_pre]:overflow-x-auto [&_pre]:p-4 [&_pre]:font-mono"
              // Shiki's output is static, developer-authored code from
              // developer-content.ts — never user input.
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          ) : (
            <pre className="overflow-x-auto rounded-xl bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground">
              <code>{activeExample.code}</code>
            </pre>
          )}
        </div>
      </div>
    </section>
  );
};
