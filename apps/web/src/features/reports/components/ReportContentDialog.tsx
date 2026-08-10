import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalShell } from "@/components/ui/ModalShell";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitReport } from "@/features/reports/hooks/useReports";
import type { ReportReason, ReportTargetType } from "@/features/reports/api";
import { isApiError } from "@/lib/api-client";
import { runDialogSubmit } from "@/lib/fire-and-forget";
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

  // Failure is surfaced via submitReportMutation.isError/.error below;
  // runDialogSubmit only guards the fire-and-forget `void handleSubmit()`
  // call site from an unhandled promise rejection.
  const handleSubmit = () =>
    runDialogSubmit(async () => {
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
    });

  return (
    <ModalShell onClose={onClose} containerClassName="max-w-md" ariaCloseLabel="Close report dialog">
      <section className="theme-modal-panel relative w-full overflow-hidden border border-border/80 bg-card/95 p-0 animate-fade-up">
        <ModalHeader title={`Report ${targetType}`} onClose={onClose} closeAriaLabel="Close report dialog" align="start" />

        {submitted ? (
            <div className="space-y-4 px-4 py-6 text-center">
              <p className="font-mono text-sm text-foreground">
                Thanks — this has been reported for review.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-border/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
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
                  className="rounded-full border border-border/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
                >
                  cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleSubmit();
                  }}
                  disabled={submitReportMutation.isPending}
                  className="rounded-full border border-primary/45 bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-primary disabled:cursor-not-allowed disabled:opacity-50"
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
    </ModalShell>
  );
};
