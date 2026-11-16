// What this browser can do with Web Push, and its subscription. No network calls to the API here.
export type PushDeviceState =
  | { kind: "unsupported" }
  | { kind: "needs-install" }
  | { kind: "blocked" }
  | { kind: "off" }
  | { kind: "on"; endpoint: string };

export class PushPermissionError extends Error {
  readonly permission: NotificationPermission;

  constructor(permission: NotificationPermission) {
    super(permission === "denied" ? "Notifications are blocked" : "Notifications weren't allowed");
    this.name = "PushPermissionError";
    this.permission = permission;
  }
}

const SERVICE_WORKER_TIMEOUT_MS = 10_000;

const isIos = (): boolean =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);

const isStandalone = (): boolean =>
  window.matchMedia?.("(display-mode: standalone)").matches === true ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isPushSupported = (): boolean =>
  "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

const currentSubscription = async (): Promise<PushSubscription | null> => {
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription()) ?? null;
};

export const readPushDeviceState = async (): Promise<PushDeviceState> => {
  if (!isPushSupported()) {
    // iOS only exposes Web Push to web apps added to the Home Screen.
    return { kind: isIos() && !isStandalone() ? "needs-install" : "unsupported" };
  }
  if (Notification.permission === "denied") return { kind: "blocked" };

  const subscription = await currentSubscription();
  return subscription && Notification.permission === "granted"
    ? { kind: "on", endpoint: subscription.endpoint }
    : { kind: "off" };
};

const decodeBase64Url = (value: string): Uint8Array<ArrayBuffer> => {
  const base64 = (value + "=".repeat((4 - (value.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
};

const sameKey = (current: ArrayBuffer | null, wanted: Uint8Array): boolean => {
  if (!current || current.byteLength !== wanted.length) return false;
  const bytes = new Uint8Array(current);
  return bytes.every((byte, index) => byte === wanted[index]);
};

const serviceWorkerReady = (): Promise<ServiceWorkerRegistration> =>
  Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("The service worker isn't running")), SERVICE_WORKER_TIMEOUT_MS),
    ),
  ]);

// Call from a click handler only: browsers show the permission prompt for a user gesture.
export const subscribeThisDevice = async (publicKey: string): Promise<PushSubscriptionJSON> => {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new PushPermissionError(permission);

  const registration = await serviceWorkerReady();
  const key = decodeBase64Url(publicKey);
  const existing = await registration.pushManager.getSubscription();
  if (existing && sameKey(existing.options.applicationServerKey, key)) return existing.toJSON();
  // Subscribed under an older VAPID key: the server can't reach it any more.
  await existing?.unsubscribe();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: key,
  });
  return subscription.toJSON();
};

// Drops the browser's subscription and returns its endpoint, so the server copy can go too.
export const unsubscribeThisDevice = async (): Promise<string | null> => {
  if (!isPushSupported()) return null;
  const subscription = await currentSubscription();
  if (!subscription) return null;
  await subscription.unsubscribe();
  return subscription.endpoint;
};
