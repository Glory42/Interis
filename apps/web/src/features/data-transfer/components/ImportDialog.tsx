import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import FocusLock from "react-focus-lock";
import { X, CheckCircle, ArrowRight, XCircle } from "lucide-react";
import type { ImportStreamState, TerminalLine } from "../hooks/useImportStream";

type ImportDialogProps = {
  isOpen: boolean;
  state: ImportStreamState;
  onBackground: () => void;
  onClose: () => void;
};

export const ImportDialog = ({
  isOpen,
  state,
  onBackground,
  onClose,
}: ImportDialogProps) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state.phase === "done") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, state.phase, onClose]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [state]);

  if (!isOpen) return null;

  const isRunning = state.phase === "running";
  const isDone = state.phase === "done";
  const isError = state.phase === "error";

  const lines = state.phase === "running" || state.phase === "done" ? state.lines : [];
  const format =
    state.phase === "running" || state.phase === "done" ? state.format : "";
  const total =
    state.phase === "running" || state.phase === "done" ? state.total : 0;
  const processed = state.phase === "running" ? state.processed : total;
  const summary = state.phase === "done" ? state.summary : null;

  return createPortal(
    <div className="theme-modal-overlay fixed inset-0 z-140 bg-background/70 backdrop-blur-sm">
      <div className="flex h-full items-center justify-center p-4">
        <FocusLock returnFocus className="contents">
        <section className="theme-modal-panel relative w-full max-w-2xl overflow-hidden border border-border/80 bg-card/95 animate-fade-up">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {isDone ? "import complete" : isError ? "import failed" : "importing"}
              </span>
              {format && (
                <>
                  <span className="text-border/60">·</span>
                  <span className="font-mono text-[10px] text-muted-foreground/60">
                    {format}
                  </span>
                </>
              )}
            </div>

            {isDone || isError ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close import dialog"
                className="text-muted-foreground/60 hover:text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {/* Progress bar */}
          {isRunning && total > 0 && (
            <div className="h-px bg-border/40">
              <div
                className="h-full bg-primary/50 transition-all duration-300"
                style={{ width: `${Math.round((processed / total) * 100)}%` }}
              />
            </div>
          )}

          {/* Terminal log */}
          <div
            ref={logRef}
            className="h-80 overflow-y-auto bg-background/40 p-4 font-mono text-xs"
          >
            {(isRunning || isDone) && total > 0 && (
              <p className="mb-3 text-muted-foreground/70">
                {`> Starting import (${total} entries)…`}
              </p>
            )}

            {isError && (
              <p className="text-destructive">
                {`> Error: ${state.message}`}
              </p>
            )}

            <ul className="space-y-0.5">
              {lines.map((line) => (
                <TerminalRow key={line.id} line={line} />
              ))}
            </ul>

            {isRunning && (
              <p className="mt-2 animate-pulse text-muted-foreground/50">
                {`> Processing ${processed} / ${total}…`}
              </p>
            )}

            {isDone && summary && (
              <p className="mt-3 text-muted-foreground/70">
                {`> Done — ${summary.imported} imported · ${summary.skipped} skipped · ${summary.failed} failed`}
              </p>
            )}
          </div>

          {/* Summary stats (done only) */}
          {isDone && summary && (
            <div className="grid grid-cols-4 border-t border-border/60">
              {(
                [
                  { label: "Total", value: summary.total },
                  { label: "Imported", value: summary.imported, green: true },
                  { label: "Skipped", value: summary.skipped },
                  { label: "Failed", value: summary.failed, red: summary.failed > 0 },
                ] as const
              ).map((s) => (
                <div key={s.label} className="border-r border-border/40 px-4 py-3 last:border-r-0">
                  <p
                    className={`font-mono text-base font-bold ${
                      "green" in s && s.green
                        ? "text-green-500"
                        : "red" in s && s.red
                          ? "text-destructive"
                          : "text-foreground"
                    }`}
                  >
                    {s.value}
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 border-t border-border/60 px-4 py-3">
            {isRunning && (
              <button
                type="button"
                onClick={onBackground}
                className="border border-border/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
              >
                Work in background
              </button>
            )}
            {(isDone || isError) && (
              <button
                type="button"
                onClick={onClose}
                className="border border-border/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
              >
                Close
              </button>
            )}
          </div>
        </section>
        </FocusLock>
      </div>
    </div>,
    document.body,
  );
};

function TerminalRow({ line }: { line: TerminalLine }) {
  const label = line.year ? `${line.title} (${line.year})` : line.title;

  if (line.status === "imported") {
    return (
      <li className="flex items-baseline gap-2 text-green-500/80">
        <CheckCircle className="mt-0.5 h-3 w-3 shrink-0" />
        <span>{label}</span>
      </li>
    );
  }

  if (line.status === "skipped") {
    return (
      <li className="flex items-baseline gap-2 text-muted-foreground/50">
        <ArrowRight className="mt-0.5 h-3 w-3 shrink-0" />
        <span>
          {label}
          {line.reason && (
            <span className="text-muted-foreground/35"> · {line.reason}</span>
          )}
        </span>
      </li>
    );
  }

  return (
    <li className="flex items-baseline gap-2 text-destructive/70">
      <XCircle className="mt-0.5 h-3 w-3 shrink-0" />
      <span>
        {label || "—"}
        {line.reason && (
          <span className="text-destructive/50"> · {line.reason}</span>
        )}
      </span>
    </li>
  );
}
