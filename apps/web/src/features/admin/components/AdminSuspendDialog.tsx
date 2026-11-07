import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useSuspendFor } from "@/features/admin/hooks/useAdminUserDetail";
import { isApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const LENGTHS = [
  { days: 1, label: "24 hours" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: undefined, label: "Until lifted" },
] as const;

type Length = (typeof LENGTHS)[number];

export const AdminSuspendDialog = ({ username, onClose }: { username: string; onClose: () => void }) => {
  const mutation = useSuspendFor();
  const [length, setLength] = useState<Length>(LENGTHS[1]);
  const [reason, setReason] = useState("");

  return (
    <ConfirmDialog
      isOpen
      context={`Suspend · @${username}`}
      title={`Suspend @${username}`}
      confirmLabel={length.days ? `Suspend for ${length.label}` : "Suspend until lifted"}
      isDestructive
      requirePassword
      isConfirming={mutation.isPending}
      error={mutation.isError ? (isApiError(mutation.error) ? mutation.error.message : "Could not suspend.") : null}
      onClose={onClose}
      onConfirm={(adminPassword) =>
        mutation.mutate(
          { username, adminPassword: adminPassword ?? "", reason: reason.trim() || undefined, durationDays: length.days },
          { onSuccess: onClose },
        )
      }
    >
      <div className="space-y-3">
        <div role="radiogroup" aria-label="Length" className="flex flex-wrap gap-2">
          {LENGTHS.map((option) => (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={option === length}
              onClick={() => setLength(option)}
              className={cn(
                "body-s rounded-[2px] border px-2.5 py-1",
                option === length ? "border-[color:var(--primary)] text-foreground" : "border-[color:var(--line)] text-muted-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="mono-meta uppercase text-muted-foreground">
          {`${length.days ? `Ends ${length.label} from now` : "No end date"} · signed out now · their content stays visible`}
        </p>
        <label className="block">
          <span className="kicker mb-1 block text-muted-foreground">Reason (shown to the user, saved to the audit log)</span>
          <textarea
            value={reason}
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            className="body-s min-h-16 w-full rounded-[2px] border border-[color:var(--line)] bg-transparent px-2.5 py-1.5 text-foreground outline-none focus:border-[color:var(--primary)]"
          />
        </label>
      </div>
    </ConfirmDialog>
  );
};
