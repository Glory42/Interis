import { createECDH, randomBytes } from "node:crypto";
import { generateVAPIDKeys } from "web-push";
import { eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import type { CookieJar } from "../../support/app/cookie-jar";
import {
  overrideWebPushForTests,
  type PushTarget,
} from "../../../src/infrastructure/push/web-push.client";

export type SentPush = { target: PushTarget; payload: Record<string, string> };

// Turns push on with throwaway keys and a recording transport; nothing leaves the process.
export const installFakePush = () => {
  const keys = generateVAPIDKeys();
  const sent: SentPush[] = [];
  const statusByEndpoint = new Map<string, number | "throw">();

  const restore = overrideWebPushForTests({
    vapid: { ...keys, subject: "mailto:push-tests@interis.test" },
    transport: async (target, payload) => {
      sent.push({ target, payload: JSON.parse(payload) as Record<string, string> });
      const status = statusByEndpoint.get(target.endpoint) ?? 201;
      if (status === "throw") throw new Error("network down");
      return { statusCode: status };
    },
  });

  return { publicKey: keys.publicKey, sent, statusByEndpoint, restore };
};

export const makeSubscription = (tag = randomBytes(6).toString("hex")) => {
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();
  return {
    endpoint: `https://fcm.googleapis.com/fcm/send/${tag}`,
    keys: { p256dh: ecdh.getPublicKey("base64url"), auth: randomBytes(16).toString("base64url") },
  };
};

export const sendJson = (baseUrl: string, jar: CookieJar | undefined, method: string, path: string, body?: unknown) =>
  apiRequest(
    baseUrl,
    path,
    {
      method,
      headers: body === undefined ? {} : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    jar,
  );

export const signUpWithId = async (baseUrl: string, prefix: string) => {
  const signedUp = await signUpTestUser(baseUrl, prefix);
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.username, signedUp.username));
  if (!row) throw new Error("Signed-up user not found");
  return { ...signedUp, userId: row.id };
};
