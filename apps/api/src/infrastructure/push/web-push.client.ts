import { generateRequestDetails } from "web-push";
import { env } from "../config/env";
import { logger } from "../../commons/utils/logger";

export type VapidConfig = { publicKey: string; privateKey: string; subject: string };

export type PushTarget = { endpoint: string; p256dh: string; auth: string };

// Resolves with the push service's status code; rejects on network errors or a bad subscription key.
export type PushTransport = (
  target: PushTarget,
  payload: string,
  vapid: VapidConfig,
) => Promise<{ statusCode: number }>;

const PUSH_TTL_SECONDS = 24 * 60 * 60;
const PUSH_TIMEOUT_MS = 10_000;

const readVapidFromEnv = (): VapidConfig | null => {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    if (VAPID_PUBLIC_KEY || VAPID_PRIVATE_KEY || VAPID_SUBJECT) {
      logger.warn("Web Push disabled: set all of VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT");
    }
    return null;
  }
  return { publicKey: VAPID_PUBLIC_KEY, privateKey: VAPID_PRIVATE_KEY, subject: VAPID_SUBJECT };
};

// web-push signs and encrypts; Bun's fetch delivers, so a hung push service can't hold a socket open.
const fetchTransport: PushTransport = async (target, payload, vapid) => {
  const request = generateRequestDetails(
    { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
    payload,
    { vapidDetails: vapid, TTL: PUSH_TTL_SECONDS, urgency: "normal" },
  );
  const response = await fetch(request.endpoint, {
    method: request.method,
    headers: request.headers as Record<string, string>,
    body: request.body ?? undefined,
    signal: AbortSignal.timeout(PUSH_TIMEOUT_MS),
  });
  await response.body?.cancel();
  return { statusCode: response.status };
};

let vapidConfig = readVapidFromEnv();
let transport: PushTransport = fetchTransport;

export const getVapidConfig = (): VapidConfig | null => vapidConfig;

export const sendWebPush = (target: PushTarget, payload: string): Promise<{ statusCode: number }> => {
  if (!vapidConfig) {
    return Promise.reject(new Error("Web Push is not configured"));
  }
  return transport(target, payload, vapidConfig);
};

// Tests swap in keys and a fake transport so nothing reaches a real push service.
export const overrideWebPushForTests = (override: {
  vapid: VapidConfig | null;
  transport: PushTransport;
}): (() => void) => {
  const previous = { vapid: vapidConfig, transport };
  vapidConfig = override.vapid;
  transport = override.transport;
  return () => {
    vapidConfig = previous.vapid;
    transport = previous.transport;
  };
};
