import { Switch } from "@/components/ui/switch";
import { useDisablePush, useEnablePush, usePushDevice } from "@/features/push/hooks/usePush";
import { PushPermissionError, type PushDeviceState } from "@/features/push/push-device";

const NOTE_BY_KIND: Partial<Record<PushDeviceState["kind"], string>> = {
  unsupported: "This browser can't receive push notifications.",
  "needs-install":
    "On iPhone and iPad, push only works in the installed app: tap Share, then Add to Home Screen, open Interis from your Home Screen and turn this on there.",
  blocked:
    "Notifications are blocked for this site. Allow them in your browser's site settings, then come back here.",
};

const errorMessage = (error: unknown): string => {
  if (error instanceof PushPermissionError) {
    return error.permission === "denied"
      ? "Notifications are blocked for this site."
      : "You didn't allow notifications, so push stays off.";
  }
  return "Couldn't change push on this device. Try again.";
};

export const PushDeviceToggle = ({ publicKey }: { publicKey: string }) => {
  const deviceQuery = usePushDevice(true);
  const enableMutation = useEnablePush();
  const disableMutation = useDisablePush();
  const state = deviceQuery.data;
  const note = state ? NOTE_BY_KIND[state.kind] : undefined;
  const isPending = enableMutation.isPending || disableMutation.isPending;
  const error = enableMutation.error ?? disableMutation.error;

  if (!state) {
    return <p className="body-s text-muted-foreground">Checking this device…</p>;
  }

  return (
    <div className="space-y-1.5">
      {note ? (
        <>
          <p className="body text-foreground">Push notifications on this device</p>
          <p className="body-s text-muted-foreground">{note}</p>
        </>
      ) : (
        <>
          <Switch
            label="Push notifications on this device"
            checked={state.kind === "on"}
            disabled={isPending}
            onCheckedChange={(checked) => {
              enableMutation.reset();
              disableMutation.reset();
              if (checked) enableMutation.mutate(publicKey);
              else disableMutation.mutate();
            }}
          />
          <p className="body-s text-muted-foreground">
            {state.kind === "on"
              ? "This device gets a notification even when Interis is closed."
              : "Your browser will ask for permission when you turn this on."}
          </p>
        </>
      )}
      {error && !note ? (
        <p role="alert" className="body-s text-[color:var(--danger)]">
          {errorMessage(error)}
        </p>
      ) : null}
    </div>
  );
};
