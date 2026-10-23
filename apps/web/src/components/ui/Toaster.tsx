import { X } from "lucide-react";
import { dismissToast, useToasts } from "@/lib/toast";

// App-wide toast region (mounted once in the root layout). role="status" on
// each toast makes screen readers announce it without moving focus.
export const Toaster = () => {
  const toasts = useToasts();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-160 flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="theme-modal-panel pointer-events-auto flex w-full max-w-sm items-start gap-3 border border-destructive/45 bg-card/95 px-4 py-3 shadow-lg animate-fade-up"
        >
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-sm font-semibold text-foreground">{toast.title}</p>
            {toast.detail ? (
              <p className="text-xs text-muted-foreground">{toast.detail}</p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => dismissToast(toast.id)}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
