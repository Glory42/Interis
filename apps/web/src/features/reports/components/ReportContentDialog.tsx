import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import FocusLock from "react-focus-lock";
import { Loader2, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitReport } from "@/features/reports/hooks/useReports";
import type { ReportReason, ReportTargetType } from "@/features/reports/api";
import { isApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type ReportContentDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
};

const REASON_OPTIONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Other" },
];

export const ReportContentDialog = ({ isOpen, ...rest }: ReportContentDialogProps) => {
  return isOpen ? (
    <ReportContentDialogContent key={`${rest.targetType}-${rest.targetId}`} {...rest} />
  ) : null;
};

type ReportContentDialogContentProps = Omit<ReportContentDialogProps, "isOpen">;

const ReportContentDialogContent = ({
  onClose,
  targetType,
  targetId,
}: ReportContentDialogContentProps) => {
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const submitReportMutation = useSubmitReport();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const handleSubmit = async () => {
    if (submitReportMutation.isPending) {
      return;
    }

    await submitReportMutation.mutateAsync({
      targetType,
      targetId,
      reason,
      details: details.trim().length > 0 ? details.trim() : undefined,
    });
    setSubmitted(true);
  };

  return createPortal(
    <div className="theme-modal-overlay fixed inset-0 z-140 bg-background/70 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close report dialog"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="relative mx-auto flex h-full w-full max-w-md items-center justify-center p-4">
        <FocusLock returnFocus className="contents">
        <section className="theme-modal-panel relative w-full overflow-hidden border border-border/80 bg-card/95 p-0 animate-fade-up">
          <div className="flex items-start justify-between border-b border-border/70 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Report {targetType}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close report dialog"
              className="inline-flex h-7 w-7 items-center justify-center border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {submitted ? (
            <div className="space-y-4 px-4 py-6 text-center">
              <p className="font-mono text-sm text-foreground">
                Thanks — this has been reported for review.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="border border-border/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-3 px-4 py-4">
              <div className="space-y-1.5">
                {REASON_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 border px-3 py-1.5 font-mono text-xs transition-colors",
                      reason === option.value
                        ? "border-primary/45 bg-primary/10 text-primary"
                        : "border-border/70 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={option.value}
                      checked={reason === option.value}
                      onChange={() => setReason(option.value)}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                ))}
              </div>

              <Textarea
                value={details}
                onChange={(event) => {
                  if (event.target.value.length <= 1000) {
                    setDetails(event.target.value);
                  }
                }}
                placeholder="Additional details (optional)"
                className="min-h-20 border-border/75 bg-background/45 font-mono text-sm"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="border border-border/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
                >
                  cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleSubmit();
                  }}
                  disabled={submitReportMutation.isPending}
                  className="border border-primary/45 bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitReportMutation.isPending ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> submitting
                    </span>
                  ) : (
                    "submit report"
                  )}
                </button>
              </div>

              {submitReportMutation.isError ? (
                <p role="alert" className="font-mono text-[11px] text-destructive">
                  {isApiError(submitReportMutation.error)
                    ? submitReportMutation.error.message
                    : "Could not submit report."}
                </p>
              ) : null}
            </div>
          )}
        </section>
        </FocusLock>
      </div>
    </div>,
    document.body
  );
};
