import { X } from "lucide-react";
import { dismissToast, useToasts, type ToastTone } from "@/lib/toast";
import { cn } from "@/lib/utils";

const toneEdge: Record<ToastTone, string> = {
  neutral: "shadow-[inset_2px_0_var(--line-strong)]",
  success: "shadow-[inset_2px_0_var(--success)]",
  danger: "shadow-[inset_2px_0_var(--danger)]",
};

// App-wide toast region (mounted once in the root layout). role="status" makes
// screen readers announce each toast without moving focus. On phones it sits
// above the sticky bottom bar.
export const Toaster = () => {
  const toasts = useToasts();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-160 flex flex-col items-center gap-2 px-4 sm:bottom-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border border-[color:var(--line-strong)] bg-card px-3 py-2.5 text-[12.5px] animate-fade-up",
            toneEdge[toast.tone],
          )}
        >
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="font-semibold text-foreground">{toast.title}</p>
            {toast.detail ? <p className="text-xs text-muted-foreground">{toast.detail}</p> : null}
          </div>
          {toast.action ? (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                dismissToast(toast.id);
              }}
              className="shrink-0 font-semibold text-primary underline-offset-2 hover:underline"
            >
              {toast.action.label}
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => dismissToast(toast.id)}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
