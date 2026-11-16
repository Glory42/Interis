import { z } from "zod";
import { PUSH_SERVICE_HOST_SUFFIXES } from "../constants/push.constants";

const isPushServiceUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      PUSH_SERVICE_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))
    );
  } catch {
    return false;
  }
};

const base64UrlKey = (bytes: number, check: (decoded: Buffer) => boolean) =>
  z
    .string()
    .regex(/^[A-Za-z0-9_-]+={0,2}$/, "Must be base64url")
    .refine((value) => {
      const decoded = Buffer.from(value, "base64url");
      return decoded.length === bytes && check(decoded);
    }, `Must decode to ${bytes} bytes`);

const PushEndpointSchema = z
  .string()
  .max(2048)
  .refine(isPushServiceUrl, "Must be an https URL of a known push service");

// The shape of PushSubscription.toJSON() in the browser.
export const SubscribeBodySchema = z.object({
  endpoint: PushEndpointSchema,
  keys: z.object({
    // An uncompressed P-256 public key.
    p256dh: base64UrlKey(65, (decoded) => decoded[0] === 0x04),
    auth: base64UrlKey(16, () => true),
  }),
});

export type SubscribeBody = z.infer<typeof SubscribeBodySchema>;

export const UnsubscribeBodySchema = z.object({
  endpoint: z.string().min(1).max(2048),
});

export type UnsubscribeBody = z.infer<typeof UnsubscribeBodySchema>;

export const UpdatePreferencesBodySchema = z
  .object({
    follows: z.boolean(),
    likes: z.boolean(),
    comments: z.boolean(),
    moderation: z.boolean(),
  })
  .partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, "Set at least one category");

export type UpdatePreferencesBody = z.infer<typeof UpdatePreferencesBodySchema>;
