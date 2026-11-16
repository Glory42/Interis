import { removeDeviceSubscription } from "@/features/push/api";
import { unsubscribeThisDevice } from "@/features/push/push-device";

const RELEASE_TIMEOUT_MS = 3_000;

// Before signing out, so the next person on this browser doesn't get this account's pushes.
// Best effort and time-boxed: it never blocks or fails sign-out.
export const releaseDevicePush = async (): Promise<void> => {
  const release = async () => {
    const endpoint = await unsubscribeThisDevice();
    if (endpoint) await removeDeviceSubscription(endpoint);
  };
  await Promise.race([
    release().catch(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, RELEASE_TIMEOUT_MS)),
  ]);
};
