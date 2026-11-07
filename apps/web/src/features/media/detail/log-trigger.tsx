import { PenLine } from "lucide-react";
import type { ReactNode } from "react";

type LogTriggerProps = {
  triggerVariant: "primary";
  triggerLabel: string;
  triggerClassName: string;
  triggerContent: ReactNode;
};

// The detail page's one primary action: a full-width Log (or Log again) pill.
export const logTriggerProps = (hasLogged: boolean): LogTriggerProps => {
  const label = hasLogged ? "Log again" : "Log";

  return {
    triggerVariant: "primary",
    triggerLabel: label,
    triggerClassName:
      "h-12 w-full rounded-full text-base font-bold shadow-[0_0_24px_color-mix(in_srgb,var(--primary)_35%,transparent)] sm:h-12",
    triggerContent: (
      <>
        <PenLine aria-hidden className="size-4" />
        <span>{label}</span>
      </>
    ),
  };
};
