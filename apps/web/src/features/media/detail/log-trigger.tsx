import { Check, PenLine } from "lucide-react";
import type { ReactNode } from "react";

export type LogTriggerVariant = "sidebar" | "bar" | "review";

type LogTriggerProps = {
  triggerVariant: "outline" | "ghost";
  triggerLabel: string;
  triggerClassName: string;
  triggerContent: ReactNode;
};

// The same log modal opens from the desktop sidebar, the phone action bar and the phone rating sheet.
export const logTriggerProps = (variant: LogTriggerVariant, hasLogged: boolean): LogTriggerProps => {
  const label = hasLogged ? "Log again" : "Log";

  if (variant === "bar") {
    return {
      triggerVariant: "ghost",
      triggerLabel: "Log",
      triggerClassName:
        "flex min-h-11 flex-col items-center justify-center gap-0.5 border-0 bg-transparent px-1 font-mono text-[10px] font-semibold tracking-[0.08em] text-[#dddddd] uppercase",
      triggerContent: (
        <>
          <PenLine className="size-4" />
          <span>Log</span>
        </>
      ),
    };
  }

  if (variant === "review") {
    return {
      triggerVariant: "ghost",
      triggerLabel: "Write a review",
      triggerClassName: "h-auto border-0 bg-transparent px-0 text-xs text-primary underline underline-offset-2",
      triggerContent: <span>✎ Write a review</span>,
    };
  }

  return {
    triggerVariant: "outline",
    triggerLabel: label,
    triggerClassName:
      "h-auto flex-1 rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]",
    triggerContent: (
      <>
        <Check className="h-3 w-3" />
        <span>{label}</span>
      </>
    ),
  };
};
